
-- Add end_date column to customers table for tenure tracking
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS end_date date;

-- Add other_file_url and other_file_name columns for other document uploads
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS other_file_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS other_file_name text;

-- Create loans table for multi-loan tracking
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  loan_number serial,
  loan_amount numeric NOT NULL DEFAULT 0,
  daily_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  CONSTRAINT unique_active_loan_per_customer UNIQUE (customer_id, status) 
);

-- Note: The unique constraint above will prevent two 'active' loans for same customer.
-- We need a partial unique index instead since a customer can have multiple 'closed' loans.
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS unique_active_loan_per_customer;
CREATE UNIQUE INDEX idx_one_active_loan_per_customer ON public.loans (customer_id) WHERE (status = 'active' AND is_deleted = false);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans (mirror customer policies)
CREATE POLICY "Admins can manage all loans"
ON public.loans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view loans for assigned customers"
ON public.loans FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.customers c 
  WHERE c.id = loans.customer_id 
  AND c.assigned_agent_id = auth.uid()
  AND c.is_deleted = false
));

CREATE POLICY "Managers can view loans for reporting agents customers"
ON public.loans FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = loans.customer_id 
    AND c.is_deleted = false
    AND (c.assigned_agent_id = auth.uid() OR c.assigned_agent_id IN (
      SELECT p.user_id FROM profiles p WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
    ))
  )
);

CREATE POLICY "Managers can insert loans"
ON public.loans FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = loans.customer_id 
    AND c.is_deleted = false
    AND (c.assigned_agent_id = auth.uid() OR c.assigned_agent_id IN (
      SELECT p.user_id FROM profiles p WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
    ))
  )
);

CREATE POLICY "Managers can update loans for reporting agents customers"
ON public.loans FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = loans.customer_id 
    AND c.is_deleted = false
    AND (c.assigned_agent_id = auth.uid() OR c.assigned_agent_id IN (
      SELECT p.user_id FROM profiles p WHERE p.reporting_to = auth.uid() AND p.is_deleted = false
    ))
  )
);

-- Add loan_id column to payments table (nullable for backward compat)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS loan_id uuid REFERENCES public.loans(id);

-- Trigger for updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
