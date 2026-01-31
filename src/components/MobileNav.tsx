import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/payments/new', label: 'Payment', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/customers' && location.pathname.startsWith('/customers')) ||
            (item.path === '/payments/new' && location.pathname.startsWith('/payments'));
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
