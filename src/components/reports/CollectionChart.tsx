import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CollectionChartProps {
  data: { date: string; amount: number }[] | undefined;
  isLoading: boolean;
}

export function CollectionChart({ data, isLoading }: CollectionChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  if (isLoading) {
    return (
      <div className="chart-container">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const chartData = data || [];
  const totalWeek = chartData.reduce((sum, d) => sum + d.amount, 0);
  const avgDaily = chartData.length > 0 ? totalWeek / chartData.length : 0;

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">7-Day Collection Trend</h3>
            <p className="text-xs text-muted-foreground">
              Avg: ₹{avgDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            className={cn(
              "p-2 rounded-md transition-colors",
              chartType === 'line' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              "p-2 rounded-md transition-colors",
              chartType === 'bar' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-muted/20 rounded-xl p-4 mb-4">
        <p className="text-sm text-muted-foreground">Total This Week</p>
        <p className="text-2xl font-bold text-foreground">
          ₹{totalWeek.toLocaleString('en-IN')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Collected']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--success))' }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Collected']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar
              dataKey="amount"
              fill="hsl(var(--success))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
