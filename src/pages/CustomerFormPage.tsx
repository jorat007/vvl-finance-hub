import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCreateCustomer, useUpdateCustomer, useCustomerWithBalance } from '@/hooks/useData';
import { useAgents } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobile: z.string().min(10, 'Mobile must be 10 digits').max(10).regex(/^\d+$/, 'Only digits'),
  area: z.string().min(2, 'Area is required').max(100),
  loan_amount: z.number().min(1, 'Loan amount is required'),
  daily_amount: z.number().min(1, 'Daily amount is required'),
  start_date: z.string().min(1, 'Start date is required'),
  status: z.enum(['active', 'closed', 'defaulted']),
});

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isManager } = useAuth();
  const checkPermission = usePermissionChecker();

  const { data: existingCustomer } = useCustomerWithBalance(id);
  const { data: agents } = useAgents();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  // Get agents only (not admins/managers for assignment)
  const agentsList = agents?.filter((a) => a.role === 'agent' && a.is_active) || [];
  const allAssignableUsers = agents?.filter((a) => a.is_active) || [];

  const [formData, setFormData] = useState<{
    name: string;
    mobile: string;
    area: string;
    loan_amount: string;
    daily_amount: string;
    start_date: string;
    status: 'active' | 'closed' | 'defaulted';
    assigned_agent_id: string;
  }>({
    name: '',
    mobile: '',
    area: '',
    loan_amount: '',
    daily_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    assigned_agent_id: user?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Update form when existing customer loads
  useEffect(() => {
    if (existingCustomer) {
      setFormData({
        name: existingCustomer.name,
        mobile: existingCustomer.mobile,
        area: existingCustomer.area,
        loan_amount: existingCustomer.loan_amount.toString(),
        daily_amount: existingCustomer.daily_amount.toString(),
        start_date: existingCustomer.start_date,
        status: existingCustomer.status,
        assigned_agent_id: existingCustomer.assigned_agent_id || user?.id || '',
      });
    }
  }, [existingCustomer, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = customerSchema.safeParse({
      ...formData,
      loan_amount: parseFloat(formData.loan_amount) || 0,
      daily_amount: parseFloat(formData.daily_amount) || 0,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name: formData.name,
        mobile: formData.mobile,
        area: formData.area,
        loan_amount: parseFloat(formData.loan_amount),
        daily_amount: parseFloat(formData.daily_amount),
        start_date: formData.start_date,
        status: formData.status,
        assigned_agent_id: formData.assigned_agent_id || user?.id || null,
      };

      if (isEdit) {
        await updateCustomer.mutateAsync({ id, ...customerData });
        toast({
          title: 'Customer Updated',
          description: 'Customer details have been updated successfully.',
        });
      } else {
        await createCustomer.mutateAsync(customerData);
        toast({
          title: 'Customer Added',
          description: 'New customer has been added successfully.',
        });
      }
      navigate('/customers');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save customer. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const canAssignAgent = isAdmin || isManager;

  return (
    <MainLayout title={isEdit ? 'Edit Customer' : 'Add Customer'}>
      <div className="px-4 py-4 space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Customers</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Customer Details</h3>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Enter customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="touch-input"
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10 digit mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                className="touch-input"
              />
              {errors.mobile && <p className="text-destructive text-sm">{errors.mobile}</p>}
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Input
                placeholder="Enter area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="touch-input"
              />
              {errors.area && <p className="text-destructive text-sm">{errors.area}</p>}
            </div>

            {/* Agent Allocation - Only visible to Admin/Manager */}
            {canAssignAgent && (
              <div className="space-y-2">
                <Label>Assign to Agent</Label>
                <Select
                  value={formData.assigned_agent_id || 'admin'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_agent_id: value === 'admin' ? '' : value })
                  }
                >
                  <SelectTrigger className="touch-input">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Default)</SelectItem>
                    {allAssignableUsers.map((agent) => (
                      <SelectItem key={agent.user_id} value={agent.user_id}>
                        {agent.name} ({agent.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If no agent selected, customer will be assigned to Admin
                </p>
              </div>
            )}
          </div>

          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Loan Details</h3>

            <div className="space-y-2">
              <Label>Loan Amount (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Enter loan amount"
                value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                className="touch-input"
              />
              {errors.loan_amount && <p className="text-destructive text-sm">{errors.loan_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label>Daily Amount (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Enter daily collection amount"
                value={formData.daily_amount}
                onChange={(e) => setFormData({ ...formData, daily_amount: e.target.value })}
                className="touch-input"
              />
              {errors.daily_amount && <p className="text-destructive text-sm">{errors.daily_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="touch-input"
              />
              {errors.start_date && <p className="text-destructive text-sm">{errors.start_date}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'closed' | 'defaulted') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="touch-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="touch-button touch-button-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              'Update Customer'
            ) : (
              'Add Customer'
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
