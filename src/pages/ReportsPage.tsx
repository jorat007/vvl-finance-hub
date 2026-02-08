import { MainLayout } from '@/components/MainLayout';
import { useAgentStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { AgentPerformanceCard } from '@/components/reports/AgentPerformanceCard';
import { CustomerWiseReport } from '@/components/reports/CustomerWiseReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck } from 'lucide-react';

export default function ReportsPage() {
  const { isAdmin, isManager } = useAuth();
  const { data: agentStats, isLoading: agentStatsLoading } = useAgentStats();

  const canViewAgentReport = isAdmin || isManager;

  const tabs = [
    ...(canViewAgentReport ? [{ value: 'agents', label: 'Agents', icon: Users }] : []),
    { value: 'customers', label: 'Customers', icon: UserCheck },
  ];

  return (
    <MainLayout title="Reports">
      <div className="px-4 py-4 space-y-6">
        <Tabs defaultValue={canViewAgentReport ? 'agents' : 'customers'} className="w-full">
          <TabsList
            className="w-full grid h-12 bg-muted/50 rounded-xl p-1"
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
