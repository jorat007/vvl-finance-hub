import { Target, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface TodaySummaryCardProps {
  todayTarget: number;
  collected: number;
  pending: number;
  paidCount: number;
  notPaidCount: number;
}

export function TodaySummaryCard({
  todayTarget,
  collected,
  pending,
  paidCount,
  notPaidCount,
}: TodaySummaryCardProps) {
  const progressPercent = todayTarget > 0 ? Math.min((collected / todayTarget) * 100, 100) : 0;
  const isAchieved = collected >= todayTarget && todayTarget > 0;

  // Motivation messages based on progress
  const getMotivation = () => {
    if (isAchieved) return { message: "🎉 Target Achieved! Excellent work!", color: "text-success" };
    if (progressPercent >= 75) return { message: "🔥 Almost there! Keep pushing!", color: "text-warning" };
    if (progressPercent >= 50) return { message: "💪 Halfway done! You got this!", color: "text-primary" };
    if (progressPercent >= 25) return { message: "🚀 Good start! Keep going!", color: "text-primary" };
    return { message: "⏰ Start strong! Today's target awaits!", color: "text-muted-foreground" };
  };

  const motivation = getMotivation();

  return (
    <div className="form-section bg-gradient-to-br from-primary/5 via-background to-success/5 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Today's Target</h3>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        {isAchieved && (
          <div className="px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Achieved
          </div>
        )}
      </div>

      {/* Target Amount */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-4xl font-bold text-foreground">
            ₹{collected.toLocaleString('en-IN')}
          </span>
          <span className="text-sm text-muted-foreground">
            of ₹{todayTarget.toLocaleString('en-IN')}
          </span>
        </div>
        <Progress value={progressPercent} className="h-3 bg-muted/50" />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {progressPercent.toFixed(0)}% Complete
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-success/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-success font-medium">Collected</span>
          </div>
          <p className="text-lg font-bold text-success">₹{collected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">{paidCount} customers</p>
        </div>

        <div className="bg-warning/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning font-medium">Pending</span>
          </div>
          <p className="text-lg font-bold text-warning">₹{pending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">{notPaidCount} customers</p>
        </div>
      </div>

      {/* Motivation Message */}
      <div className={cn("text-center py-3 rounded-xl bg-background/50", motivation.color)}>
        <p className="font-medium">{motivation.message}</p>
      </div>
    </div>
  );
}
