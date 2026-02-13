import { useState, useMemo } from 'react';
import { useCustomers, useAllPayments } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Download, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export function CustomerTransactionSummary() {
  const { user } = useAuth();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [search, setSearch] = useState('');

  // Fetch loans for selected customer
  const { data: loans } = useQuery({
    queryKey: ['customer-loans', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomerId && !!user,
  });

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');

  // Get selected customer & loan
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
  const selectedLoan = loans?.find((l: any) => l.id === selectedLoanId);

  // Use customer's own date range if no loan selected
  const loanStartDate = selectedLoan?.start_date || selectedCustomer?.start_date;
  const loanEndDate = selectedLoan?.end_date || null;

  // Build ledger data
  const ledgerData = useMemo(() => {
    if (!selectedCustomerId || !loanStartDate || !payments) return [];

    const start = parseISO(loanStartDate);
    const end = loanEndDate ? parseISO(loanEndDate) : new Date();
    
    if (start > end) return [];

    const days = eachDayOfInterval({ start, end });
    
    // Filter payments by customer AND by loan_id if a specific loan is selected
    const customerPayments = payments.filter(p => {
      if (p.customer_id !== selectedCustomerId) return false;
      if (selectedLoan && selectedLoanId && selectedLoanId !== 'all') {
        return p.loan_id === selectedLoanId;
      }
      return true;
    });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayPayments = customerPayments.filter(p => p.date === dateStr);
      const paidPayments = dayPayments.filter(p => p.status === 'paid');
      const promisedPayment = dayPayments.find(p => p.promised_date);
      const notPaidPayment = dayPayments.find(p => p.status === 'not_paid');

      let status: 'paid' | 'not_paid' | 'promised' | 'pending' = 'pending';
      let amount = 0;
      let remarks = '';

      if (paidPayments.length > 0) {
        status = 'paid';
        amount = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        remarks = paidPayments.map(p => p.remarks).filter(Boolean).join('; ');
      } else if (promisedPayment) {
        status = 'promised';
        remarks = promisedPayment.remarks || '';
      } else if (notPaidPayment) {
        status = 'not_paid';
        remarks = notPaidPayment.remarks || '';
      } else if (day <= new Date()) {
        status = 'pending';
      }

      return {
        date: dateStr,
        displayDate: format(day, 'dd MMM yyyy'),
        dayName: format(day, 'EEE'),
        status,
        amount,
        remarks,
        isFuture: day > new Date(),
      };
    });
  }, [selectedCustomerId, selectedLoanId, loanStartDate, loanEndDate, payments, selectedLoan]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!search) return customers;
    const s = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.mobile.includes(s)
    );
  }, [customers, search]);

  // Stats
  const stats = useMemo(() => {
    const paidDays = ledgerData.filter(d => d.status === 'paid').length;
    const notPaidDays = ledgerData.filter(d => d.status === 'not_paid').length;
    const promisedDays = ledgerData.filter(d => d.status === 'promised').length;
    const pendingDays = ledgerData.filter(d => d.status === 'pending' && !d.isFuture).length;
    const totalCollected = ledgerData.reduce((sum, d) => sum + d.amount, 0);
    const dailyAmount = selectedLoan?.daily_amount || selectedCustomer?.daily_amount || 0;
    const totalExpected = (paidDays + notPaidDays + pendingDays) * Number(dailyAmount);
    return { paidDays, notPaidDays, promisedDays, pendingDays, totalCollected, totalExpected };
  }, [ledgerData, selectedLoan, selectedCustomer]);

  const handleExport = () => {
    if (ledgerData.length === 0) return;

    const customerName = selectedCustomer?.name || 'Customer';
    const headers = ['Date', 'Day', 'Status', 'Amount', 'Remarks'];
    const rows = ledgerData.map(d => [
      d.displayDate,
      d.dayName,
      d.status === 'paid' ? 'Paid' : d.status === 'not_paid' ? 'Not Paid' : d.status === 'promised' ? 'Promised' : 'Pending',
      d.amount,
      `"${d.remarks}"`,
    ]);

    const csvContent = [
      `Transaction Summary - ${customerName}`,
      `Period: ${loanStartDate} to ${loanEndDate || 'Present'}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `Total Collected: ${stats.totalCollected}`,
      `Total Expected: ${stats.totalExpected}`,
      `Paid Days: ${stats.paidDays}`,
      `Not Paid Days: ${stats.notPaidDays}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaction-summary-${customerName.replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  if (customersLoading || paymentsLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'not_paid': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'promised': return <Clock className="w-4 h-4 text-warning" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted border border-border" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/30';
      case 'not_paid': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'promised': return 'bg-warning/10 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <div className="form-section space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Select Customer</h4>
        </div>
        <Input
          placeholder="Search by name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10"
        />
        <Select
          value={selectedCustomerId}
          onValueChange={(v) => {
            setSelectedCustomerId(v);
            setSelectedLoanId('');
          }}
        >
          <SelectTrigger className="touch-input">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {filteredCustomers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} - {c.mobile}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loan Selection */}
      {selectedCustomerId && loans && loans.length > 0 && (
        <div className="form-section space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Select Loan
          </h4>
          <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
            <SelectTrigger className="touch-input">
              <SelectValue placeholder="Select a loan (or view all)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Current loan data)</SelectItem>
              {loans.map((loan: any) => (
                <SelectItem key={loan.id} value={loan.id}>
                  {loan.loan_display_id || `Loan #${loan.loan_number}`} - ₹{Number(loan.loan_amount).toLocaleString('en-IN')} ({loan.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stats Summary */}
      {selectedCustomerId && ledgerData.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-success/10 rounded-xl p-3">
              <p className="text-lg font-bold text-success">{stats.paidDays}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="bg-destructive/10 rounded-xl p-3">
              <p className="text-lg font-bold text-destructive">{stats.notPaidDays}</p>
              <p className="text-xs text-muted-foreground">Not Paid</p>
            </div>
            <div className="bg-warning/10 rounded-xl p-3">
              <p className="text-lg font-bold text-warning">{stats.promisedDays}</p>
              <p className="text-xs text-muted-foreground">Promised</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-lg font-bold text-foreground">{stats.pendingDays}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          <div className="form-section">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-xl font-bold text-success">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="space-y-1">
            {ledgerData.map((day) => (
              <div
                key={day.date}
                className={`flex items-center gap-3 p-3 rounded-lg border ${day.isFuture ? 'opacity-40' : ''} ${
                  day.status === 'paid' ? 'bg-success/5 border-success/20' :
                  day.status === 'not_paid' ? 'bg-destructive/5 border-destructive/20' :
                  day.status === 'promised' ? 'bg-warning/5 border-warning/20' :
                  'bg-card border-border'
                }`}
              >
                {statusIcon(day.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{day.displayDate}</span>
                    <span className="text-xs text-muted-foreground">({day.dayName})</span>
                  </div>
                  {day.remarks && (
                    <p className="text-xs text-muted-foreground truncate">{day.remarks}</p>
                  )}
                </div>
                <div className="text-right">
                  {day.status === 'paid' && (
                    <span className="text-sm font-bold text-success">₹{day.amount.toLocaleString('en-IN')}</span>
                  )}
                  <Badge variant="outline" className={`text-xs ${statusColor(day.status)}`}>
                    {day.status === 'paid' ? 'Paid' : day.status === 'not_paid' ? 'Not Paid' : day.status === 'promised' ? 'Promised' : day.isFuture ? 'Upcoming' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCustomerId && ledgerData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No loan data available for this customer.</p>
          <p className="text-xs mt-1">Select a customer with an active or closed loan.</p>
        </div>
      )}

      {!selectedCustomerId && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a customer to view their transaction ledger</p>
        </div>
      )}
    </div>
  );
}
