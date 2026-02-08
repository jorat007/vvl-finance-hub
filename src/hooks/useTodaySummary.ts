// hooks/useTodaySummary.ts
export function useTodaySummary() {
  const { data: payments } = useAllPayments();
  const { data: customers } = useCustomers();
  const { isAdmin, isManager } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.date === today) || [];

  const collected = todayPayments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0);

  const pending = todayPayments
    .filter(p => p.status === 'not_paid')
    .reduce((s, p) => s + Number(p.amount), 0);

  const activeCustomers = customers?.filter(c => c.status === 'active') || [];
  const todayTarget = activeCustomers.reduce(
    (s, c) => s + Number(c.daily_amount),
    0
  );

  return {
    todayTarget,
    collected,
    pending,
    paidCount: new Set(
      todayPayments.filter(p => p.status === 'paid').map(p => p.customer_id)
    ).size,
    notPaidCount: new Set(
      todayPayments.filter(p => p.status === 'not_paid').map(p => p.customer_id)
    ).size,
    totalCustomers: activeCustomers.length,
  };
}
