import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';
import { AppLogo } from './AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const { signOut, role } = useAuth();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {title || 'CRM'}
              </h1>
              <p className="text-xs text-muted-foreground">VVL Enterprises</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
              {role}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-10 w-10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-safe">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
