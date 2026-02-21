
-- Add loan charges columns to loans table
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS interest_rate numeric NOT NULL DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS processing_fee_rate numeric NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS other_deductions numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_deduction_remarks text,
  ADD COLUMN IF NOT EXISTS include_charges_in_outstanding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disbursal_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount numeric NOT NULL DEFAULT 0;
