import { useState } from 'react';
import { useFundBalance, useFundTransactions, useAddFund } from '@/hooks/useFundManagement';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wallet,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FundManagement() {
  const { data: balance, isLoading: balanceLoading } = useFundBalance();
  const { data: transactions, isLoading: txnLoading } = useFundTransactions();
  const addFund = useAddFund();
  const checkPermission = usePermissionChecker();
  const { toast } = useToast();

  const canManageFunds = checkPermission('fund_manage');
  const canViewFunds = checkPermission('fund_view');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [txnType, setTxnType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Enter a description', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await addFund.mutateAsync({
        amount: parsedAmount,
        description: description.trim(),
        type: txnType,
      });
      toast({
        title: txnType === 'credit' ? 'Funds Added' : 'Funds Deducted',
        description: `₹${parsedAmount.toLocaleString('en-IN')} ${txnType === 'credit' ? 'added to' : 'deducted from'} fund.`,
      });
      setAmount('');
      setDescription('');
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const { getUserFriendlyError } = await import('@/lib/errorMessages');
      toast({ title: 'Error', description: getUserFriendlyError(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!canViewFunds && !canManageFunds) {
    return (
      <div className="form-section text-center py-8">
        <p className="text-muted-foreground">You don't have permission to view fund management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="form-section bg-gradient-to-br from-primary/5 via-background to-success/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Fund Balance</h3>
            <p className="text-xs text-muted-foreground">Available funds in system</p>
          </div>
        </div>

        {balanceLoading ? (
          <Skeleton className="h-12 w-48" />
        ) : (
          <div className="flex items-center gap-2">
            <IndianRupee className="w-8 h-8 text-foreground" />
            <span className={cn(
              "text-4xl font-bold",
              (balance || 0) >= 0 ? "text-success" : "text-destructive"
            )}>
              {Math.abs(balance || 0).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canManageFunds && (
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={isDialogOpen && txnType === 'credit'} onOpenChange={(open) => { setIsDialogOpen(open); setTxnType('credit'); }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-14 border-success/30 text-success hover:bg-success/10"
                onClick={() => { setTxnType('credit'); setIsDialogOpen(true); }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={isDialogOpen && txnType === 'debit'} onOpenChange={(open) => { setIsDialogOpen(open); setTxnType('debit'); }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-14 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => { setTxnType('debit'); setIsDialogOpen(true); }}
              >
                <Minus className="w-5 h-5 mr-2" />
                Deduct Funds
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Add/Deduct Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {txnType === 'credit' ? (
                <ArrowUpCircle className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-destructive" />
              )}
              {txnType === 'credit' ? 'Add Funds' : 'Deduct Funds'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="touch-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder={txnType === 'credit' ? 'e.g., Initial capital, External funding...' : 'e.g., Operating expense, Adjustment...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full touch-button touch-button-primary"
              disabled={saving}
            >
              {saving ? 'Processing...' : txnType === 'credit' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Transactions */}
      <div className="form-section">
        <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>

        {txnLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No fund transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map((txn) => {
              const isCredit = txn.type === 'credit' || txn.type === 'collection';
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
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
                  <div className="text-right">
                    <p className={cn(
                      "font-bold text-sm",
                      isCredit ? "text-success" : "text-destructive"
                    )}>
                      {isCredit ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {txn.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
