import { useCustomers, useAllPayments } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Calendar, IndianRupee, AlertCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FollowUpsListProps {
  date?: string;
}

export function FollowUpsList({ date }: FollowUpsListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  
  const today = date || new Date().toISOString().split('T')[0];
  
  const isLoading = customersLoading || paymentsLoading;

  // Get pending customers - those who haven't paid today
  const pendingCustomers = customers?.filter((customer) => {
    if (customer.status !== 'active') return false;
    
    // Check if customer has a paid payment today
    const hasPaidToday = payments?.some(
      (p) => p.customer_id === customer.id && p.date === today && p.status === 'paid'
    );
    
    return !hasPaidToday;
  }) || [];

  // Get promised customers - those who promised to pay today
  const promisedCustomers = customers?.filter((customer) => {
    if (customer.status !== 'active') return false;
    
    // Check if customer has a promised payment for today
    const hasPromisedToday = payments?.some(
      (p) => p.customer_id === customer.id && p.promised_date === today
    );
    
    return hasPromisedToday;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (pendingCustomers.length === 0 && promisedCustomers.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-success" />
          </div>
          <h3 className="font-semibold text-foreground">All Caught Up!</h3>
          <p className="text-sm text-muted-foreground">No pending collections for today</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Promised Payments Section */}
      {promisedCustomers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <Calendar className="w-3 h-3 mr-1" />
              Promised Today ({promisedCustomers.length})
            </Badge>
          </div>
          
          {promisedCustomers.map((customer) => (
            <Card 
              key={`promised-${customer.id}`}
              className="border-warning/30 bg-warning/5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{customer.name}</h4>
                      <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/40">
                        Promised
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.mobile}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {customer.area}
                      </span>
                    </div>
                    {(customer as any).agent_name && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Assigned for: {customer.assigned_agent_id === user?.id ? 'Self' : (customer as any).agent_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-warning font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      {Number(customer.daily_amount).toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground">Daily</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Payments Section */}
      {pendingCustomers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              Pending Collection ({pendingCustomers.length})
            </Badge>
          </div>
          
          {pendingCustomers.map((customer) => {
            const isAlsoPromised = promisedCustomers.some(p => p.id === customer.id);
            if (isAlsoPromised) return null; // Already shown in promised section
            
            return (
              <Card 
                key={`pending-${customer.id}`}
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{customer.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.mobile}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {customer.area}
                        </span>
                      </div>
                      {(customer as any).agent_name && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Assigned for: {customer.assigned_agent_id === user?.id ? 'Self' : (customer as any).agent_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-foreground font-semibold">
                        <IndianRupee className="w-4 h-4" />
                        {Number(customer.daily_amount).toLocaleString()}
                      </div>
                      <span className="text-xs text-muted-foreground">Daily</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
