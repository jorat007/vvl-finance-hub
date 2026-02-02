import { User, IndianRupee, Users, CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className="form-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Agent Performance - Today
        </h3>
        <span className="text-sm text-muted-foreground">
          Total: ₹{totalCollected.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => {
          const total = Number(agent.total_collected) + Number(agent.total_pending);
          const percent = total > 0 ? (Number(agent.total_collected) / total) * 100 : 0;

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
                      {agent.customer_count} customers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(agent.total_collected).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <Progress value={percent} className="h-2 mb-2" />

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle className="w-3 h-3" />
                    {agent.paid_count} paid
                  </span>
                  <span className="flex items-center gap-1 text-warning">
                    <XCircle className="w-3 h-3" />
                    {agent.not_paid_count} pending
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {percent.toFixed(0)}% collected
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
