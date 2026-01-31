import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Shield, LogOut, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, role, signOut } = useAuth();

  return (
    <MainLayout title="Settings">
      <div className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="form-section">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{user?.email?.split('@')[0]}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">{role}</span>
              </div>
            </div>
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
              <span className="font-medium text-foreground">CRM</span>
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
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
          </div>
        </div>

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
