import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAllPayments, useCustomers } from '@/hooks/useData';
import { useAgentStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { TodaySummaryCard } from '@/components/reports/TodaySummaryCard';
import { AgentPerformanceCard } from '@/components/reports/AgentPerformanceCard';
import { CustomerWiseReport } from '@/components/reports/CustomerWiseReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, UserCheck } from 'lucide-react';

export default function ReportsPage() {
  const { isAdmin, isManager } = useAuth();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
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

  const paidCustomerIds = new Set(
    todayPayments.filter((p) => p.status === 'paid').map((p) => p.customer_id)
  );
  const notPaidCustomerIds = new Set(
    todayPayments.filter((p) => p.status === 'not_paid').map((p) => p.customer_id)
  );

  const paidCount = paidCustomerIds.size;
  const notPaidCount = notPaidCustomerIds.size;
  const promisedCount = payments?.filter((p) => p.promised_date === today).length || 0;

  const activeCustomers = customers?.filter((c) => c.status === 'active') || [];
  const todayTarget = activeCustomers.reduce((sum, c) => sum + Number(c.daily_amount), 0);
  const totalCustomers = activeCustomers.length;

  const canViewAgentReport = isAdmin || isManager;

  // Build tabs
  const tabs = [
    ...(canViewAgentReport ? [{ value: 'agents', label: 'Agents', icon: Users }] : []),
    { value: 'customers', label: 'Customers', icon: UserCheck },
  ];

  return (
    <MainLayout title="Reports">
      <div className="px-4 py-4 space-y-6">
        {/* Today's Summary Card 
        <TodaySummaryCard
          todayTarget={todayTarget}
          collected={todayCollected}
          pending={todayPending}
          paidCount={paidCount}
          notPaidCount={notPaidCount}
          totalCustomers={totalCustomers}
          promisedCount={promisedCount}
        />
*/}
        {/* Tabs */}
        <Tabs defaultValue={canViewAgentReport ? 'agents' : 'customers'} className="w-full">
          <TabsList
            className={`w-full grid h-12 bg-muted/50 rounded-xl p-1 grid-cols-${tabs.length}`}
            style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {canViewAgentReport && (
            <TabsContent value="agents" className="mt-4">
              <AgentPerformanceCard
                agents={agentStats || []}
                isLoading={agentStatsLoading}
              />
            </TabsContent>
          )}

          <TabsContent value="customers" className="mt-4">
            <CustomerWiseReport />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
