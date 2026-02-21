import { MainLayout } from '@/components/MainLayout';
import { SummaryCard } from '@/components/SummaryCard';
import { useRoleBasedDashboardStats, useRoleBasedDailyCollections } from '@/hooks/useRoleBasedData';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionChart } from '@/components/reports/CollectionChart';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useRoleBasedDashboardStats();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data: dailyData, isLoading: dailyLoading } = useRoleBasedDailyCollections(period);

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
                variant="info"
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
      </div>
    </MainLayout>
  );
}
