import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Payment } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentPaymentsListProps {
  payments: Payment[] | undefined;
  isLoading: boolean;
  limit?: number;
}

export function RecentPaymentsList({ payments, isLoading, limit = 10 }: RecentPaymentsListProps) {
  if (isLoading) {
    return (
      <div className="form-section">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Payments
        </h3>
        <span className="text-xs text-muted-foreground">
          Last {limit} transactions
        </span>
      </div>

      {!payments || payments.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl">
          <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No payments recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Payments will appear here once added
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.slice(0, limit).map((payment) => (
            <div
              key={payment.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  payment.status === 'paid'
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                )}
              >
                {payment.customers?.name?.charAt(0) || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {payment.customers?.name || 'Unknown Customer'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{payment.customers?.area}</span>
                  <span>•</span>
                  <span>{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <span>•</span>
                  <span className="capitalize">{payment.mode}</span>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={cn(
                    "font-bold",
                    payment.status === 'paid' ? 'text-success' : 'text-warning'
                  )}
                >
                  ₹{Number(payment.amount).toLocaleString('en-IN')}
                </p>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    payment.status === 'paid'
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  {payment.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
