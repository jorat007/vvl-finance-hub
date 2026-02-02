-- Fix: Prevent users from self-assigning admin role during signup
-- This addresses the signup_role_manipulation security vulnerability
-- The trigger now forces 'agent' role for all new signups, ignoring any client-supplied role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO public.profiles (user_id, name, mobile)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.phone, '')
    );
    
    -- SECURITY FIX: Always assign 'agent' role for new signups
    -- Admins can promote users to admin role through the admin panel
    -- This prevents privilege escalation via manipulated signup metadata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        'agent'::app_role  -- Force agent role, ignore client-supplied role
    );
    
    RETURN NEW;
END;
$$;