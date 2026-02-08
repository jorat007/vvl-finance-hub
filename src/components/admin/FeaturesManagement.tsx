/*
import { useState } from 'react';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, Settings, Users, CreditCard, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const featureIcons: Record<string, React.ReactNode> = {
  customer_create: <Users className="w-5 h-5" />,
  customer_update: <Users className="w-5 h-5" />,
  customer_delete: <Users className="w-5 h-5" />,
  payment_create: <CreditCard className="w-5 h-5" />,
  payment_update: <CreditCard className="w-5 h-5" />,
  payment_delete: <CreditCard className="w-5 h-5" />,
  payment_update_own: <CreditCard className="w-5 h-5" />,
  payment_same_day_only: <CreditCard className="w-5 h-5" />,
  user_create: <Shield className="w-5 h-5" />,
  user_update: <Shield className="w-5 h-5" />,
  user_delete: <Shield className="w-5 h-5" />,
  view_dashboard: <Eye className="w-5 h-5" />,
  view_agent_report: <FileText className="w-5 h-5" />,
  view_customer_ledger: <FileText className="w-5 h-5" />,
  view_all_customers: <Eye className="w-5 h-5" />,
};

const featureCategories: Record<string, string[]> = {
  'Customer Management': ['customer_create', 'customer_update', 'customer_delete'],
  'Payment Management': ['payment_create', 'payment_update', 'payment_delete', 'payment_update_own', 'payment_same_day_only'],
  'User Management': ['user_create', 'user_update', 'user_delete'],
  'Reports & Visibility': ['view_dashboard', 'view_agent_report', 'view_customer_ledger', 'view_all_customers'],
};

export function FeaturesManagement() {
  const { data: permissions, isLoading } = useFeaturePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (
    featureId: string,
    field: 'admin_access' | 'manager_access' | 'agent_access',
    currentValue: boolean
  ) => {
    setUpdating(`${featureId}-${field}`);

    try {
      const { error } = await supabase
        .from('feature_permissions')
        .update({ [field]: !currentValue })
        .eq('id', featureId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['feature-permissions'] });

      toast({
        title: 'Permission Updated',
        description: 'Feature permission has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permission',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="form-section bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Feature Access Control</h3>
            <p className="text-xs text-muted-foreground">
              Manage role-based access to app features
            </p>
          </div>
        </div>
      </div>

      {Object.entries(featureCategories).map(([category, featureKeys]) => {
        const categoryPermissions = permissions?.filter((p) =>
          featureKeys.includes(p.feature_key)
        );

        if (!categoryPermissions?.length) return null;

        return (
          <div key={category} className="form-section">
            <h3 className="font-semibold text-foreground mb-4">{category}</h3>

            <div className="space-y-4">
              {categoryPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
                      {featureIcons[permission.feature_key] || <Settings className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{permission.feature_name}</p>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                   
                    <div
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        permission.admin_access
                          ? 'bg-success/10 border-success/30'
                          : 'bg-muted/50 border-border'
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Admin</p>
                      <Switch
                        checked={permission.admin_access}
                        onCheckedChange={() =>
                          handleToggle(permission.id, 'admin_access', permission.admin_access)
                        }
                        disabled={updating === `${permission.id}-admin_access`}
                      />
                    </div>

                    
                    <div
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        permission.manager_access
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/50 border-border'
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Manager</p>
                      <Switch
                        checked={permission.manager_access}
                        onCheckedChange={() =>
                          handleToggle(permission.id, 'manager_access', permission.manager_access)
                        }
                        disabled={updating === `${permission.id}-manager_access`}
                      />
                    </div>

                   
                    <div
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        permission.agent_access
                          ? 'bg-warning/10 border-warning/30'
                          : 'bg-muted/50 border-border'
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Agent</p>
                      <Switch
                        checked={permission.agent_access}
                        onCheckedChange={() =>
                          handleToggle(permission.id, 'agent_access', permission.agent_access)
                        }
                        disabled={updating === `${permission.id}-agent_access`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
*/
import { useState } from 'react';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, Settings, Users, CreditCard, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const featureIcons: Record<string, React.ReactNode> = {
  customer_create: <Users className="w-5 h-5" />,
  customer_update: <Users className="w-5 h-5" />,
  customer_delete: <Users className="w-5 h-5" />,
  payment_create: <CreditCard className="w-5 h-5" />,
  payment_update: <CreditCard className="w-5 h-5" />,
  payment_delete: <CreditCard className="w-5 h-5" />,
  payment_update_own: <CreditCard className="w-5 h-5" />,
  payment_same_day_only: <CreditCard className="w-5 h-5" />,
  user_create: <Shield className="w-5 h-5" />,
  user_update: <Shield className="w-5 h-5" />,
  user_delete: <Shield className="w-5 h-5" />,
  view_dashboard: <Eye className="w-5 h-5" />,
  view_agent_report: <FileText className="w-5 h-5" />,
  view_customer_ledger: <FileText className="w-5 h-5" />,
  view_all_customers: <Eye className="w-5 h-5" />,
};

const featureCategories: Record<string, string[]> = {
  'Customer Management': ['customer_create', 'customer_update', 'customer_delete'],
  'Payment Management': [
    'payment_create',
    'payment_update',
    'payment_delete',
    'payment_update_own',
    'payment_same_day_only',
  ],
  'User Management': ['user_create', 'user_update', 'user_delete'],
  'Reports & Visibility': [
    'view_dashboard',
    'view_agent_report',
    'view_customer_ledger',
    'view_all_customers',
  ],
};

export function FeaturesManagement() {
  const { data: permissions, isLoading } = useFeaturePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (
    featureId: string,
    field: 'admin_access' | 'manager_access' | 'agent_access',
    currentValue: boolean
  ) => {
    setUpdating(`${featureId}-${field}`);

    try {
      const { error } = await supabase
        .from('feature_permissions')
        .update({ [field]: !currentValue })
        .eq('id', featureId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['feature-permissions'] });

      toast({
        title: 'Permission Updated',
        description: 'Feature permission has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permission',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="form-section bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Feature Access Control</h3>
            <p className="text-xs text-muted-foreground">
              Manage role-based access to app features
            </p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {Object.entries(featureCategories).map(([category, featureKeys]) => {
          const categoryPermissions = permissions?.filter((p) =>
            featureKeys.includes(p.feature_key)
          );

          if (!categoryPermissions?.length) return null;

          return (
            <AccordionItem
              key={category}
              value={category}
              className="form-section border rounded-xl px-4"
            >
              <AccordionTrigger className="font-semibold text-foreground">
                {category}
              </AccordionTrigger>

              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {categoryPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
                          {featureIcons[permission.feature_key] || (
                            <Settings className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {permission.feature_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Admin */}
                        <div
                          className={cn(
                            'p-3 rounded-lg border text-center transition-colors',
                            permission.admin_access
                              ? 'bg-success/10 border-success/30'
                              : 'bg-muted/50 border-border'
                          )}
                        >
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Admin
                          </p>
                          <Switch
                            checked={permission.admin_access}
                            onCheckedChange={() =>
                              handleToggle(
                                permission.id,
                                'admin_access',
                                permission.admin_access
                              )
                            }
                            disabled={
                              updating === `${permission.id}-admin_access`
                            }
                          />
                        </div>

                        {/* Manager */}
                        <div
                          className={cn(
                            'p-3 rounded-lg border text-center transition-colors',
                            permission.manager_access
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-muted/50 border-border'
                          )}
                        >
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Manager
                          </p>
                          <Switch
                            checked={permission.manager_access}
                            onCheckedChange={() =>
                              handleToggle(
                                permission.id,
                                'manager_access',
                                permission.manager_access
                              )
                            }
                            disabled={
                              updating === `${permission.id}-manager_access`
                            }
                          />
                        </div>

                        {/* Agent */}
                        <div
                          className={cn(
                            'p-3 rounded-lg border text-center transition-colors',
                            permission.agent_access
                              ? 'bg-warning/10 border-warning/30'
                              : 'bg-muted/50 border-border'
                          )}
                        >
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Agent
                          </p>
                          <Switch
                            checked={permission.agent_access}
                            onCheckedChange={() =>
                              handleToggle(
                                permission.id,
                                'agent_access',
                                permission.agent_access
                              )
                            }
                            disabled={
                              updating === `${permission.id}-agent_access`
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
