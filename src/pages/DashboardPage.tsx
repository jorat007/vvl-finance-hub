import { MainLayout } from '@/components/MainLayout';
import { SummaryCard } from '@/components/SummaryCard';
import { useRoleBasedDashboardStats, useRoleBasedDailyCollections } from '@/hooks/useRoleBasedData';
import { Users, Wallet, TrendingUp, AlertCircle, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionChart } from '@/components/reports/CollectionChart';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function DashboardPage() {
  const today = new Date();
  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(today);

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = toDate.toISOString().split('T')[0];

  const { data: stats, isLoading: statsLoading } = useRoleBasedDashboardStats(fromStr, toStr);
  const { data: dailyData, isLoading: dailyLoading } = useRoleBasedDailyCollections(fromStr, toStr);

  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      setFromDate(date);
      // If from date is after to date, adjust to date
      if (date > toDate) {
        setToDate(date);
      }
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      setToDate(date);
      // If to date is before from date, adjust from date
      if (date < fromDate) {
        setFromDate(date);
      }
    }
  };

  return (
    <MainLayout title="Dashboard">
      <div className="px-4 py-4 space-y-6">
        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/30 rounded-xl p-3">
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">From</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 text-sm",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(fromDate, "dd-MMM-yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={handleFromDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">To</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 text-sm",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(toDate, "dd-MMM-yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={handleToDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

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
                title="Total Collections"
                value={stats?.totalCollections || 0}
                icon={Wallet}
                variant="success"
              />
              <SummaryCard
                title="Total Disbursal"
                value={stats?.totalDisbursal || 0}
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

        {/* Collection Trend Chart */}
        <CollectionChart data={dailyData} isLoading={dailyLoading} />
      </div>
    </MainLayout>
  );
}
