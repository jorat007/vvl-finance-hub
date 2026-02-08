import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },  
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/customers' && location.pathname.startsWith('/customers')) ||
            (item.path === '/payments' && location.pathname.startsWith('/payments')) ||
            (item.path === '/profile' && location.pathname.startsWith('/profile'));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('mobile-nav-item', isActive && 'active')}
            >
              <div
                className={cn(
                  'nav-icon flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
