import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { AgentWiseReport } from '@/components/reports/AgentWiseReport';
import { CustomerWiseReport } from '@/components/reports/CustomerWiseReport';
import { CustomerTransactionSummary } from '@/components/reports/CustomerTransactionSummary';
import { FundReport } from '@/components/reports/FundReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Wallet, BookOpen } from 'lucide-react';

export default function ReportsPage() {
  const { isAdmin, isManager } = useAuth();
  const checkPermission = usePermissionChecker();
  const canViewAgentReport = isAdmin || isManager;
  const canViewFunds = checkPermission('fund_manage') || checkPermission('fund_view');

  const tabs = [
    ...(canViewAgentReport ? [{ value: 'agents', label: 'Staff', icon: Users }] : []),
    { value: 'customers', label: 'Customers', icon: UserCheck },
    { value: 'ledger', label: 'Ledger', icon: BookOpen },
    ...(canViewFunds ? [{ value: 'funds', label: 'Funds', icon: Wallet }] : []),
  ];

  return (
    <MainLayout title="Reports">
      <div className="px-4 py-4 space-y-6">
        <Tabs
          defaultValue={canViewAgentReport ? 'agents' : 'customers'}
          className="w-full"
        >
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
              <AgentWiseReport />
            </TabsContent>
          )}

          <TabsContent value="customers" className="mt-4">
            <CustomerWiseReport />
          </TabsContent>

          <TabsContent value="ledger" className="mt-4">
            <CustomerTransactionSummary />
          </TabsContent>

          {canViewFunds && (
            <TabsContent value="funds" className="mt-4">
              <FundReport />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
