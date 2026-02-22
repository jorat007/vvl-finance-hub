import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFundBalance } from '@/hooks/useFundManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { numberToWords } from '@/lib/numberToWords';
import { useQueryClient } from '@tanstack/react-query';

export default function NewLoanPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fundBalance } = useFundBalance();

  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    loan_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    daily_amount: '',
    interest_rate: '12.5',
    processing_fee_rate: '0',
    other_deductions: '',
    other_deduction_remarks: '',
    include_charges_in_outstanding: false,
  });

  // Fetch customer name
  useEffect(() => {
    if (!customerId) return;
    supabase.from('customers').select('name').eq('id', customerId).single().then(({ data }) => {
      if (data) setCustomerName(data.name);
    });
  }, [customerId]);

  // Auto-calculate daily amount
  useEffect(() => {
    if (formData.loan_amount && formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        const loanAmt = parseFloat(formData.loan_amount) || 0;
        const interestAmt = Math.round(loanAmt * (parseFloat(formData.interest_rate) || 0) / 100);
        const processingAmt = Math.round(loanAmt * (parseFloat(formData.processing_fee_rate) || 0) / 100);
        const otherDed = parseFloat(formData.other_deductions) || 0;
        const totalCharges = interestAmt + processingAmt + otherDed;
        const outstandingAmount = formData.include_charges_in_outstanding ? loanAmt + totalCharges : loanAmt;
        const daily = Math.round((outstandingAmount / diffDays) * 100) / 100;
        if (daily > 0) {
          setFormData(prev => ({ ...prev, daily_amount: daily.toString() }));
        }
      }
    }
  }, [formData.loan_amount, formData.start_date, formData.end_date, formData.interest_rate, formData.processing_fee_rate, formData.other_deductions, formData.include_charges_in_outstanding]);

  // Calculated values
  const loanAmt = parseFloat(formData.loan_amount) || 0;
  const interestAmt = Math.round(loanAmt * (parseFloat(formData.interest_rate) || 0) / 100);
  const processingAmt = Math.round(loanAmt * (parseFloat(formData.processing_fee_rate) || 0) / 100);
  const otherDed = parseFloat(formData.other_deductions) || 0;
  const totalCharges = interestAmt + processingAmt + otherDed;
  const disbursalAmount = formData.include_charges_in_outstanding ? loanAmt : loanAmt - totalCharges;
  const outstandingAmount = formData.include_charges_in_outstanding ? loanAmt + totalCharges : loanAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !user) return;

    if (loanAmt <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid loan amount.' });
      return;
    }

    if (fundBalance !== undefined && fundBalance !== null && disbursalAmount > fundBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: `Available: ₹${fundBalance.toLocaleString('en-IN')}` });
      return;
    }

    setLoading(true);
    try {
      // Check for active loan
      const { data: activeLoan } = await supabase
        .from('loans').select('id').eq('customer_id', customerId).eq('status', 'active').eq('is_deleted', false).maybeSingle();

      if (activeLoan) {
        toast({ variant: 'destructive', title: 'Active Loan Exists', description: 'Close the current loan before creating a new one.' });
        setLoading(false);
        return;
      }

      const dailyAmount = Math.round((parseFloat(formData.daily_amount) || 0) * 100) / 100;

      // Create loan
      const { error: loanError } = await supabase.from('loans').insert({
        customer_id: customerId,
        loan_amount: loanAmt,
        daily_amount: dailyAmount,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: 'active',
        created_by: user.id,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        processing_fee_rate: parseFloat(formData.processing_fee_rate) || 0,
        other_deductions: otherDed,
        other_deduction_remarks: formData.other_deduction_remarks || null,
        include_charges_in_outstanding: formData.include_charges_in_outstanding,
        disbursal_amount: disbursalAmount,
        outstanding_amount: outstandingAmount,
      });

      if (loanError) throw loanError;

      // Update customer status back to active
      await supabase.from('customers').update({
        status: 'active',
        loan_amount: loanAmt,
        daily_amount: dailyAmount,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      }).eq('id', customerId);

      // Fund transaction
      await supabase.from('fund_transactions').insert({
        amount: disbursalAmount,
        type: 'loan_disbursement',
        description: `Loan disbursed to ${customerName}`,
        reference_table: 'customers',
        reference_id: customerId,
        created_by: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ['all-loans', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['fund-balance'] });

      toast({ title: 'Loan Created', description: 'New loan has been created successfully.' });
      navigate(`/customers/${customerId}`);
    } catch (error) {
      console.error('Loan creation error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create loan. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="New Loan">
      <div className="px-4 py-4 space-y-4">
        <button onClick={() => navigate(`/customers/${customerId}`)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Back to Customer</span>
        </button>

        <div className="form-section">
          <h3 className="font-semibold text-foreground mb-1">New Loan for {customerName}</h3>
          <p className="text-xs text-muted-foreground mb-4">Customer details will remain the same. Only loan details needed.</p>
        </div>

        {fundBalance !== undefined && fundBalance !== null && (
          <div className={`form-section mb-0 ${fundBalance > 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
            <p className="text-sm">
              <span className="text-muted-foreground">Available Funds: </span>
              <span className={`font-bold ${fundBalance > 0 ? 'text-success' : 'text-destructive'}`}>₹{fundBalance.toLocaleString('en-IN')}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Loan Details</h3>

            <div className="space-y-2">
              <Label>Loan Amount (₹)</Label>
              <Input type="number" inputMode="decimal" placeholder="Enter loan amount" value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })} className="touch-input" />
              {loanAmt > 0 && <p className="text-xs text-primary font-medium">₹ {numberToWords(loanAmt)} Only</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tenure From</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="touch-input" />
              </div>
              <div className="space-y-2">
                <Label>Tenure To</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="touch-input" min={formData.start_date} />
              </div>
            </div>

            {formData.start_date && formData.end_date && (
              <p className="text-xs text-muted-foreground">
                Tenure: {Math.max(0, Math.floor((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)} days
              </p>
            )}

            <div className="space-y-2">
              <Label>Daily Amount (₹) <span className="text-xs text-muted-foreground">(Auto-calculated)</span></Label>
              <Input type="number" inputMode="decimal" value={formData.daily_amount}
                onChange={(e) => setFormData({ ...formData, daily_amount: e.target.value })} className="touch-input" />
            </div>
          </div>

          {/* Charges Section */}
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Charges & Deductions</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Interest (%)</Label>
                <Input type="number" inputMode="decimal" value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="touch-input" />
              </div>
              <div className="space-y-2">
                <Label>Processing Fee (%)</Label>
                <Input type="number" inputMode="decimal" value={formData.processing_fee_rate}
                  onChange={(e) => setFormData({ ...formData, processing_fee_rate: e.target.value })} className="touch-input" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Other Deductions (₹)</Label>
              <Input type="number" inputMode="decimal" placeholder="0" value={formData.other_deductions}
                onChange={(e) => setFormData({ ...formData, other_deductions: e.target.value })} className="touch-input" />
            </div>

            <div className="space-y-2">
              <Label>Other Deduction Remarks</Label>
              <Input placeholder="e.g., Insurance, Processing" value={formData.other_deduction_remarks}
                onChange={(e) => setFormData({ ...formData, other_deduction_remarks: e.target.value })} className="touch-input" />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Include Charges in Outstanding?</Label>
              <Switch checked={formData.include_charges_in_outstanding}
                onCheckedChange={(checked) => setFormData({ ...formData, include_charges_in_outstanding: checked })} />
            </div>

            {loanAmt > 0 && (
              <div className="rounded-xl border border-border p-3 space-y-2 text-sm bg-muted/30">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Loan Amount</span><span className="font-semibold">₹{loanAmt.toLocaleString('en-IN')}</span></div>
                {interestAmt > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Interest ({formData.interest_rate}%)</span><span>₹{interestAmt.toLocaleString('en-IN')}</span></div>}
                {processingAmt > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Processing Fee ({formData.processing_fee_rate}%)</span><span>₹{processingAmt.toLocaleString('en-IN')}</span></div>}
                {otherDed > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Other Deductions</span><span>₹{otherDed.toLocaleString('en-IN')}</span></div>}
                <div className="border-t border-border pt-2 flex justify-between"><span className="text-muted-foreground">Total Charges</span><span className="font-semibold text-destructive">₹{totalCharges.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Net Disbursal</span><span className="font-bold text-success">₹{disbursalAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Outstanding Amount</span><span className="font-bold text-warning">₹{outstandingAmount.toLocaleString('en-IN')}</span></div>
              </div>
            )}
          </div>

          <Button type="submit" className="touch-button touch-button-primary w-full" disabled={loading}>
            {loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating Loan...</>) : 'Create New Loan'}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
