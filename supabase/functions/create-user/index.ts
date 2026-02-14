import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .single();

    const callerRole = roleData?.role;
    if (!callerRole || (callerRole !== "admin" && callerRole !== "manager")) {
      return new Response(JSON.stringify({ error: "Only admins and managers can create users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, mobile, whatsapp_number, role, reporting_to } = await req.json();

    // Managers can only create staff (agents)
    if (callerRole === "manager" && role !== "agent") {
      return new Response(JSON.stringify({ error: "Managers can only create Staff users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !password || !name || !mobile) {
      return new Response(JSON.stringify({ error: "email, password, name, and mobile are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["admin", "manager", "agent"];
    const targetRole = validRoles.includes(role) ? role : "agent";

    // Use admin client to create user (no session hijack)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        mobile,
        whatsapp_number: whatsapp_number || null,
        reporting_to: reporting_to || null,
        role: targetRole,
      },
    });

    if (createError) {
      // Check for duplicate
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        return new Response(JSON.stringify({ error: "A user with this mobile number already exists" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: createError.message || "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!newUser?.user) {
      return new Response(JSON.stringify({ error: "User creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUser.user.id;

    // The DB trigger creates profile + agent role. Now update role if not agent.
    if (targetRole !== "agent") {
      // Wait for trigger to complete
      await new Promise((r) => setTimeout(r, 500));

      const { error: roleError } = await adminClient
        .from("user_roles")
        .update({ role: targetRole })
        .eq("user_id", newUserId);

      if (roleError) {
        console.error("Role update error:", roleError);
      }
    }

    // Update reporting_to and whatsapp in profile
    if (reporting_to || whatsapp_number) {
      const updateData: Record<string, unknown> = {};
      if (reporting_to) updateData.reporting_to = reporting_to;
      if (whatsapp_number) updateData.whatsapp_number = whatsapp_number;

      await adminClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", newUserId);
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: caller.id,
      table_name: "auth.users",
      action: "admin_create_user",
      record_id: newUserId,
      new_data: { name, mobile, role: targetRole, created_by: caller.id },
    });

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err: unknown) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
