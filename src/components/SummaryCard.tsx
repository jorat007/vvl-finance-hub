import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  subtitle?: string;
}

export function SummaryCard({ title, value, icon: Icon, variant = 'default', subtitle }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'summary-card',
         variant === 'info' && 'summary-card-info',
        variant === 'primary' && 'summary-card-primary',
        variant === 'success' && 'summary-card-success',
        variant === 'warning' && 'summary-card-warning'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              variant === 'default' ? 'text-foreground' : 'text-white'
            )}
          >
         
             {title != "Total Customers" ? `₹${value.toLocaleString('en-IN')}` : value}
          </p>
          {subtitle && (
            <p
              className={cn(
                'text-xs mt-1',
                variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            variant === 'default'
              ? 'bg-primary/10 text-primary'
              : 'bg-white/20 text-white'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
