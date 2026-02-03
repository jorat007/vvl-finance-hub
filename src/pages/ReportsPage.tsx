import { MainLayout } from '@/components/MainLayout';
import { useAllPayments, useDailyCollections, useCustomers } from '@/hooks/useData';
import { useAgentStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { TodaySummaryCard } from '@/components/reports/TodaySummaryCard';
import { AgentPerformanceCard } from '@/components/reports/AgentPerformanceCard';
import { RecentPaymentsList } from '@/components/reports/RecentPaymentsList';
import { CollectionChart } from '@/components/reports/CollectionChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Clock, Users } from 'lucide-react';

export default function ReportsPage() {
  const { isAdmin, isManager } = useAuth();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: dailyData, isLoading: dailyLoading } = useDailyCollections();
  const { data: customers } = useCustomers();
  const { data: agentStats, isLoading: agentStatsLoading } = useAgentStats();

  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter((p) => p.date === today) || [];
  
  // Calculate today's stats
  const todayCollected = todayPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const todayPending = todayPayments
    .filter((p) => p.status === 'not_paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Count unique customers for each status
  const paidCustomerIds = new Set(todayPayments.filter((p) => p.status === 'paid').map(p => p.customer_id));
  const notPaidCustomerIds = new Set(todayPayments.filter((p) => p.status === 'not_paid').map(p => p.customer_id));
  
  const paidCount = paidCustomerIds.size;
  const notPaidCount = notPaidCustomerIds.size;
  
  // Count promised payments for today
  const promisedCount = payments?.filter((p) => p.promised_date === today).length || 0;
  
  // Calculate today's target (sum of daily_amount for all active customers)
  const activeCustomers = customers?.filter((c) => c.status === 'active') || [];
  const todayTarget = activeCustomers.reduce((sum, c) => sum + Number(c.daily_amount), 0);
  const totalCustomers = activeCustomers.length;

  const canViewAgentReport = isAdmin || isManager;

  return (
    <MainLayout title="Reports">
      <div className="px-4 py-4 space-y-6">
        {/* Today's Summary Card - Always visible */}
        <TodaySummaryCard
          todayTarget={todayTarget}
          collected={todayCollected}
          pending={todayPending}
          paidCount={paidCount}
          notPaidCount={notPaidCount}
          totalCustomers={totalCustomers}
          promisedCount={promisedCount}
        />

        {/* Tabs for different report views */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`w-full grid h-12 bg-muted/50 rounded-xl p-1 ${canViewAgentReport ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
            {canViewAgentReport && (
              <TabsTrigger
                value="agents"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Agents
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <CollectionChart data={dailyData} isLoading={dailyLoading} />
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <RecentPaymentsList
              payments={payments}
              isLoading={paymentsLoading}
              limit={15}
            />
          </TabsContent>

          {canViewAgentReport && (
            <TabsContent value="agents" className="mt-4">
              <AgentPerformanceCard
                agents={agentStats || []}
                isLoading={agentStatsLoading}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
