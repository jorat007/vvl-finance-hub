import { User, IndianRupee, Users, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_collected: number;
  total_pending: number;
  customer_count: number;
  paid_count: number;
  not_paid_count: number;
  promised_count?: number;
  total_target?: number;
}

interface AgentPerformanceCardProps {
  agents: AgentStats[];
  isLoading?: boolean;
}

export function AgentPerformanceCard({ agents, isLoading }: AgentPerformanceCardProps) {
  if (isLoading) {
    return (
      <div className="form-section animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="form-section">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Agent Performance
        </h3>
        <p className="text-center text-muted-foreground py-8">No agent data available</p>
      </div>
    );
  }

  const totalCollected = agents.reduce((sum, a) => sum + Number(a.total_collected), 0);
  const totalTarget = agents.reduce((sum, a) => sum + Number(a.total_target || 0), 0);

  return (
    <div className="form-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Agent Performance - Today
        </h3>
        <div className="text-right">
          <span className="text-sm text-success font-medium">
            ₹{totalCollected.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-muted-foreground">
            {' '}/ ₹{totalTarget.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => {
          const target = Number(agent.total_target || 0);
          const collected = Number(agent.total_collected);
          const percentByAmount = target > 0 ? (collected / target) * 100 : 0;
          
          // Calculate customer completion percentage
          const totalCustomers = Number(agent.customer_count || 0);
          const attendedCustomers = Number(agent.paid_count || 0) + Number(agent.not_paid_count || 0);
          const percentByCount = totalCustomers > 0 ? (attendedCustomers / totalCustomers) * 100 : 0;
          
          const promisedCount = Number(agent.promised_count || 0);
          const pendingToVisit = totalCustomers - attendedCustomers;

          return (
            <div
              key={agent.agent_id}
              className="bg-muted/30 rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{agent.agent_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {totalCustomers} customers assigned
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {collected.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ₹{target.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Progress by customer count */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Customers Attended</span>
                  <span className="font-medium">{attendedCustomers}/{totalCustomers}</span>
                </div>
                <Progress value={percentByCount} className="h-2" />
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs text-center">
                <div className="bg-success/10 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <p className="font-bold text-success">{agent.paid_count}</p>
                  <p className="text-muted-foreground">Paid</p>
                </div>
                
                <div className="bg-destructive/10 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                    <XCircle className="w-3 h-3" />
                  </div>
                  <p className="font-bold text-destructive">{agent.not_paid_count}</p>
                  <p className="text-muted-foreground">Not Paid</p>
                </div>

                <div className="bg-warning/10 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-warning mb-1">
                    <Clock className="w-3 h-3" />
                  </div>
                  <p className="font-bold text-warning">{promisedCount}</p>
                  <p className="text-muted-foreground">Promise</p>
                </div>

                <div className="bg-muted rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                  </div>
                  <p className="font-bold text-foreground">{pendingToVisit}</p>
                  <p className="text-muted-foreground">Pending</p>
                </div>
              </div>

              {pendingToVisit > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-xs text-warning text-center">
                    ⚠️ {pendingToVisit} customer(s) not yet visited today
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
