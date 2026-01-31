import { MainLayout } from '@/components/MainLayout';
import { useAllPayments, useDailyCollections, usePaymentStatusBreakdown } from '@/hooks/useData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: dailyData, isLoading: dailyLoading } = useDailyCollections();
  const { data: pieData } = usePaymentStatusBreakdown();

  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter((p) => p.date === today) || [];
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.status === 'paid' ? Number(p.amount) : 0), 0);

  return (
    <MainLayout title="Reports">
      <div className="px-4 py-4 space-y-6">
        {/* Today's Summary */}
        <div className="form-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Today's Collection</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="text-3xl font-bold text-foreground mb-4">
            ₹{todayTotal.toLocaleString('en-IN')}
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">
                {todayPayments.filter((p) => p.status === 'paid').length} Paid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">
                {todayPayments.filter((p) => p.status === 'not_paid').length} Not Paid
              </span>
            </div>
          </div>
        </div>

        {/* Collection Trend */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">7-Day Collection Trend</h3>
          </div>

          {dailyLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Payments */}
        <div className="form-section">
          <h3 className="font-semibold text-foreground mb-4">Recent Payments</h3>

          {paymentsLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : payments?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments recorded</p>
          ) : (
            <div className="space-y-3">
              {payments?.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {payment.customers?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString('en-IN')} • {payment.mode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold',
                        payment.status === 'paid' ? 'text-success' : 'text-warning'
                      )}
                    >
                      ₹{Number(payment.amount).toLocaleString('en-IN')}
                    </p>
                    <span
                      className={cn(
                        'status-badge text-xs',
                        payment.status === 'paid' && 'status-paid',
                        payment.status === 'not_paid' && 'status-not-paid'
                      )}
                    >
                      {payment.status === 'paid' ? 'Paid' : 'Not Paid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
