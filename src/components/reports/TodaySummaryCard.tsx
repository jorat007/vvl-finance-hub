import { Target, TrendingUp, TrendingDown, Zap, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface TodaySummaryCardProps {
  todayTarget: number;
  collected: number;
  pending: number;
  paidCount: number;
  notPaidCount: number;
  totalCustomers?: number;
  promisedCount?: number;
}

export function TodaySummaryCard({
  todayTarget,
  collected,
  pending,
  paidCount,
  notPaidCount,
  totalCustomers = 0,
  promisedCount = 0,
}: TodaySummaryCardProps) {
  const progressPercent = todayTarget > 0 ? Math.min((collected / todayTarget) * 100, 100) : 0;
  const isAchieved = collected >= todayTarget && todayTarget > 0;
  
  // Customer attendance tracking
  const attendedCount = paidCount + notPaidCount;
  const pendingToVisit = totalCustomers - attendedCount;
  const attendancePercent = totalCustomers > 0 ? (attendedCount / totalCustomers) * 100 : 0;

  // Motivation messages based on progress
  const getMotivation = () => {
    if (isAchieved && attendancePercent >= 100) 
      return { message: "🎉 Perfect! All targets achieved!", color: "text-success" };
    if (isAchieved) 
      return { message: "🎉 Target Achieved! Complete visits!", color: "text-success" };
    if (progressPercent >= 75) 
      return { message: "🔥 Almost there! Keep pushing!", color: "text-warning" };
    if (progressPercent >= 50) 
      return { message: "💪 Halfway done! You got this!", color: "text-primary" };
    if (progressPercent >= 25) 
      return { message: "🚀 Good start! Keep going!", color: "text-primary" };
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
          {progressPercent.toFixed(0)}% Collection Complete
        </p>
      </div>

      {/* Customer Attendance Progress */}
      {totalCustomers > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-background/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Customer Visits</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {attendedCount}/{totalCustomers}
            </span>
          </div>
          <Progress value={attendancePercent} className="h-2 bg-muted/50" />
          {pendingToVisit > 0 && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pendingToVisit} customer(s) pending visit
            </p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-success/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-lg font-bold text-success">{paidCount}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </div>

        <div className="bg-destructive/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-lg font-bold text-destructive">{notPaidCount}</p>
          <p className="text-xs text-muted-foreground">Not Paid</p>
        </div>

        <div className="bg-warning/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-lg font-bold text-warning">{promisedCount}</p>
          <p className="text-xs text-muted-foreground">Promised</p>
        </div>
      </div>

      {/* Motivation Message */}
      <div className={cn("text-center py-3 rounded-xl bg-background/50", motivation.color)}>
        <p className="font-medium">{motivation.message}</p>
      </div>
    </div>
  );
}
