import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { User, Shield, LogOut, Info, Moon, Sun, ChevronRight, Heart } from 'lucide-react';

export default function SettingsPage() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <MainLayout title="Settings">
      <div className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="form-section">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{user?.email?.split('@')[0]}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium capitalize">{role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="form-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-warning" />
              )}
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>

        {/* App Info */}
        <div className="form-section">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">App Information</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App Name</span>
              <span className="font-medium text-foreground">VVL Finance CRM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium text-foreground">VVL Enterprises</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span className="font-medium text-foreground">TN-02-0194510</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-primary">2.0.0 Phase II</span>
            </div>
          </div>
        </div>

        {/* About Link */}
        <Link to="/about" className="form-section flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">About</p>
              <p className="text-xs text-muted-foreground">Developer & owner info</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-14 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </MainLayout>
  );
}
