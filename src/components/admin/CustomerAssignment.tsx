import { useState } from 'react';
import { useAgents, useUnassignedCustomers, useAssignCustomer } from '@/hooks/useAdmin';
import { useCustomers } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Phone, UserPlus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function CustomerAssignment() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: unassignedCustomers, isLoading: unassignedLoading } = useUnassignedCustomers();
  const { data: allCustomers, isLoading: customersLoading } = useCustomers();
  const assignCustomer = useAssignCustomer();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleAssign = async (customerId: string) => {
    if (!selectedAgent) {
      toast({
        title: 'Select Agent',
        description: 'Please select an agent first',
        variant: 'destructive',
      });
      return;
    }

    setAssigningId(customerId);
    try {
      await assignCustomer.mutateAsync({ customerId, agentId: selectedAgent });
      toast({
        title: 'Customer Assigned',
        description: 'Customer has been assigned to the agent',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign customer',
        variant: 'destructive',
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleReassign = async (customerId: string, newAgentId: string) => {
    try {
      await assignCustomer.mutateAsync({ customerId, agentId: newAgentId });
      toast({
        title: 'Customer Reassigned',
        description: 'Customer has been reassigned to the new agent',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reassign customer',
        variant: 'destructive',
      });
    }
  };

  const isLoading = agentsLoading || unassignedLoading || customersLoading;
  const activeAgents = agents?.filter((a) => a.role === 'agent' && a.is_active) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unassigned Customers */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Unassigned Customers</h3>
          <Badge variant="outline">{unassignedCustomers?.length || 0}</Badge>
        </div>

        {activeAgents.length > 0 && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Select agent to assign
            </label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {activeAgents.map((agent) => (
                  <SelectItem key={agent.user_id} value={agent.user_id}>
                    {agent.name} ({agent.customer_count} customers)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {unassignedCustomers?.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-success mx-auto mb-2" />
            <p className="text-muted-foreground">All customers are assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unassignedCustomers?.map((customer) => (
              <div
                key={customer.id}
                className="p-4 rounded-xl border border-warning/30 bg-warning/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {customer.area}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {customer.mobile}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAssign(customer.id)}
                    disabled={!selectedAgent || assigningId === customer.id}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {assigningId === customer.id ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Customers - Reassignment */}
      <div className="form-section">
        <h3 className="font-semibold text-foreground mb-4">Reassign Customers</h3>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {allCustomers
            ?.filter((c) => c.assigned_agent_id)
            .map((customer) => {
              const assignedAgent = agents?.find((a) => a.user_id === customer.assigned_agent_id);

              return (
                <div key={customer.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.area}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {assignedAgent?.name || 'Unknown'}
                    </Badge>
                  </div>

                  <Select
                    value={customer.assigned_agent_id || ''}
                    onValueChange={(value) => handleReassign(customer.id, value)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Reassign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAgents.map((agent) => (
                        <SelectItem key={agent.user_id} value={agent.user_id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
