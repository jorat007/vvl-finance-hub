import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireManager?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireManager = false,
}: ProtectedRouteProps) {
  const { user, role, loading, isAdmin, isManager } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check manager requirement (admin or manager can access)
  if (requireManager && !isAdmin && !isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
