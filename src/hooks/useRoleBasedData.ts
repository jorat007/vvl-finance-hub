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
 * Returns timezone-aware ISO range boundaries for a local date range.
 * This ensures that timestamptz columns in the DB are compared correctly
 * against local calendar days, not UTC midnight.
 */
function getLocalDateRange(fromDateStr: string, toDateStr: string) {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const localDate = new Date(fy, fm - 1, fd);
  const offset = localDate.getTimezoneOffset();
  const sign = offset <= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offsetMins = String(absOffset % 60).padStart(2, '0');
  const tzString = `${sign}${offsetHours}:${offsetMins}`;

  return {
    from: `${fromDateStr}T00:00:00${tzString}`,
    to: `${toDateStr}T23:59:59.999${tzString}`,
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

      // If non-admin has no customers, return zeros
      if (role !== 'admin' && customerIds.length === 0) {
        return { totalCustomers: 0, totalCollections: 0, totalDisbursal: 0, pendingBalance: 0 };
      }

      // Get collections (paid payments) in date range
      let collectionsQuery = supabase
        .from('payments')
        .select('amount')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'paid')
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        collectionsQuery = collectionsQuery.in('customer_id', customerIds);
      }

      const { data: collectionPayments } = await collectionsQuery;
      const totalCollections = collectionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get total disbursal (loans disbursed) in date range
      let disbursalQuery = supabase
        .from('loans')
        .select('disbursal_amount')
        .gte('start_date', from)
        .lte('start_date', to)
        .eq('is_deleted', false);

      if (role !== 'admin' && customerIds.length > 0) {
        disbursalQuery = disbursalQuery.in('customer_id', customerIds);
      }

      const { data: loans } = await disbursalQuery;
      const totalDisbursal = loans?.reduce((sum, l) => sum + Number(l.disbursal_amount), 0) || 0;

      // Pending balance (all-time: total loan amounts - total paid)
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

      let query = supabase
        .from('payments')
        .select('date, amount')
        .gte('date', from)
        .lte('date', to)
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
