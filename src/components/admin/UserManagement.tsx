import { useState, useEffect } from 'react';
import { useAgents, useToggleAgentStatus } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Phone, Users, TrendingUp, Plus, Edit, MessageCircle, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'manager' | 'agent';

interface UserFormData {
  name: string;
  mobile: string;
  whatsapp_number: string;
  password: string;
  role: AppRole;
  reporting_to: string | null;
}

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobile: z.string().min(10, 'Mobile must be 10 digits').max(10).regex(/^\d+$/, 'Only digits'),
  whatsapp_number: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'agent']),
});

export function UserManagement() {
  const { data: agents, isLoading } = useAgents();
  const { isAdmin } = useAuth();
  const toggleStatus = useToggleAgentStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    mobile: '',
    whatsapp_number: '',
    password: '',
    role: 'agent',
    reporting_to: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Get managers and admins for reporting dropdown
  const managersAndAdmins = agents?.filter((a) => 
    a.role === 'admin' || a.role === 'manager'
  ) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      whatsapp_number: '',
      password: '',
      role: 'agent',
      reporting_to: null,
    });
    setErrors({});
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        mobile: user.mobile,
        whatsapp_number: user.whatsapp_number || '',
        password: '',
        role: user.role as AppRole,
        reporting_to: user.reporting_to || null,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ userId, isActive: !currentStatus });
      toast({
        title: 'Status Updated',
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const validationSchema = editingUser
      ? userSchema.omit({ password: true }).extend({
          password: z.string().optional(),
        })
      : userSchema;

    const parsed = validationSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        // Update existing user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            mobile: formData.mobile,
            whatsapp_number: formData.whatsapp_number || null,
            reporting_to: formData.reporting_to,
          })
          .eq('user_id', editingUser.user_id);

        if (profileError) throw profileError;

        // Update role if changed
        if (formData.role !== editingUser.role) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', editingUser.user_id);

          if (roleError) throw roleError;
        }

        toast({
          title: 'User Updated',
          description: 'User details have been updated successfully.',
        });
      } else {
        // Create new user via signup
        const cleanMobile = formData.mobile.replace(/\D/g, '');
        const email = `${cleanMobile}@vvlenterprises.in`;

        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              mobile: cleanMobile,
              whatsapp_number: formData.whatsapp_number || null,
              reporting_to: formData.reporting_to,
              role: formData.role,
            },
          },
        });

        if (signupError) throw signupError;

        // If created successfully and not agent, update role
        if (signupData.user && formData.role !== 'agent') {
          // Wait a moment for trigger to complete
          await new Promise((r) => setTimeout(r, 1000));

          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', signupData.user.id);

          if (roleError) {
            if (import.meta.env.DEV) {
              console.error('Role update error:', roleError);
            }
          }
        }

        toast({
          title: 'User Created',
          description: 'New user has been created successfully.',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setResettingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: resetPasswordUser.user_id,
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reset password');

      toast({ title: 'Password Reset', description: `Password updated for ${resetPasswordUser.name}` });
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setResettingPassword(false);
    }
  };

  const getReportingLabel = () => {
    switch (formData.role) {
      case 'agent':
        return 'Reports to Manager';
      case 'manager':
        return 'Reports to Admin';
      case 'admin':
        return 'No reporting (Top level)';
      default:
        return 'Reports to';
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

  const usersList = agents || [];

  // Group by role
  const admins = usersList.filter((u) => u.role === 'admin');
  const managers = usersList.filter((u) => u.role === 'manager');
  const agentsList = usersList.filter((u) => u.role === 'agent');

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="form-section">
          <div className="flex flex-col items-center text-center">
            <p className="text-2xl font-bold text-foreground">{admins.length}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
        </div>
        <div className="form-section">
          <div className="flex flex-col items-center text-center">
            <p className="text-2xl font-bold text-primary">{managers.length}</p>
            <p className="text-xs text-muted-foreground">Managers</p>
          </div>
        </div>
        <div className="form-section">
          <div className="flex flex-col items-center text-center">
            <p className="text-2xl font-bold text-success">{agentsList.length}</p>
            <p className="text-xs text-muted-foreground">Agents</p>
          </div>
        </div>
      </div>

      {/* Add User Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full touch-button touch-button-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New User
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Enter user name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="touch-input"
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Mobile Number (Login ID)</Label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10 digit mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                className="touch-input"
                disabled={!!editingUser}
              />
              {errors.mobile && <p className="text-destructive text-sm">{errors.mobile}</p>}
            </div>

            <div className="space-y-2">
              <Label>WhatsApp Number (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Same as mobile if blank"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsapp_number: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className="touch-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData({ ...formData, whatsapp_number: formData.mobile })
                  }
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password (min 6 chars)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="touch-input"
                />
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: AppRole) =>
                  setFormData({
                    ...formData,
                    role: value,
                    reporting_to: value === 'admin' ? null : formData.reporting_to,
                  })
                }
              >
                <SelectTrigger className="touch-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role !== 'admin' && (
              <div className="space-y-2">
                <Label>{getReportingLabel()}</Label>
                <Select
                  value={formData.reporting_to || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      reporting_to: value === 'none' ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="touch-input">
                    <SelectValue placeholder="Select reporting staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {formData.role === 'agent'
                      ? managers.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.name} (Manager)
                          </SelectItem>
                        ))
                      : admins.map((a) => (
                          <SelectItem key={a.user_id} value={a.user_id}>
                            {a.name} (Admin)
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="touch-button touch-button-primary w-full"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Users List */}
      <div className="form-section">
        <h3 className="font-semibold text-foreground mb-4">All Users</h3>

        {usersList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        ) : (
          <div className="space-y-3">
            {usersList.map((user) => (
              <div
                key={user.id}
                className={cn(
                  'p-4 rounded-xl border transition-colors',
                  user.is_active ? 'bg-card border-border' : 'bg-muted/50 border-muted'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        user.is_active ? 'bg-primary/10' : 'bg-muted'
                      )}
                    >
                      <User
                        className={cn(
                          'w-6 h-6',
                          user.is_active ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {user.mobile || 'No phone'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'default'
                          : user.role === 'manager'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setResetPasswordUser(user); setNewPassword(''); }}
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {user.customer_count || 0} customers
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => handleToggleStatus(user.user_id, user.is_active)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Set a new password for <span className="font-semibold text-foreground">{resetPasswordUser?.name}</span>
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="touch-input"
              />
            </div>
            <Button
              onClick={handleResetPassword}
              className="w-full touch-button touch-button-primary"
              disabled={resettingPassword || newPassword.length < 6}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
