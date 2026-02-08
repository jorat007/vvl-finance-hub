import { MainLayout } from '@/components/MainLayout';
import { useAllPayments } from '@/hooks/useData';
import { FollowUpsList } from '@/components/reports/FollowUpsList';
import { RecentPaymentsList } from '@/components/reports/RecentPaymentsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { TodaySummaryCard } from '@/components/reports/TodaySummaryCard';
import { useTodaySummary } from '@/hooks/useTodaySummary';

export default function PaymentsPage() {
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const today = new Date().toISOString().split('T')[0];
  const summary = useTodaySummary();

  return (
    <MainLayout title="Payments">
      

      <div className="px-4 py-4 space-y-4">
        <TodaySummaryCard {...summary} />
        
        <Tabs defaultValue="followups" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="followups" className="rounded-lg text-sm">
              <UserCheck className="w-4 h-4 mr-2" />
              Follow-ups
            </TabsTrigger>

            <TabsTrigger value="recent" className="rounded-lg text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followups" className="mt-4">
            <FollowUpsList date={today} />
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <RecentPaymentsList
              payments={payments}
              isLoading={paymentsLoading}
              limit={20}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Add Payment Button */}
      <Link to="/payments/new" className="fab text-white">
        <Plus className="w-6 h-6" />
      </Link>
    </MainLayout>
  );
}
