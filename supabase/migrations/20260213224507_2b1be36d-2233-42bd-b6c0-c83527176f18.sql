
-- 1. Fix: Agents should see ALL payments for their assigned customers (not just own agent_id)
DROP POLICY IF EXISTS "Agents can view own payments" ON public.payments;
CREATE POLICY "Agents can view payments for assigned customers"
ON public.payments FOR SELECT
USING (
  agent_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.id = payments.customer_id 
    AND c.assigned_agent_id = auth.uid() 
    AND c.is_deleted = false
  )
);

-- 2. Managers can view profiles of staff reporting to them
CREATE POLICY "Managers can view reporting agents profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND reporting_to = auth.uid()
);

-- 3. Managers can view roles of staff reporting to them
CREATE POLICY "Managers can view reporting agents roles"
ON public.user_roles FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND user_id IN (
    SELECT pr.user_id FROM profiles pr 
    WHERE pr.reporting_to = auth.uid() AND pr.is_deleted = FALSE
  )
);

-- 4. Update get_agent_stats_range to respect role hierarchy
CREATE OR REPLACE FUNCTION public.get_agent_stats_range(p_from date DEFAULT CURRENT_DATE, p_to date DEFAULT CURRENT_DATE)
 RETURNS TABLE(agent_id uuid, agent_name text, total_collected numeric, total_pending numeric, customer_count bigint, paid_count bigint, not_paid_count bigint, promised_count bigint, total_target numeric)
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
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (has_role(auth.uid(), 'manager'::app_role) AND (
        ur.user_id = auth.uid()
        OR ur.user_id IN (SELECT pr.user_id FROM profiles pr WHERE pr.reporting_to = auth.uid() AND pr.is_deleted = FALSE)
      ))
    )
  GROUP BY ur.user_id, p.name
$$;

-- 5. Update get_agent_daily_stats to respect role hierarchy
CREATE OR REPLACE FUNCTION public.get_agent_daily_stats(p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(agent_id uuid, agent_name text, total_collected numeric, total_pending numeric, customer_count bigint, paid_count bigint, not_paid_count bigint, promised_count bigint, total_target numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
    SELECT 
        ur.user_id as agent_id,
        p.name as agent_name,
        COALESCE(SUM(CASE WHEN pay.status = 'paid' AND pay.date = p_date THEN pay.amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN pay.status = 'not_paid' AND pay.date = p_date THEN pay.amount ELSE 0 END), 0) as total_pending,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(DISTINCT CASE WHEN pay.status = 'paid' AND pay.date = p_date THEN c.id END) as paid_count,
        COUNT(DISTINCT CASE WHEN pay.status = 'not_paid' AND pay.date = p_date THEN c.id END) as not_paid_count,
        COUNT(DISTINCT CASE WHEN pay.promised_date = p_date THEN c.id END) as promised_count,
        COALESCE(SUM(DISTINCT c.daily_amount), 0) as total_target
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id AND p.is_deleted = FALSE
    LEFT JOIN public.customers c ON c.assigned_agent_id = ur.user_id AND c.is_deleted = FALSE AND c.status = 'active'
    LEFT JOIN public.payments pay ON pay.customer_id = c.id AND pay.is_deleted = FALSE
    WHERE ur.role IN ('agent', 'manager') AND ur.is_active = TRUE
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR (has_role(auth.uid(), 'manager'::app_role) AND (
          ur.user_id = auth.uid()
          OR ur.user_id IN (SELECT pr.user_id FROM profiles pr WHERE pr.reporting_to = auth.uid() AND pr.is_deleted = FALSE)
        ))
      )
    GROUP BY ur.user_id, p.name
$$;

-- 6. Add loan_display_id column
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_display_id text;

-- 7. Trigger to auto-generate loan display ID on insert
CREATE OR REPLACE FUNCTION public.generate_loan_display_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_mobile text;
  v_count integer;
BEGIN
  SELECT mobile INTO v_mobile FROM customers WHERE id = NEW.customer_id;
  SELECT COUNT(*) INTO v_count FROM loans WHERE customer_id = NEW.customer_id;
  NEW.loan_display_id := 'VVL' || v_mobile || LPAD(v_count::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_loan_display_id
BEFORE INSERT ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.generate_loan_display_id();

-- 8. Backfill existing loans with display IDs
WITH ranked_loans AS (
  SELECT l.id, c.mobile, ROW_NUMBER() OVER (PARTITION BY l.customer_id ORDER BY l.created_at) as rn
  FROM loans l
  JOIN customers c ON c.id = l.customer_id
  WHERE l.loan_display_id IS NULL
)
UPDATE loans SET loan_display_id = 'VVL' || rl.mobile || LPAD(rl.rn::text, 4, '0')
FROM ranked_loans rl WHERE loans.id = rl.id;
