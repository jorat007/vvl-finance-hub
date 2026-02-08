/*
import { useState, useMemo } from 'react';
import { useAllPayments, useCustomers, useUsers } from '@/hooks/useData';
import { AgentPerformanceCard } from '@/components/reports/AgentPerformanceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download } from 'lucide-react';

export function AgentWiseReport() {
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: users, isLoading: usersLoading } = useUsers(); // agents list

  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const isLoading = paymentsLoading || customersLoading || usersLoading;

  const agentData = useMemo(() => {
    if (!payments || !customers || !users) return [];

    const agents = users.filter((u) => u.role === 'agent' && u.is_active);

    return agents.map((agent) => {
      const agentCustomers = customers.filter(
        (c) => c.assigned_agent_id === agent.id && c.status === 'active'
      );

      const agentPayments = payments.filter(
        (p) =>
          p.agent_id === agent.id &&
          p.date >= fromDate &&
          p.date <= toDate
      );

      const totalCollected = agentPayments
        .filter((p) => p.status === 'paid')
        .reduce((s, p) => s + Number(p.amount), 0);

      const paidCount = agentPayments.filter((p) => p.status === 'paid').length;
      const notPaidCount = agentPayments.filter((p) => p.status === 'not_paid').length;
      const promisedCount = agentPayments.filter((p) => p.promised_date).length;

      const start = new Date(fromDate);
      const end = new Date(toDate);
      const totalDays =
        Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

      const totalTarget =
        totalDays *
        agentCustomers.reduce((s, c) => s + Number(c.daily_amount), 0);

      return {
        agent_id: agent.id,
        agent_name: agent.name,
        total_collected: totalCollected,
        total_pending: Math.max(0, totalTarget - totalCollected),
        customer_count: agentCustomers.length,
        paid_count: paidCount,
        not_paid_count: notPaidCount,
        promised_count: promisedCount,
        total_target: totalTarget,
      };
    });
  }, [payments, customers, users, fromDate, toDate]);

  const handleExportExcel = () => {
    if (agentData.length === 0) return;

    const headers = [
      'Agent Name',
      'Customers',
      'Target',
      'Collected',
      'Pending',
      'Paid Count',
      'Not Paid Count',
      'Promised Count',
    ];

    const rows = agentData.map((a) => [
      a.agent_name,
      a.customer_count,
      a.total_target,
      a.total_collected,
      a.total_pending,
      a.paid_count,
      a.not_paid_count,
      a.promised_count,
    ]);

    const csvContent = [
      `Agent-wise Report (${fromDate} to ${toDate})`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Total Collected,${agentData.reduce((s, a) => s + a.total_collected, 0)}`,
      `Total Target,${agentData.reduce((s, a) => s + a.total_target, 0)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agent-report-${fromDate}-to-${toDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
    
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
 
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>
 
      <AgentPerformanceCard agents={agentData} isLoading={isLoading} />
    </div>
  );
}
 */


import { useState, useMemo } from 'react';
import { useAllPayments, useCustomers } from '@/hooks/useData';
import { AgentPerformanceCard } from '@/components/reports/AgentPerformanceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download } from 'lucide-react';

export function AgentWiseReport() {
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const isLoading = paymentsLoading || customersLoading;

  const agentData = useMemo(() => {
    if (!payments || !customers) return [];

    // Get unique agent IDs from customers
    const agentIds = Array.from(
      new Set(customers.map((c) => c.assigned_agent_id).filter(Boolean))
    );

    return agentIds.map((agentId) => {
      const agentCustomers = customers.filter(
        (c) => c.assigned_agent_id === agentId && c.status === 'active'
      );

      const agentPayments = payments.filter(
        (p) =>
          p.agent_id === agentId &&
          p.date >= fromDate &&
          p.date <= toDate
      );

      const totalCollected = agentPayments
        .filter((p) => p.status === 'paid')
        .reduce((s, p) => s + Number(p.amount), 0);

      const paidCount = agentPayments.filter((p) => p.status === 'paid').length;
      const notPaidCount = agentPayments.filter((p) => p.status === 'not_paid').length;
      const promisedCount = agentPayments.filter((p) => p.promised_date).length;

      // Date range days
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const totalDays =
        Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

      const totalTarget =
        totalDays *
        agentCustomers.reduce((s, c) => s + Number(c.daily_amount), 0);

      // Agent name fallback (from payment if available)
      const agentName =
        agentPayments[0]?.agent_name || 'Agent';

      return {
        agent_id: agentId as string,
        agent_name: agentName,
        total_collected: totalCollected,
        total_pending: Math.max(0, totalTarget - totalCollected),
        customer_count: agentCustomers.length,
        paid_count: paidCount,
        not_paid_count: notPaidCount,
        promised_count: promisedCount,
        total_target: totalTarget,
      };
    });
  }, [payments, customers, fromDate, toDate]);

  const handleExportExcel = () => {
    if (agentData.length === 0) return;

    const headers = [
      'Agent Name',
      'Customers',
      'Target',
      'Collected',
      'Pending',
      'Paid Count',
      'Not Paid Count',
      'Promised Count',
    ];

    const rows = agentData.map((a) => [
      a.agent_name,
      a.customer_count,
      a.total_target,
      a.total_collected,
      a.total_pending,
      a.paid_count,
      a.not_paid_count,
      a.promised_count,
    ]);

    const csvContent = [
      `Agent-wise Report (${fromDate} to ${toDate})`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Total Collected,${agentData.reduce((s, a) => s + a.total_collected, 0)}`,
      `Total Target,${agentData.reduce((s, a) => s + a.total_target, 0)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agent-report-${fromDate}-to-${toDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
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

      {/* Agent Performance */}
      <AgentPerformanceCard agents={agentData} isLoading={isLoading} />
    </div>
  );
}
