import { MainLayout } from '@/components/MainLayout';
import { SummaryCard } from '@/components/SummaryCard';
import { useDashboardStats, useDailyCollections, usePaymentStatusBreakdown } from '@/hooks/useData';
import { Users, Wallet, TrendingUp, AlertCircle, Plus, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: dailyData, isLoading: dailyLoading } = useDailyCollections();
  const { data: pieData, isLoading: pieLoading } = usePaymentStatusBreakdown();

  return (
    <MainLayout title="Dashboard">
      <div className="px-4 py-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </>
          ) : (
            <>
              <SummaryCard
                title="Total Customers"
                value={stats?.totalCustomers || 0}
                icon={Users}
                variant="primary"
              />
              <SummaryCard
                title="Today Collection"
                value={stats?.todayCollection || 0}
                icon={Wallet}
                variant="success"
              />
              <SummaryCard
                title="Monthly Collection"
                value={stats?.monthlyCollection || 0}
                icon={TrendingUp}
              />
              <SummaryCard
                title="Pending Balance"
                value={stats?.pendingBalance || 0}
                icon={AlertCircle}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/payments/new" className="quick-action">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-foreground">Add Payment</span>
          </Link>
          <Link to="/customers/new" className="quick-action">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <UserPlus className="w-6 h-6 text-success" />
            </div>
            <span className="font-medium text-foreground">Add Customer</span>
          </Link>
        </div>

        {/* Daily Collection Chart */}
        <div className="chart-container">
          <h3 className="font-semibold text-foreground mb-4">Daily Collection</h3>
          {dailyLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Paid vs Pending Pie Chart */}
        <div className="chart-container">
          <h3 className="font-semibold text-foreground mb-4">Payment Status</h3>
          {pieLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(pieData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
