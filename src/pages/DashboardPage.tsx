import { MainLayout } from '@/components/MainLayout';
import { SummaryCard } from '@/components/SummaryCard';
import { useRoleBasedDashboardStats, useRoleBasedDailyCollections } from '@/hooks/useRoleBasedData';
import { usePaymentStatusBreakdown } from '@/hooks/useData';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionChart } from '@/components/reports/CollectionChart';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useRoleBasedDashboardStats();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data: dailyData, isLoading: dailyLoading } = useRoleBasedDailyCollections(period);
  const { data: pieData, isLoading: pieLoading } = usePaymentStatusBreakdown();

  return (
    <MainLayout title="Dashboard">
      <div className="px-4 py-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </>
          ) : (
            <>
              <SummaryCard
                title="Total Customers"
                value={stats?.totalCustomers || 0}
                icon={Users}
                variant="primary"
              />
              <SummaryCard
                title="Today Collection"
                value={stats?.todayCollection || 0}
                icon={Wallet}
                variant="success"
              />
              <SummaryCard
                title="Monthly Collection"
                value={stats?.monthlyCollection || 0}
                icon={TrendingUp}
              />
              <SummaryCard
                title="Pending Balance"
                value={stats?.pendingBalance || 0}
                icon={AlertCircle}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Collection Trend Chart */}
        <CollectionChart data={dailyData} isLoading={dailyLoading} />

        {/* Pie Chart */}
        <div className="chart-container">
          <h3 className="font-semibold text-foreground mb-4">Payment Status</h3>
          {pieLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="w-full" style={{ height: 200 }}>
                  <PieChartSection pieData={pieData} />
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Extracted pie chart to keep imports clean
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function PieChartSection({ pieData }: { pieData: any }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={pieData || []}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {(pieData || []).map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
