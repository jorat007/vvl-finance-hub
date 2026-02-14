import { Customer, CustomerWithBalance } from '@/hooks/useData';
import { cn } from '@/lib/utils';
import { MapPin, Phone, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerCardProps {
  customer: Customer | CustomerWithBalance;
  showBalance?: boolean;
}

export function CustomerCard({ customer, showBalance = true }: CustomerCardProps) {
  const { user } = useAuth();
  const balance = 'balance' in customer ? customer.balance : null;
  const totalPaid = 'total_paid' in customer ? customer.total_paid : null;
  const photoUrl = (customer as any).photo_url;
  const agentName = (customer as any).agent_name;
  const isSelf = customer.assigned_agent_id === user?.id;

  return (
    <Link to={`/customers/${customer.id}`} className="block">
      <div className="customer-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Customer Photo */}
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                <span
                  className={cn(
                    'status-badge',
                    customer.status === 'active' && 'status-active',
                    customer.status === 'closed' && 'status-closed',
                    customer.status === 'defaulted' && 'status-defaulted'
                  )}
                >
                  {customer.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {customer.area}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.mobile}
                </span>
              </div>
              {agentName && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Assigned for: {isSelf ? 'Self' : agentName}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>

        {showBalance && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Loan Amount</p>
              <p className="font-semibold text-foreground">
                ₹{Number(customer.loan_amount).toLocaleString('en-IN')}
              </p>
            </div>
            {balance !== null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p
                  className={cn(
                    'font-semibold',
                    balance > 0 ? 'text-warning' : 'text-success'
                  )}
                >
                  ₹{balance.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
