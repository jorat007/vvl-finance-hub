import { useAgents, useToggleAgentStatus, useAgentStats } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AgentManagement() {
  const { data: agents, isLoading } = useAgents();
  const { data: stats } = useAgentStats();
  const toggleStatus = useToggleAgentStatus();
  const { toast } = useToast();

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ userId, isActive: !currentStatus });
      toast({
        title: 'Status Updated',
        description: `Agent ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const agentsList = agents?.filter((a) => a.role === 'agent') || [];

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-section">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{agentsList.length}</p>
              <p className="text-xs text-muted-foreground">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="form-section">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {agentsList.filter((a) => a.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="form-section">
        <h3 className="font-semibold text-foreground mb-4">Agent List</h3>

        {agentsList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No agents found</p>
        ) : (
          <div className="space-y-3">
            {agentsList.map((agent) => {
              const agentStat = stats?.find((s) => s.agent_id === agent.user_id);

              return (
                <div
                  key={agent.id}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    agent.is_active
                      ? 'bg-card border-border'
                      : 'bg-muted/50 border-muted'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          agent.is_active ? 'bg-primary/10' : 'bg-muted'
                        )}
                      >
                        <User
                          className={cn(
                            'w-6 h-6',
                            agent.is_active ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{agent.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {agent.mobile || 'No phone'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={() => handleToggleStatus(agent.user_id, agent.is_active)}
                      />
                    </div>
                  </div>

                  {/* Agent Stats */}
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {agent.customer_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Customers</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-success">
                        ₹{(agentStat?.total_collected || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">Collected</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-warning">
                        ₹{(agentStat?.total_pending || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
