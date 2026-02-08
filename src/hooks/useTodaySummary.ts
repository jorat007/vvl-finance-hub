import { useAllPayments, useCustomers } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

export function useTodaySummary() {
  const { data: payments } = useAllPayments();
  const { data: customers } = useCustomers();
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.date === today) || [];

  const collected = todayPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pending = todayPayments
    .filter(p => p.status === 'not_paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activeCustomers = customers?.filter(c => c.status === 'active') || [];
  const todayTarget = activeCustomers.reduce(
    (sum, c) => sum + Number(c.daily_amount),
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
    promisedCount: todayPayments.filter(p => p.promised_date === today).length,
  };
}
