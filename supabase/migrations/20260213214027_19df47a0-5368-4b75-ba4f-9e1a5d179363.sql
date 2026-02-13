
-- Add partial unique index on customers.mobile to prevent duplicate non-deleted customers
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_mobile 
ON public.customers (mobile) 
WHERE is_deleted = false;
