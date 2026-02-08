
-- 1. Fix Payment RLS - Add UPDATE policy for agents on own payments
CREATE POLICY "Agents can update own payments"
ON public.payments
FOR UPDATE
USING (agent_id = auth.uid());

-- 2. Add Manager SELECT policy for payments
CREATE POLICY "Managers can view payments of reporting agents"
ON public.payments
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = payments.customer_id
    AND c.is_deleted = false
    AND (
      c.assigned_agent_id = auth.uid()
      OR c.assigned_agent_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
      )
    )
  )
);

-- 3. Add Manager UPDATE policy for payments
CREATE POLICY "Managers can update payments of reporting agents"
ON public.payments
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = payments.customer_id
    AND c.is_deleted = false
    AND (
      c.assigned_agent_id = auth.uid()
      OR c.assigned_agent_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
      )
    )
  )
);

-- 4. Add Manager INSERT policy for payments
CREATE POLICY "Managers can create payments for reporting agents customers"
ON public.payments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = payments.customer_id
    AND c.is_deleted = false
    AND (
      c.assigned_agent_id = auth.uid()
      OR c.assigned_agent_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
      )
    )
  )
);

-- 5. Add Manager SELECT policy for customers
CREATE POLICY "Managers can view customers of reporting agents"
ON public.customers
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND (
    assigned_agent_id = auth.uid()
    OR assigned_agent_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
    )
  )
);

-- 6. Add Manager UPDATE policy for customers
CREATE POLICY "Managers can update customers of reporting agents"
ON public.customers
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND (
    assigned_agent_id = auth.uid()
    OR assigned_agent_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
    )
  )
);

-- 7. Fund Management Table
CREATE TABLE public.fund_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  reference_id UUID,
  reference_table TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID
);

ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all fund transactions"
ON public.fund_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view fund transactions"
ON public.fund_transactions FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Authenticated users can insert fund transactions"
ON public.fund_transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Customer KYC fields
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- 9. Profile avatar URL
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 10. Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Auth users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 11. Feature permissions for fund management
INSERT INTO public.feature_permissions (feature_key, feature_name, description, admin_access, manager_access, agent_access)
SELECT 'fund_manage', 'Fund Management', 'Add, withdraw, and manage organizational funds', true, false, false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_permissions WHERE feature_key = 'fund_manage');

INSERT INTO public.feature_permissions (feature_key, feature_name, description, admin_access, manager_access, agent_access)
SELECT 'fund_view', 'View Fund Balance', 'View current fund balance and transaction history', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_permissions WHERE feature_key = 'fund_view');

-- 12. Agent stats with date range function
CREATE OR REPLACE FUNCTION public.get_agent_stats_range(p_from date DEFAULT CURRENT_DATE, p_to date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  agent_id uuid,
  agent_name text,
  total_collected numeric,
  total_pending numeric,
  customer_count bigint,
  paid_count bigint,
  not_paid_count bigint,
  promised_count bigint,
  total_target numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ur.user_id as agent_id,
    p.name as agent_name,
    COALESCE(SUM(CASE WHEN pay.status = 'paid' AND pay.date >= p_from AND pay.date <= p_to THEN pay.amount ELSE 0 END), 0) as total_collected,
    COALESCE(SUM(CASE WHEN pay.status = 'not_paid' AND pay.date >= p_from AND pay.date <= p_to THEN pay.amount ELSE 0 END), 0) as total_pending,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT CASE WHEN pay.status = 'paid' AND pay.date >= p_from AND pay.date <= p_to THEN c.id END) as paid_count,
    COUNT(DISTINCT CASE WHEN pay.status = 'not_paid' AND pay.date >= p_from AND pay.date <= p_to THEN c.id END) as not_paid_count,
    COUNT(DISTINCT CASE WHEN pay.promised_date >= p_from AND pay.promised_date <= p_to THEN c.id END) as promised_count,
    COALESCE(SUM(DISTINCT c.daily_amount), 0) as total_target
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id AND p.is_deleted = FALSE
  LEFT JOIN public.customers c ON c.assigned_agent_id = ur.user_id AND c.is_deleted = FALSE AND c.status = 'active'
  LEFT JOIN public.payments pay ON pay.customer_id = c.id AND pay.is_deleted = FALSE
  WHERE ur.role IN ('agent', 'manager') AND ur.is_active = TRUE
  GROUP BY ur.user_id, p.name
$$;
