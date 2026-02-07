import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Role-based dashboard stats:
 * Admin: all data
 * Manager: self + agents reporting to manager
 * Agent: own data only
 */
export function useRoleBasedDashboardStats() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats-role', user?.id, role],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString().split('T')[0];

      // Get agent IDs based on role hierarchy
      const agentIds = await getHierarchyAgentIds(user!.id, role!);

      // Get customers for these agents
      let customersQuery = supabase
        .from('customers')
        .select('id, loan_amount, daily_amount, status, assigned_agent_id')
        .eq('is_deleted', false);

      if (role !== 'admin') {
        customersQuery = customersQuery.in('assigned_agent_id', agentIds);
      }

      const { data: customers } = await customersQuery;

      const customerIds = customers?.map((c) => c.id) || [];
      const totalCustomers = customers?.filter(c => c.status === 'active').length || 0;

      // Get today's payments
      let todayQuery = supabase
        .from('payments')
        .select('amount, status')
        .eq('date', today)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        todayQuery = todayQuery.in('customer_id', customerIds);
      } else if (role !== 'admin' && customerIds.length === 0) {
        return { totalCustomers: 0, todayCollection: 0, monthlyCollection: 0, pendingBalance: 0 };
      }

      const { data: todayPayments } = await todayQuery;
      const todayCollection = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Monthly collection
      let monthQuery = supabase
        .from('payments')
        .select('amount')
        .gte('date', firstDayOfMonth)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        monthQuery = monthQuery.in('customer_id', customerIds);
      }

      const { data: monthPayments } = await monthQuery;
      const monthlyCollection = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Pending balance
      const totalLoans = customers?.reduce((sum, c) => sum + Number(c.loan_amount), 0) || 0;

      let paidQuery = supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        paidQuery = paidQuery.in('customer_id', customerIds);
      }

      const { data: allPaid } = await paidQuery;
      const totalPaid = allPaid?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingBalance = totalLoans - totalPaid;

      return {
        totalCustomers,
        todayCollection,
        monthlyCollection,
        pendingBalance,
      };
    },
    enabled: !!user && !!role,
  });
}

export function useRoleBasedDailyCollections(period: 'today' | 'week' | 'month' = 'week') {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['daily-collections-role', user?.id, role, period],
    queryFn: async () => {
      const agentIds = await getHierarchyAgentIds(user!.id, role!);

      let days: string[] = [];
      const now = new Date();

      if (period === 'today') {
        days = [now.toISOString().split('T')[0]];
      } else if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toISOString().split('T')[0]);
        }
      } else {
        // month - last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toISOString().split('T')[0]);
        }
      }

      // Get customer IDs for role
      let customerIds: string[] | null = null;
      if (role !== 'admin') {
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .in('assigned_agent_id', agentIds)
          .eq('is_deleted', false);
        customerIds = customers?.map((c) => c.id) || [];
        if (customerIds.length === 0) {
          return days.map((date) => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
            amount: 0,
          }));
        }
      }

      let query = supabase
        .from('payments')
        .select('date, amount')
        .in('date', days)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (customerIds) {
        query = query.in('customer_id', customerIds);
      }

      const { data } = await query;

      return days.map((date) => {
        const dayPayments = data?.filter((p) => p.date === date) || [];
        const total = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          date: period === 'month'
            ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
            : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          amount: total,
        };
      });
    },
    enabled: !!user && !!role,
  });
}

async function getHierarchyAgentIds(userId: string, role: string): Promise<string[]> {
  if (role === 'admin') {
    // Admin sees all - return empty to skip filtering
    return [];
  }

  if (role === 'manager') {
    // Manager sees self + agents reporting to them
    const { data: reportingAgents } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('reporting_to', userId)
      .eq('is_deleted', false);

    const agentIds = reportingAgents?.map((a) => a.user_id) || [];
    return [userId, ...agentIds];
  }

  // Agent sees only self
  return [userId];
}
