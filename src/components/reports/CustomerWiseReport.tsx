import { useState, useMemo } from 'react';
import { useCustomers, useAllPayments, Customer, Payment } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, IndianRupee, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CustomerWiseReport() {
  const navigate = useNavigate();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();

  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [search, setSearch] = useState('');

  const isLoading = customersLoading || paymentsLoading;

  const reportData = useMemo(() => {
    if (!customers || !payments) return [];

    const activeCustomers = customers.filter((c) => c.status === 'active');

    return activeCustomers.map((customer) => {
      const customerPayments = payments.filter(
        (p) =>
          p.customer_id === customer.id &&
          p.date >= fromDate &&
          p.date <= toDate
      );

      const totalCollected = customerPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const paidDays = customerPayments.filter((p) => p.status === 'paid').length;
      const notPaidDays = customerPayments.filter((p) => p.status === 'not_paid').length;

      // Calculate expected based on date range
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const expectedAmount = totalDays * Number(customer.daily_amount);

      const remarks = customerPayments
      .map(p => p.remarks)
      .filter(r => r)
      .join(' | ');
      
      return {
        ...customer,
        totalCollected,
        paidDays,
        notPaidDays,
        expectedAmount,
        shortfall: expectedAmount - totalCollected,
        remarks,
      };
    });
  }, [customers, payments, fromDate, toDate]);

  const filteredData = useMemo(() => {
    if (!search) return reportData;
    const s = search.toLowerCase();
    return reportData.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.area.toLowerCase().includes(s) ||
        c.mobile.includes(s)
    );
  }, [reportData, search]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const headers = ['Name', 'Mobile', 'Daily Amount', 'Expected', 'Collected', 'Shortfall', 'Paid Days', 'Not Paid Days' ,'Remarks' ];
    const rows = filteredData.map((c) => [
      c.name,
      c.mobile,
      c.daily_amount,
      c.expectedAmount,
      c.totalCollected,
      c.shortfall,
      c.paidDays,
      c.notPaidDays,
      c.remarks,
    ]);

    const csvContent = [
      `Customer-wise Report (${fromDate} to ${toDate})`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Total Collected: ${filteredData.reduce((s, c) => s + c.totalCollected, 0)}`,
      `Total Expected: ${filteredData.reduce((s, c) => s + c.expectedAmount, 0)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customer-report-${fromDate}-to-${toDate}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Filters */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-foreground text-sm">Date Range</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Search & Export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-10 whitespace-nowrap">
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Customers</p>
          <p className="text-lg font-bold text-foreground">{filteredData.length}</p>
        </div>
        <div className="bg-success/10 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Collected</p>
          <p className="text-lg font-bold text-success">
            ₹{filteredData.reduce((s, c) => s + c.totalCollected, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-warning/10 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Shortfall</p>
          <p className="text-lg font-bold text-warning">
            ₹{filteredData.reduce((s, c) => s + Math.max(0, c.shortfall), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Customer List */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No data found for selected period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredData.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{customer.name}</h4>
                    <p className="text-xs text-muted-foreground">{customer.area} • {customer.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success flex items-center gap-0.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {customer.totalCollected.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of ₹{customer.expectedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    {customer.paidDays} paid
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                    {customer.notPaidDays} not paid
                  </Badge>
                  {customer.shortfall > 0 && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                      -₹{customer.shortfall.toLocaleString('en-IN')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
