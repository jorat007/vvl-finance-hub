import { useState } from 'react';
import { useFundTransactions, useFundBalance } from '@/hooks/useFundManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FundReport() {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const { data: balance, isLoading: balanceLoading } = useFundBalance();
  const { data: transactions, isLoading: txnLoading } = useFundTransactions(fromDate, toDate);

  const isLoading = balanceLoading || txnLoading;

  const totalCredits = (transactions || [])
    .filter((t) => t.type === 'credit' || t.type === 'collection')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDebits = (transactions || [])
    .filter((t) => t.type === 'debit' || t.type === 'loan_disbursement')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleExportExcel = () => {
    if (!transactions || transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Amount', 'Description'];
    const rows = transactions.map((t) => [
      new Date(t.created_at).toLocaleDateString('en-IN'),
      t.type,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      `Fund Report (${fromDate} to ${toDate})`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Total Credits,${totalCredits}`,
      `Total Debits,${totalDebits}`,
      `Current Balance,${balance || 0}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fund-report-${fromDate}-to-${toDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Current Balance */}
      <div className="form-section bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            {balanceLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className={cn(
                "text-2xl font-bold",
                (balance || 0) >= 0 ? "text-success" : "text-destructive"
              )}>
                ₹{Math.abs(balance || 0).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Date Range</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-section bg-success/5 border-success/20 mb-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-muted-foreground">Total Credits</p>
          </div>
          <p className="text-xl font-bold text-success">
            ₹{totalCredits.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="form-section bg-destructive/5 border-destructive/20 mb-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <p className="text-xs text-muted-foreground">Total Debits</p>
          </div>
          <p className="text-xl font-bold text-destructive">
            ₹{totalDebits.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      {txnLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <div className="form-section text-center py-8">
          <Wallet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No transactions for selected period</p>
        </div>
      ) : (
        <div className="form-section">
          <h3 className="font-semibold text-foreground mb-4">
            Transactions ({transactions.length})
          </h3>
          <div className="space-y-2">
            {transactions.map((txn) => {
              const isCredit = txn.type === 'credit' || txn.type === 'collection';
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isCredit ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    {isCredit ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {txn.description || txn.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      "font-bold text-sm",
                      isCredit ? "text-success" : "text-destructive"
                    )}>
                      {isCredit ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {txn.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
