
-- 1. Fix fund_transactions: Drop overly permissive INSERT policy, replace with admin/manager only
DROP POLICY IF EXISTS "Authenticated users can insert fund transactions" ON public.fund_transactions;

CREATE POLICY "Admins and managers can insert fund transactions"
ON public.fund_transactions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- 2. Make customer-kyc bucket private (it's currently public)
UPDATE storage.buckets SET public = false WHERE id = 'customer-kyc';

-- 3. Add storage RLS policies for customer-kyc bucket
-- Clean up any existing policies first
DROP POLICY IF EXISTS "Admins can view all KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view assigned customer KYC" ON storage.objects;
DROP POLICY IF EXISTS "Managers can view reporting agent KYC" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can upload KYC" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can update KYC" ON storage.objects;

-- Admins: full access to KYC files
CREATE POLICY "Admins can view all KYC files"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-kyc' AND has_role(auth.uid(), 'admin'::app_role));

-- Managers can view KYC for their reporting agents' customers
CREATE POLICY "Managers can view reporting agent KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-kyc' AND
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id::text = (storage.foldername(name))[1]
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

-- Agents can view KYC for assigned customers only
CREATE POLICY "Agents can view assigned customer KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-kyc' AND
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND c.assigned_agent_id = auth.uid()
    AND c.is_deleted = false
  )
);

-- Admins and managers can upload KYC files
CREATE POLICY "Admins and managers can upload KYC"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-kyc' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- Admins and managers can update KYC files
CREATE POLICY "Admins and managers can update KYC"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customer-kyc' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);
