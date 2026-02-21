import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FundTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference_table: string | null;
  reference_id: string | null;
  created_by: string;
  created_at: string;
  is_deleted: boolean | null;
}

export function useFundBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fund-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fund_transactions')
        .select('type, amount')
        .eq('is_deleted', false);

      if (error) throw error;

      let balance = 0;
      (data || []).forEach((t) => {
        if (t.type === 'credit' || t.type === 'loan_repayment') {
          balance += Number(t.amount);
        } else if (t.type === 'debit' || t.type === 'loan_disbursement') {
          balance -= Number(t.amount);
        }
      });

      return balance;
    },
    enabled: !!user,
  });
}

export function useFundTransactions(fromDate?: string, toDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fund-transactions', fromDate, toDate],
    queryFn: async () => {
      let query = supabase
        .from('fund_transactions')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (fromDate) {
        query = query.gte('created_at', `${fromDate}T00:00:00`);
      }
      if (toDate) {
        query = query.lte('created_at', `${toDate}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FundTransaction[];
    },
    enabled: !!user,
  });
}

export function useAddFund() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, description, type }: { amount: number; description: string; type: 'credit' | 'debit' }) => {
      const { data, error } = await supabase
        .from('fund_transactions')
        .insert({
          amount: Math.round(amount * 100) / 100,
          description,
          type,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-balance'] });
      queryClient.invalidateQueries({ queryKey: ['fund-transactions'] });
    },
  });
}
