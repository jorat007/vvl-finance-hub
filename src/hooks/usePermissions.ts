import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeaturePermission {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  admin_access: boolean;
  manager_access: boolean;
  agent_access: boolean;
}

export function useFeaturePermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feature-permissions'],
    queryFn: async () => {
      // Use raw SQL query since types aren't updated yet
      const { data, error } = await supabase.rpc('get_feature_permissions' as any) as any;
      
      // Fallback to direct query if RPC doesn't exist
      if (error) {
        const result = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/feature_permissions?select=*&order=feature_name`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        );
        if (!result.ok) throw new Error('Failed to fetch permissions');
        return (await result.json()) as FeaturePermission[];
      }
      return (data || []) as FeaturePermission[];
    },
    enabled: !!user,
  });
}

export function useHasPermission(featureKey: string): boolean {
  const { role } = useAuth();
  const { data: permissions } = useFeaturePermissions();

  if (!role || !permissions) return false;

  const permission = permissions.find((p) => p.feature_key === featureKey);
  if (!permission) return false;

  switch (role) {
    case 'admin':
      return permission.admin_access;
    case 'manager':
      return permission.manager_access;
    case 'agent':
      return permission.agent_access;
    default:
      return false;
  }
}

export function usePermissionChecker() {
  const { role } = useAuth();
  const { data: permissions } = useFeaturePermissions();

  return (featureKey: string): boolean => {
    if (!role || !permissions) return false;

    const permission = permissions.find((p) => p.feature_key === featureKey);
    if (!permission) return false;

    switch (role) {
      case 'admin':
        return permission.admin_access;
      case 'manager':
        return permission.manager_access;
      case 'agent':
        return permission.agent_access;
      default:
        return false;
    }
  };
}
