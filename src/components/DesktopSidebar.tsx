import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BarChart3, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export function DesktopSidebar() {
  const location = useLocation();
  const { signOut, role } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <AppLogo size="sm" />
        <div>
          <h1 className="text-lg font-bold text-foreground">VVL CRM</h1>
          <p className="text-xs text-muted-foreground">VVL Enterprises</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3">
        <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
          {role === 'agent' ? 'Staff' : role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
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
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-4">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
