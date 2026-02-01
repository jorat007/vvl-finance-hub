import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  mobile: string;
  role: 'admin' | 'agent';
  is_active: boolean;
  customer_count?: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  user_name?: string;
}

export function useAgents() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      // Get all user roles with profile info
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active');

      if (rolesError) throw rolesError;

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, mobile')
        .eq('is_deleted', false);

      if (profilesError) throw profilesError;

      // Get customer counts per agent
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('assigned_agent_id')
        .eq('is_deleted', false);

      if (customersError) throw customersError;

      // Combine data
      const agents: Agent[] = userRoles.map((ur) => {
        const profile = profiles.find((p) => p.user_id === ur.user_id);
        const customerCount = customers.filter((c) => c.assigned_agent_id === ur.user_id).length;

        return {
          id: ur.user_id,
          user_id: ur.user_id,
          name: profile?.name || 'Unknown',
          mobile: profile?.mobile || '',
          role: ur.role as 'admin' | 'agent',
          is_active: ur.is_active,
          customer_count: customerCount,
        };
      });

      return agents;
    },
    enabled: !!user && role === 'admin',
  });
}

export function useAuditLogs() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get user names from profiles
      const userIds = [...new Set(logs.map((l) => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const logsWithNames: AuditLog[] = logs.map((log) => ({
        ...log,
        old_data: log.old_data as Record<string, unknown> | null,
        new_data: log.new_data as Record<string, unknown> | null,
        user_name: profiles?.find((p) => p.user_id === log.user_id)?.name || 'Unknown',
      }));

      return logsWithNames;
    },
    enabled: !!user && role === 'admin',
  });
}

export function useUnassignedCustomers() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['unassigned-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('assigned_agent_id', null)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'admin',
  });
}

export function useAssignCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, agentId }: { customerId: string; agentId: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ assigned_agent_id: agentId })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-customers'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useToggleAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useAgentStats() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_daily_stats');
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'admin',
  });
}
