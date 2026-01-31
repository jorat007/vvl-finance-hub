import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCustomerWithBalance, useCustomerPayments, useDeleteCustomer } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Phone, MapPin, Calendar, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: customer, isLoading: customerLoading } = useCustomerWithBalance(id);
  const { data: payments, isLoading: paymentsLoading } = useCustomerPayments(id);
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteCustomer.mutateAsync(id);
      toast({
        title: 'Customer Deleted',
        description: 'The customer has been deleted successfully.',
      });
      navigate('/customers');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
      });
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
          <Link to="/customers" className="text-primary font-medium mt-4 inline-block">
            Back to customers
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Customer Details">
      <div className="px-4 py-4 space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Customers</span>
        </button>

        {/* Customer Info Card */}
        <div className="form-section">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
              <span
                className={cn(
                  'status-badge mt-2',
                  customer.status === 'active' && 'status-active',
                  customer.status === 'closed' && 'status-closed',
                  customer.status === 'defaulted' && 'status-defaulted'
                )}
              >
                {customer.status}
              </span>
            </div>
            <div className="flex gap-2">
              <Link to={`/customers/${id}/edit`}>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this customer? This action cannot be undone
                        and will also delete all payment records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{customer.mobile}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{customer.area}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Started: {new Date(customer.start_date).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Loan Summary */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Loan Amount</p>
              <p className="text-lg font-bold text-foreground">
                ₹{Number(customer.loan_amount).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-success/10">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold text-success">
                ₹{customer.total_paid.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-warning/10">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-warning">
                ₹{customer.balance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Daily Amount: ₹{Number(customer.daily_amount).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Payment Ledger */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Payment Ledger</h3>
            <Link to={`/payments/new?customer=${id}`}>
              <Button size="sm" className="h-9">
                <Plus className="w-4 h-4 mr-1" />
                Add Payment
              </Button>
            </Link>
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
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2">
                        {new Date(payment.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        ₹{Number(payment.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-center capitalize">{payment.mode}</td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={cn(
                            'status-badge',
                            payment.status === 'paid' && 'status-paid',
                            payment.status === 'not_paid' && 'status-not-paid'
                          )}
                        >
                          {payment.status === 'paid' ? 'Paid' : 'Not Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
