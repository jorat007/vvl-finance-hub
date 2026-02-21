import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCustomers, useCreatePayment } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Search, Check } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const paymentSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  mode: z.enum(['cash', 'online']),
  status: z.enum(['paid', 'not_paid']),
  remarks: z.string().optional(),
  promised_date: z.string().optional(),
});

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomer = searchParams.get('customer');
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: customers } = useCustomers();
  const createPayment = useCreatePayment();

  const [customerOpen, setCustomerOpen] = useState(false);
  const [formData, setFormData] = useState<{
    customer_id: string;
    date: string;
    amount: string;
    mode: 'cash' | 'online';
    status: 'paid' | 'not_paid';
    remarks: string;
    promised_date: string;
  }>({
    customer_id: preselectedCustomer || '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'cash',
    status: 'paid',
    remarks: '',
    promised_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedCustomer = customers?.find((c) => c.id === formData.customer_id);

  // Fetch active loan for the selected customer
  const { data: activeLoan } = useQuery({
    queryKey: ['active-loan', formData.customer_id],
    queryFn: async () => {
      if (!formData.customer_id) return null;
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('customer_id', formData.customer_id)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!formData.customer_id && !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = paymentSchema.safeParse({
      ...formData,
      amount: parseFloat(formData.amount),
      remarks: formData.remarks || undefined,
      promised_date: formData.promised_date || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Validation: if status is not_paid, require remarks
    if (formData.status === 'not_paid' && !formData.remarks.trim()) {
      setErrors({ remarks: 'Please enter remarks for unpaid status' });
      return;
    }

    // Warn if no active loan found
    if (!activeLoan) {
      toast({
        variant: 'destructive',
        title: 'No Active Loan',
        description: 'This customer has no active loan. Payments can only be recorded against active loans.',
      });
      return;
    }

    setLoading(true);

    try {
      await createPayment.mutateAsync({
        customer_id: formData.customer_id,
        loan_id: activeLoan.id,
        date: formData.date,
        amount: Math.round(parseFloat(formData.amount) * 100) / 100,
        mode: formData.mode,
        status: formData.status,
        remarks: formData.remarks || null,
        promised_date: formData.promised_date || null,
      });

      toast({
        title: 'Payment Saved',
        description: 'Payment entry has been recorded successfully.',
      });
      navigate('/payments');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save payment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Add Payment">
      <div className="px-4 py-4 space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Customer</h3>

            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="touch-input w-full justify-between font-normal"
                  >
                    {selectedCustomer ? (
                      <span>{selectedCustomer.name} - {selectedCustomer.area}</span>
                    ) : (
                      <span className="text-muted-foreground">Search customer...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name, mobile, area..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers?.filter(c => c.status === 'active').map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.mobile} ${customer.area}`}
                            onSelect={() => {
                              setFormData({ ...formData, customer_id: customer.id });
                              setCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.customer_id === customer.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.area} • {customer.mobile}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.customer_id && <p className="text-destructive text-sm">{errors.customer_id}</p>}
            </div>

            {/* Show active loan info */}
            {selectedCustomer && activeLoan && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  Active Loan #{activeLoan.loan_number} • ₹{Number(activeLoan.loan_amount).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Daily: ₹{Number(activeLoan.daily_amount).toLocaleString('en-IN')} • From: {new Date(activeLoan.start_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
            {selectedCustomer && !activeLoan && (
              <div className="bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
                No active loan found for this customer.
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Payment Details</h3>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="touch-input"
              />
              {errors.date && <p className="text-destructive text-sm">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Enter payment amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="touch-input text-lg font-semibold"
              />
              {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
              {activeLoan && (
                <p className="text-xs text-muted-foreground">
                  Daily amount: ₹{Number(activeLoan.daily_amount).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'cash' })}
                  className={cn(
                    'h-14 rounded-xl border-2 font-medium transition-all',
                    formData.mode === 'cash'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'online' })}
                  className={cn(
                    'h-14 rounded-xl border-2 font-medium transition-all',
                    formData.mode === 'online'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  📱 Online
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'paid', remarks: '', promised_date: '' })}
                  className={cn(
                    'h-14 rounded-xl border-2 font-medium transition-all',
                    formData.status === 'paid'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  ✅ Paid
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'not_paid' })}
                  className={cn(
                    'h-14 rounded-xl border-2 font-medium transition-all',
                    formData.status === 'not_paid'
                      ? 'border-warning bg-warning/10 text-warning'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  ⏳ Not Paid
                </button>
              </div>
            </div>
          </div>

        {/* Not Paid - Promised Date Only */}
{formData.status === 'not_paid' && (
  <div className="form-section space-y-4 animate-fade-in">
    <h3 className="font-semibold text-foreground">Additional Details</h3>

    <div className="space-y-2">
      <Label>Promised to Pay On</Label>
      <Input
        type="date"
        value={formData.promised_date}
        onChange={(e) =>
          setFormData({ ...formData, promised_date: e.target.value })
        }
        className="touch-input"
      />
    </div>
  </div>
)}

{/* Remarks - Always Visible */}
<div className="space-y-2">
  <Label>Remarks</Label>
  <Textarea
    placeholder="Enter remarks..."
    value={formData.remarks}
    onChange={(e) =>
      setFormData({ ...formData, remarks: e.target.value })
    }
    className="min-h-24 rounded-xl"
  />
  {errors.remarks && (
    <p className="text-destructive text-sm">{errors.remarks}</p>
  )}
</div>
 
            </div>
          

          <Button
            type="submit"
            className="touch-button touch-button-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Payment'
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
