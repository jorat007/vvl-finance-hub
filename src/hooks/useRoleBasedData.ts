import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date range boundaries for DATE columns.
 * `payments.date` and `loans.start_date` are DATE fields, so passing
 * plain YYYY-MM-DD strings avoids timezone shift/casting issues.
 */
function getLocalDateRange(fromDateStr: string, toDateStr: string) {
  return {
    from: fromDateStr,
    to: toDateStr,
  };
}

/**
 * Role-based dashboard stats with date range support:
 * Admin: all data
 * Manager: self + agents reporting to manager
 * Agent: own data only
 */
export function useRoleBasedDashboardStats(fromDate?: string, toDate?: string) {
  const { user, role } = useAuth();

  // Default to today if no dates provided
  const today = formatLocalDate(new Date());
  const from = fromDate || today;
  const to = toDate || today;

  return useQuery({
    queryKey: ['dashboard-stats-role', user?.id, role, from, to],
    queryFn: async () => {
      const range = getLocalDateRange(from, to);

      // Get agent IDs based on role hierarchy
      const agentIds = await getHierarchyAgentIds(user!.id, role!);

      // Get customers for these agents
      let customersQuery = supabase
        .from('customers')
        .select('id, assigned_agent_id')
        .eq('is_deleted', false);

      if (role !== 'admin') {
        customersQuery = customersQuery.in('assigned_agent_id', agentIds);
      }

      const { data: customers } = await customersQuery;

      const customerIds = customers?.map((c) => c.id) || [];
      // Total stored customers (excluding soft-deleted)
      const totalCustomers = customers?.length || 0;

      // If non-admin has no customers, return zeros
      if (role !== 'admin' && customerIds.length === 0) {
        return { totalCustomers: 0, totalCollections: 0, totalDisbursal: 0, pendingBalance: 0 };
      }

      // Total collection (paid payments) in selected date range
      let collectionsQuery = supabase
        .from('payments')
        .select('amount')
        .gte('date', range.from)
        .lte('date', range.to)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        collectionsQuery = collectionsQuery.in('customer_id', customerIds);
      }

      const { data: collectionPayments } = await collectionsQuery;
      const totalCollections = collectionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Total disbursed (loan disbursal amount) in selected date range
      let disbursalQuery = supabase
        .from('loans')
        .select('disbursal_amount')
        .gte('start_date', range.from)
        .lte('start_date', range.to)
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        disbursalQuery = disbursalQuery.in('customer_id', customerIds);
      }

      const { data: loans } = await disbursalQuery;
      const totalDisbursal = loans?.reduce((sum, l) => sum + Number(l.disbursal_amount), 0) || 0;

      // Pending recovery amount (sum of outstanding amount)
      let outstandingQuery = supabase
        .from('loans')
        .select('outstanding_amount')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        outstandingQuery = outstandingQuery.in('customer_id', customerIds);
      }

      const { data: outstandingLoans } = await outstandingQuery;
      const pendingBalance =
        outstandingLoans?.reduce((sum, loan) => sum + Number(loan.outstanding_amount), 0) || 0;

      return {
        totalCustomers,
        totalCollections,
        totalDisbursal,
        pendingBalance,
      };
    },
    enabled: !!user && !!role,
  });
}

export function useRoleBasedDailyCollections(fromDate?: string, toDate?: string) {
  const { user, role } = useAuth();

  const today = formatLocalDate(new Date());
  const from = fromDate || today;
  const to = toDate || today;

  return useQuery({
    queryKey: ['daily-collections-role', user?.id, role, from, to],
    queryFn: async () => {
      const agentIds = await getHierarchyAgentIds(user!.id, role!);

      // Build array of days between from and to
      const days: string[] = [];
      const [sy, sm, sd] = from.split('-').map(Number);
      const [ey, em, ed] = to.split('-').map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);
      const current = new Date(startDate);
      while (current <= endDate) {
        days.push(formatLocalDate(current));
        current.setDate(current.getDate() + 1);
      }

      if (days.length === 0) {
        days.push(from);
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
          return days.map((date) => {
            const [y, m, d] = date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return {
              date: days.length <= 7
                ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
              amount: 0,
            };
          });
        }
      }

      const range = getLocalDateRange(from, to);

      let query = supabase
        .from('payments')
        .select('date, amount')
        .gte('date', range.from)
        .lte('date', range.to)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (customerIds) {
        query = query.in('customer_id', customerIds);
      }

      const { data } = await query;

      return days.map((date) => {
        const dayPayments = data?.filter((p) => p.date === date) || [];
        const total = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const [y, m, d] = date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return {
          date: days.length <= 7
            ? dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
            : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          amount: total,
        };
      });
    },
    enabled: !!user && !!role,
  });
}

async function getHierarchyAgentIds(userId: string, role: string): Promise<string[]> {
  if (role === 'admin') {
    return [];
  }

  if (role === 'manager') {
    const { data: reportingAgents } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('reporting_to', userId)
      .eq('is_deleted', false);

    const agentIds = reportingAgents?.map((a) => a.user_id) || [];
    return [userId, ...agentIds];
  }

  return [userId];
}
