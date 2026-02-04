-- Create feature_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS public.feature_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    description TEXT,
    admin_access BOOLEAN NOT NULL DEFAULT true,
    manager_access BOOLEAN NOT NULL DEFAULT false,
    agent_access BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage feature permissions"
ON public.feature_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view feature permissions"
ON public.feature_permissions FOR SELECT
TO authenticated
USING (true);

-- Add reporting_to column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reporting_to UUID REFERENCES auth.users(id);

-- Add whatsapp_number column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Insert default feature permissions
INSERT INTO public.feature_permissions (feature_key, feature_name, description, admin_access, manager_access, agent_access) VALUES
('customer_create', 'Create Customer', 'Ability to create new customers', true, true, false),
('customer_update', 'Update Customer', 'Ability to update customer details', true, true, true),
('customer_delete', 'Delete Customer', 'Ability to soft delete customers', true, false, false),
('payment_create', 'Create Payment', 'Ability to record new payments', true, true, true),
('payment_update', 'Update Payment', 'Ability to update payment records', true, true, false),
('payment_delete', 'Delete Payment', 'Ability to soft delete payments', true, false, false),
('payment_update_own', 'Update Own Payments', 'Ability to update own payment records', true, true, true),
('payment_same_day_only', 'Same Day Payment Only', 'Restrict payment updates to same day', false, false, true),
('user_create', 'Create User', 'Ability to create new users', true, false, false),
('user_update', 'Update User', 'Ability to update user details', true, false, false),
('user_delete', 'Delete User', 'Ability to soft delete users', true, false, false),
('view_dashboard', 'View Dashboard', 'Access to main dashboard', true, true, true),
('view_agent_report', 'View Agent Report', 'Access to agent performance reports', true, true, false),
('view_customer_ledger', 'View Customer Ledger', 'Access to customer payment history', true, true, true),
('view_all_customers', 'View All Customers', 'See all customers regardless of assignment', true, true, false)
ON CONFLICT (feature_key) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_feature_permissions_updated_at
BEFORE UPDATE ON public.feature_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();