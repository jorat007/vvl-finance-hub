import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  area: string;
  loan_amount: number;
  daily_amount: number;
  start_date: string;
  status: 'active' | 'closed' | 'defaulted';
  assigned_agent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  agent_id: string;
  date: string;
  amount: number;
  mode: 'cash' | 'online';
  status: 'paid' | 'not_paid';
  remarks: string | null;
  promised_date: string | null;
  created_at: string;
  customers?: Pick<Customer, 'id' | 'name' | 'area'>;
}

export interface CustomerWithBalance extends Customer {
  total_paid: number;
  balance: number;
}

export function useCustomers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });
}

export function useCustomerWithBalance(customerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('customer_id', customerId)
        .eq('status', 'paid');

      if (paymentsError) throw paymentsError;

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const balance = Number(customer.loan_amount) - totalPaid;

      return {
        ...customer,
        total_paid: totalPaid,
        balance,
      } as CustomerWithBalance;
    },
    enabled: !!user && !!customerId,
  });
}

export function useCustomerPayments(customerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user && !!customerId,
  });
}

export function useAllPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          customers (
            id,
            name,
            area
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get today's collection
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('date', today)
        .eq('status', 'paid');

      const todayCollection = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get monthly collection
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', firstDayOfMonth)
        .eq('status', 'paid');

      const monthlyCollection = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get pending balance
      const { data: customers } = await supabase
        .from('customers')
        .select('loan_amount');

      const { data: allPaidPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid');

      const totalLoans = customers?.reduce((sum, c) => sum + Number(c.loan_amount), 0) || 0;
      const totalPaid = allPaidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingBalance = totalLoans - totalPaid;

      return {
        totalCustomers: totalCustomers || 0,
        todayCollection,
        monthlyCollection,
        pendingBalance,
      };
    },
    enabled: !!user,
  });
}

export function useDailyCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-collections', user?.id],
    queryFn: async () => {
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      const { data } = await supabase
        .from('payments')
        .select('date, amount')
        .in('date', last7Days)
        .eq('status', 'paid');

      const dailyTotals = last7Days.map(date => {
        const dayPayments = data?.filter(p => p.date === date) || [];
        const total = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          amount: total,
        };
      });

      return dailyTotals;
    },
    enabled: !!user,
  });
}

export function usePaymentStatusBreakdown() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-status', user?.id],
    queryFn: async () => {
      const { data: customers } = await supabase
        .from('customers')
        .select('loan_amount');

      const { data: paidPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid');

      const totalLoans = customers?.reduce((sum, c) => sum + Number(c.loan_amount), 0) || 0;
      const totalPaid = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pending = totalLoans - totalPaid;

      return [
        { name: 'Paid', value: totalPaid, color: 'hsl(142, 71%, 45%)' },
        { name: 'Pending', value: pending, color: 'hsl(38, 92%, 50%)' },
      ];
    },
    enabled: !!user,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'agent_id'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          agent_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['daily-collections'] });
      queryClient.invalidateQueries({ queryKey: ['payment-status'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payment }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(payment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments', data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['daily-collections'] });
      queryClient.invalidateQueries({ queryKey: ['payment-status'] });
    },
  });
}
