import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCustomerWithBalance, useCustomerPayments, useDeleteCustomer, useUpdatePayment, Payment } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { ArrowLeft, Phone, MapPin, Calendar, Edit, Trash2, Plus, Check, Loader2, Lock, FileText, User, PlusCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { WhatsAppLoanShareButton } from '@/components/payments/WhatsAppLoanShareButton';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const checkPermission = usePermissionChecker();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: customerLoading } = useCustomerWithBalance(id);
  const { data: payments, isLoading: paymentsLoading } = useCustomerPayments(id);
  const deleteCustomer = useDeleteCustomer();
  const updatePayment = useUpdatePayment();

  const [closingLoan, setClosingLoan] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editFormData, setEditFormData] = useState({ amount: '', mode: 'cash' as 'cash' | 'online', status: 'paid' as 'paid' | 'not_paid', remarks: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Fetch ALL loans for this customer
  const { data: allLoans } = useQuery({
    queryKey: ['all-loans', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('customer_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch agent name
  const { data: agentProfile } = useQuery({
    queryKey: ['agent-profile', customer?.assigned_agent_id],
    queryFn: async () => {
      if (!customer?.assigned_agent_id) return null;
      const { data } = await supabase.from('profiles').select('name').eq('user_id', customer.assigned_agent_id).maybeSingle();
      return data;
    },
    enabled: !!customer?.assigned_agent_id,
  });

  // Fetch payments per loan
  const { data: loanPayments } = useQuery({
    queryKey: ['loan-payments', selectedLoanId],
    queryFn: async () => {
      if (!selectedLoanId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', selectedLoanId)
        .eq('is_deleted', false)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLoanId,
  });

  const canUpdateOwnPayments = checkPermission('payment_update_own');
  const canUpdateAllPayments = checkPermission('payment_update');
  const sameDayOnly = checkPermission('payment_same_day_only');

  const canEditPayment = (payment: Payment) => {
    const today = new Date().toISOString().split('T')[0];
    const isOwnPayment = payment.agent_id === user?.id;
    const isSameDay = payment.date === today;
    if (isAdmin || isManager || canUpdateAllPayments) return true;
    if (!isOwnPayment) return false;
    if (sameDayOnly && !isSameDay) return false;
    return canUpdateOwnPayments;
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast({ title: 'Customer Deleted', description: 'The customer has been deleted successfully.' });
      navigate('/customers');
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete customer. Please try again.' });
    }
  };

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditFormData({ amount: String(payment.amount), mode: payment.mode, status: payment.status, remarks: payment.remarks || '' });
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    setIsUpdating(true);
    try {
      await updatePayment.mutateAsync({
        id: editingPayment.id,
        amount: parseFloat(editFormData.amount) || 0,
        mode: editFormData.mode,
        status: editFormData.status,
        remarks: editFormData.remarks || null,
      });
      toast({ title: 'Payment Updated', description: 'Payment has been updated successfully.' });
      setEditingPayment(null);
      queryClient.invalidateQueries({ queryKey: ['loan-payments', selectedLoanId] });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update payment. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseLoan = async (loan: any) => {
    setClosingLoan(true);
    try {
      const { data: loanPays } = await supabase
        .from('payments')
        .select('amount')
        .eq('loan_id', loan.id)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      const totalPaid = loanPays?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const outstandingAmount = Number(loan.outstanding_amount) || Number(loan.loan_amount);

      if (totalPaid < outstandingAmount) {
        toast({
          variant: 'destructive',
          title: 'Cannot Close Loan',
          description: `Outstanding balance of ₹${(outstandingAmount - totalPaid).toLocaleString('en-IN')} remaining. Total payable: ₹${outstandingAmount.toLocaleString('en-IN')}, Collected: ₹${totalPaid.toLocaleString('en-IN')}.`,
        });
        setClosingLoan(false);
        return;
      }

      await supabase.from('loans').update({ status: 'closed', end_date: new Date().toISOString().split('T')[0] }).eq('id', loan.id);
      const { data: otherActive } = await supabase
        .from('loans').select('id').eq('customer_id', id!).eq('status', 'active').eq('is_deleted', false).neq('id', loan.id);
      if (!otherActive?.length) {
        await supabase.from('customers').update({ status: 'closed' }).eq('id', id!);
      }
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['all-loans', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Loan Closed', description: 'Loan has been closed successfully.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to close loan.' });
    } finally {
      setClosingLoan(false);
    }
  };

  if (customerLoading) {
    return (
      <MainLayout title="Customer Details">
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout title="Customer Details">
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">Customer not found</p>
          <Link to="/customers" className="text-primary font-medium mt-4 inline-block">Back to customers</Link>
        </div>
      </MainLayout>
    );
  }

  const activeLoan = allLoans?.find(l => l.status === 'active');
  const closedLoans = allLoans?.filter(l => l.status === 'closed') || [];
  const hasActiveLoan = !!activeLoan;
  const assignedLabel = customer.assigned_agent_id === user?.id ? 'Self' : (agentProfile?.name || 'Admin');

  const getLoanChargesBreakdown = (loan: any) => {
    const loanAmt = Number(loan.loan_amount);
    const interestRate = Number(loan.interest_rate) || 0;
    const processingRate = Number(loan.processing_fee_rate) || 0;
    const otherDed = Number(loan.other_deductions) || 0;
    const interestAmt = Math.round(loanAmt * interestRate / 100);
    const processingAmt = Math.round(loanAmt * processingRate / 100);
    const totalCharges = interestAmt + processingAmt + otherDed;
    return { interestAmt, processingAmt, otherDed, totalCharges };
  };

  const renderLoanCard = (loan: any) => {
    const isActive = loan.status === 'active';
    const charges = getLoanChargesBreakdown(loan);
    const disbursalAmt = Number(loan.disbursal_amount);
    const outstandingAmt = Number(loan.outstanding_amount);

    return (
      <div key={loan.id} className={cn('p-4 rounded-xl border', isActive ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30')}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Loan / Agreement ID</p>
            <p className="font-bold text-primary tracking-wider text-sm">{loan.loan_display_id || `Loan #${loan.loan_number}`}</p>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-success text-success-foreground' : ''}>
            {loan.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div><p className="text-muted-foreground">Gross Loan</p><p className="font-semibold">₹{Number(loan.loan_amount).toLocaleString('en-IN')}</p></div>
          <div><p className="text-muted-foreground">Total Charges</p><p className="font-semibold text-destructive">₹{charges.totalCharges.toLocaleString('en-IN')}</p></div>
          <div><p className="text-muted-foreground">Net Disbursal</p><p className="font-semibold text-success">₹{disbursalAmt.toLocaleString('en-IN')}</p></div>
          <div><p className="text-muted-foreground">Outstanding</p><p className="font-semibold text-warning">₹{outstandingAmt.toLocaleString('en-IN')}</p></div>
          <div><p className="text-muted-foreground">Daily</p><p className="font-semibold">₹{Number(loan.daily_amount).toLocaleString('en-IN')}</p></div>
          <div>
            <p className="text-muted-foreground">Tenure</p>
            <p className="font-semibold">{new Date(loan.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {loan.end_date ? new Date(loan.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Ongoing'}</p>
          </div>
        </div>

        {charges.totalCharges > 0 && (
          <div className="text-xs border-t border-border pt-2 mt-2 space-y-1 text-muted-foreground">
            {charges.interestAmt > 0 && <p>Interest ({loan.interest_rate}%): ₹{charges.interestAmt.toLocaleString('en-IN')}</p>}
            {charges.processingAmt > 0 && <p>Processing ({loan.processing_fee_rate}%): ₹{charges.processingAmt.toLocaleString('en-IN')}</p>}
            {charges.otherDed > 0 && <p>Other: ₹{charges.otherDed.toLocaleString('en-IN')} {loan.other_deduction_remarks ? `(${loan.other_deduction_remarks})` : ''}</p>}
            <p className="text-xs italic">{loan.include_charges_in_outstanding ? 'Charges included in outstanding' : 'Charges deducted from disbursal'}</p>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {/* View Ledger */}
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedLoanId(selectedLoanId === loan.id ? null : loan.id)}>
            <FileText className="w-3 h-3 mr-1" /> {selectedLoanId === loan.id ? 'Hide Ledger' : 'View Ledger'}
          </Button>

          {/* WhatsApp Share */}
          <WhatsAppLoanShareButton data={{
            customerName: customer.name,
            mobile: customer.mobile,
            loanDisplayId: loan.loan_display_id || `Loan #${loan.loan_number}`,
            loanAmount: Number(loan.loan_amount),
            interestRate: Number(loan.interest_rate) || 0,
            processingFeeRate: Number(loan.processing_fee_rate) || 0,
            otherDeductions: Number(loan.other_deductions) || 0,
            includeChargesInOutstanding: loan.include_charges_in_outstanding || false,
            disbursalAmount: disbursalAmt,
            outstandingAmount: outstandingAmt,
            dailyAmount: Number(loan.daily_amount),
            startDate: loan.start_date,
            endDate: loan.end_date,
          }} />
        </div>

        {/* Close Loan button */}
        {isActive && outstandingAmt.toLocaleString('en-IN') ==="0" && (isAdmin || isManager) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-2 border-warning text-warning hover:bg-warning/10" disabled={closingLoan}>
                <Lock className="w-3 h-3 mr-1" /> Close Loan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close Loan</AlertDialogTitle>
                <AlertDialogDescription>
                  The system will verify that total collected amount equals or exceeds the outstanding amount before closing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => handleCloseLoan(loan)}>
                  Confirm Close
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Inline Ledger */}
        {selectedLoanId === loan.id && (
          <div className="mt-3 border-t border-border pt-3">
            <h4 className="text-sm font-semibold mb-2">Payment Ledger</h4>
            {!loanPayments?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">No payments for this loan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-2 px-1 font-medium text-muted-foreground">Amt</th>
                      <th className="text-center py-2 px-1 font-medium text-muted-foreground">Mode</th>
                      <th className="text-center py-2 px-1 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-2 px-1 font-medium text-muted-foreground">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanPayments.map((p: any) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="py-2 px-1">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                        <td className="py-2 px-1 text-right font-medium">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-1 text-center capitalize">{p.mode}</td>
                        <td className="py-2 px-1 text-center">
                          <span className={cn('status-badge text-[10px]', p.status === 'paid' && 'status-paid', p.status === 'not_paid' && 'status-not-paid')}>
                            {p.status === 'paid' ? 'Paid' : 'Not Paid'}
                          </span>
                        </td>
                        <td className="py-2 px-1 text-center">
                          {canEditPayment(p) ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditPayment(p)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout title="Customer Details">
      <div className="px-4 py-4 space-y-4">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
          <div className="flex gap-2">
            <Link to={`/customers/${id}/edit`}>
              <Button variant="outline" size="icon" className="h-9 w-9"><Edit className="w-4 h-4" /></Button>
            </Link>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure? This will soft-delete the customer and all linked loans/payments.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Customer Header */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 flex-shrink-0">
            {(customer as any).photo_url ? (
              <img src={(customer as any).photo_url} alt={customer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary-foreground">{customer.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
            <div className="flex items-center gap-2">
              <span className={cn('status-badge', customer.status === 'active' && 'status-active', customer.status === 'closed' && 'status-closed', customer.status === 'defaulted' && 'status-defaulted')}>
                {customer.status}
              </span>
              <span className="text-xs text-muted-foreground">Assigned: {assignedLabel}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="form-section space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{customer.mobile}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{customer.area}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span>Started: {new Date(customer.start_date).toLocaleDateString('en-IN')}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /><span>Assigned: {assignedLabel}</span></div>
              </div>

              {/* Active Loan Summary */}
              {activeLoan && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-foreground">₹{(Number(activeLoan.outstanding_amount) || Number(customer.loan_amount)).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-success/10">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-success">₹{customer.total_paid.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-warning/10">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold text-warning">₹{customer.balance.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              {/* Quick Add Payment */}
              {hasActiveLoan && (
                <Link to={`/payments/new?customer=${id}`} className="block">
                  <Button className="w-full mt-2"><Plus className="w-4 h-4 mr-1" /> Add Payment</Button>
                </Link>
              )}
            </div>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Loan History</h3>
                {(isAdmin || isManager) && !hasActiveLoan && (
                  <Link to={`/customers/${id}/new-loan`}>
                    <Button size="sm" variant="outline" className="h-8">
                      <PlusCircle className="w-4 h-4 mr-1" /> New Loan
                    </Button>
                  </Link>
                )}
              </div>

              {/* Active Loan - Highlighted */}
              {activeLoan && (
                <div>
                  <p className="text-xs font-semibold text-success mb-2">🟢 Active Loan</p>
                  {renderLoanCard(activeLoan)}
                </div>
              )}

              {/* Closed Loans */}
              {closedLoans.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Closed Loans ({closedLoans.length})</p>
                  <div className="space-y-3">
                    {closedLoans.map(loan => renderLoanCard(loan))}
                  </div>
                </div>
              )}

              {!allLoans?.length && (
                <p className="text-center text-muted-foreground py-8">No loan records found</p>
              )}
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <div className="form-section">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(customer as any).pan_number && <div><p className="text-xs text-muted-foreground">PAN</p><p className="font-medium">{(customer as any).pan_number}</p></div>}
                {(customer as any).aadhaar_number && <div><p className="text-xs text-muted-foreground">Aadhaar</p><p className="font-medium">{(customer as any).aadhaar_number}</p></div>}
                {(customer as any).bank_name && <div><p className="text-xs text-muted-foreground">Bank</p><p className="font-medium">{(customer as any).bank_name}</p></div>}
                {(customer as any).bank_account_number && <div><p className="text-xs text-muted-foreground">Account No.</p><p className="font-medium">{(customer as any).bank_account_number}</p></div>}
                {(customer as any).ifsc_code && <div><p className="text-xs text-muted-foreground">IFSC</p><p className="font-medium">{(customer as any).ifsc_code}</p></div>}
                {!(customer as any).pan_number && !(customer as any).aadhaar_number && !(customer as any).bank_name && (
                  <p className="text-muted-foreground col-span-2">No KYC details recorded</p>
                )}
              </div>
              {/* KYC File links */}
              <div className="mt-4 space-y-2">
                {(customer as any).pan_file_url && (
                  <a href={(customer as any).pan_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">📎 View PAN Document</a>
                )}
                {(customer as any).aadhaar_file_url && (
                  <a href={(customer as any).aadhaar_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">📎 View Aadhaar Document</a>
                )}
                {(customer as any).other_file_url && (
                  <a href={(customer as any).other_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">📎 View {(customer as any).other_file_name || 'Other Document'}</a>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update the payment details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={editFormData.mode === 'cash' ? 'default' : 'outline'} onClick={() => setEditFormData({ ...editFormData, mode: 'cash' })}>💵 Cash</Button>
                <Button type="button" variant={editFormData.mode === 'online' ? 'default' : 'outline'} onClick={() => setEditFormData({ ...editFormData, mode: 'online' })}>📱 Online</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={editFormData.status === 'paid' ? 'default' : 'outline'} className={editFormData.status === 'paid' ? 'bg-success hover:bg-success/90' : ''} onClick={() => setEditFormData({ ...editFormData, status: 'paid' })}>✅ Paid</Button>
                <Button type="button" variant={editFormData.status === 'not_paid' ? 'default' : 'outline'} className={editFormData.status === 'not_paid' ? 'bg-warning hover:bg-warning/90' : ''} onClick={() => setEditFormData({ ...editFormData, status: 'not_paid' })}>⏳ Not Paid</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={editFormData.remarks} onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })} placeholder="Optional remarks..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>Cancel</Button>
            <Button onClick={handleUpdatePayment} disabled={isUpdating}>
              {isUpdating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>) : (<><Check className="w-4 h-4 mr-2" />Save Changes</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
