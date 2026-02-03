-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_agent_daily_stats(date);

-- Then recreate with new return columns
CREATE FUNCTION public.get_agent_daily_stats(p_date date DEFAULT CURRENT_DATE)
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
    GROUP BY ur.user_id, p.name
$$;