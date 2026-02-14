import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCustomerWithBalance, useCustomerPayments, useDeleteCustomer, useUpdatePayment, Payment } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { ArrowLeft, Phone, MapPin, Calendar, Edit, Trash2, Plus, Check, Loader2, Lock, FileText, User, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

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
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update payment. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseLoan = async (loan: any) => {
    setClosingLoan(true);
    try {
      // Calculate total paid for this loan
      const { data: loanPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('loan_id', loan.id)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      const totalPaid = loanPayments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const loanAmount = Number(loan.loan_amount);

      if (totalPaid < loanAmount) {
        toast({
          variant: 'destructive',
          title: 'Cannot Close Loan',
          description: `Outstanding balance of ₹${(loanAmount - totalPaid).toLocaleString('en-IN')} remaining. Total payable: ₹${loanAmount.toLocaleString('en-IN')}, Collected: ₹${totalPaid.toLocaleString('en-IN')}.`,
        });
        setClosingLoan(false);
        return;
      }

      await supabase.from('loans').update({ status: 'closed', end_date: new Date().toISOString().split('T')[0] }).eq('id', loan.id);
      // Check if any other active loan exists
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
  const hasActiveLoan = !!activeLoan;
  const assignedLabel = customer.assigned_agent_id === user?.id ? 'Self' : (agentProfile?.name || 'Admin');

  return (
    <MainLayout title="Customer Details">
      <div className="px-4 py-4 space-y-4">
        {/* Back Button */}
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Back to Customers</span>
        </button>

        {/* Section 1: Customer Profile Details */}
        <div className="form-section">
          <div className="flex items-start justify-between mb-4">
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
                <span className={cn('status-badge mt-1', customer.status === 'active' && 'status-active', customer.status === 'closed' && 'status-closed', customer.status === 'defaulted' && 'status-defaulted')}>
                  {customer.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/customers/${id}/edit`}>
                <Button variant="outline" size="icon" className="h-10 w-10"><Edit className="w-4 h-4" /></Button>
              </Link>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 text-destructive"><Trash2 className="w-4 h-4" /></Button>
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{customer.mobile}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{customer.area}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span>Started: {new Date(customer.start_date).toLocaleDateString('en-IN')}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /><span>Assigned for: {assignedLabel}</span></div>
          </div>
        </div>

        {/* Section 2: KYC Details */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="kyc" className="form-section border rounded-xl px-4 mb-0">
            <AccordionTrigger className="font-semibold text-foreground">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> KYC Details</div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                {(customer as any).pan_number && <div><p className="text-xs text-muted-foreground">PAN</p><p className="font-medium">{(customer as any).pan_number}</p></div>}
                {(customer as any).aadhaar_number && <div><p className="text-xs text-muted-foreground">Aadhaar</p><p className="font-medium">{(customer as any).aadhaar_number}</p></div>}
                {(customer as any).bank_name && <div><p className="text-xs text-muted-foreground">Bank</p><p className="font-medium">{(customer as any).bank_name}</p></div>}
                {(customer as any).bank_account_number && <div><p className="text-xs text-muted-foreground">Account No.</p><p className="font-medium">{(customer as any).bank_account_number}</p></div>}
                {(customer as any).ifsc_code && <div><p className="text-xs text-muted-foreground">IFSC</p><p className="font-medium">{(customer as any).ifsc_code}</p></div>}
                {!(customer as any).pan_number && !(customer as any).aadhaar_number && !(customer as any).bank_name && (
                  <p className="text-muted-foreground col-span-2">No KYC details recorded</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Section 3: Loan Details */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Loan History</h3>
            {/* New Loan button - only when no active loan and customer exists */}
            {(isAdmin || isManager) && !hasActiveLoan && (
              <Link to={`/customers/new?mobile=${customer.mobile}`}>
                <Button size="sm" variant="outline" className="h-9">
                  <PlusCircle className="w-4 h-4 mr-1" /> New Loan
                </Button>
              </Link>
            )}
          </div>

          {allLoans?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No loan records found</p>
          ) : (
            <div className="space-y-3">
              {allLoans?.map((loan) => {
                const isActive = loan.status === 'active';
                return (
                  <div key={loan.id} className={cn('p-3 rounded-xl border', isActive ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30')}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Loan / Agreement ID</p>
                        <p className="font-bold text-primary tracking-wider text-sm">{loan.loan_display_id || `Loan #${loan.loan_number}`}</p>
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-success text-success-foreground' : ''}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Amount</p><p className="font-semibold">₹{Number(loan.loan_amount).toLocaleString('en-IN')}</p></div>
                      <div><p className="text-muted-foreground">Daily</p><p className="font-semibold">₹{Number(loan.daily_amount).toLocaleString('en-IN')}</p></div>
                      <div>
                        <p className="text-muted-foreground">Tenure</p>
                        <p className="font-semibold">{new Date(loan.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {loan.end_date ? new Date(loan.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Ongoing'}</p>
                      </div>
                    </div>
                    {/* Close Loan button - only for active loans when fully paid */}
                    {isActive && (isAdmin || isManager) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-3 border-warning text-warning hover:bg-warning/10" disabled={closingLoan}>
                            <Lock className="w-3 h-3 mr-1" /> Close Loan
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Close Loan</AlertDialogTitle>
                            <AlertDialogDescription>
                              The system will verify that total collected amount equals or exceeds the loan amount before closing.
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Loan Summary */}
          {activeLoan && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="text-lg font-bold text-foreground">₹{Number(customer.loan_amount).toLocaleString('en-IN')}</p>
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
        </div>

        {/* Payment Ledger */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Payment Ledger</h3>
            {hasActiveLoan && (
              <Link to={`/payments/new?customer=${id}`}>
                <Button size="sm" className="h-9"><Plus className="w-4 h-4 mr-1" /> Add Payment</Button>
              </Link>
            )}
          </div>

          {paymentsLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : payments?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Mode</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2">{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-2 text-right font-medium">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-center capitalize">{payment.mode}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn('status-badge', payment.status === 'paid' && 'status-paid', payment.status === 'not_paid' && 'status-not-paid')}>
                          {payment.status === 'paid' ? 'Paid' : 'Not Paid'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {canEditPayment(payment) ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPayment(payment)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
