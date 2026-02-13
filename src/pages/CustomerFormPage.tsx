import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCreateCustomer, useUpdateCustomer, useCustomerWithBalance } from '@/hooks/useData';
import { useFundBalance, useAddFund } from '@/hooks/useFundManagement';
import { useAgents } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionChecker } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerPhotoUpload } from '@/components/customers/CustomerPhotoUpload';
import { KycFileUpload } from '@/components/customers/KycFileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  const queryClient = useQueryClient();

  const { data: existingCustomer } = useCustomerWithBalance(id);
  const { data: agents } = useAgents();
  const { data: fundBalance } = useFundBalance();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

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
    pan_number: string;
    aadhaar_number: string;
    bank_name: string;
    bank_account_number: string;
    ifsc_code: string;
    photo_url: string;
    pan_file_url: string;
    aadhaar_file_url: string;
  }>({
    name: '',
    mobile: '',
    area: '',
    loan_amount: '',
    daily_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    assigned_agent_id: user?.id || '',
    pan_number: '',
    aadhaar_number: '',
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    photo_url: '',
    pan_file_url: '',
    aadhaar_file_url: '',
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
        pan_number: (existingCustomer as any).pan_number || '',
        aadhaar_number: (existingCustomer as any).aadhaar_number || '',
        bank_name: (existingCustomer as any).bank_name || '',
        bank_account_number: (existingCustomer as any).bank_account_number || '',
        ifsc_code: (existingCustomer as any).ifsc_code || '',
        photo_url: (existingCustomer as any).photo_url || '',
        pan_file_url: (existingCustomer as any).pan_file_url || '',
        aadhaar_file_url: (existingCustomer as any).aadhaar_file_url || '',
      });
    }
  }, [existingCustomer, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const loanAmount = Math.round((parseFloat(formData.loan_amount) || 0) * 100) / 100;
    const dailyAmount = Math.round((parseFloat(formData.daily_amount) || 0) * 100) / 100;

    const parsed = customerSchema.safeParse({
      ...formData,
      loan_amount: loanAmount,
      daily_amount: dailyAmount,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Fund balance check for new loans only
    if (!isEdit && fundBalance !== undefined && fundBalance !== null) {
      if (loanAmount > fundBalance) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Funds',
          description: `Available balance is ₹${fundBalance.toLocaleString('en-IN')}. Please add funds in Fund Management to proceed.`,
        });
        return;
      }
    }

    setLoading(true);

    try {
      const customerData: any = {
        name: formData.name,
        mobile: formData.mobile,
        area: formData.area,
        loan_amount: loanAmount,
        daily_amount: dailyAmount,
        start_date: formData.start_date,
        status: formData.status,
        assigned_agent_id: formData.assigned_agent_id || user?.id || null,
        pan_number: formData.pan_number || null,
        aadhaar_number: formData.aadhaar_number || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        ifsc_code: formData.ifsc_code || null,
        photo_url: formData.photo_url || null,
        pan_file_url: formData.pan_file_url || null,
        aadhaar_file_url: formData.aadhaar_file_url || null,
      };

      if (isEdit) {
        await updateCustomer.mutateAsync({ id, ...customerData });
        toast({
          title: 'Customer Updated',
          description: 'Customer details have been updated successfully.',
        });
      } else {
        const result = await createCustomer.mutateAsync(customerData);

        // Deduct from fund on new loan creation
        if (result?.id) {
          const { error: fundError } = await supabase.from('fund_transactions').insert({
            amount: loanAmount,
            type: 'loan_disbursement',
            description: `Loan disbursed to ${formData.name}`,
            reference_table: 'customers',
            reference_id: result.id,
            created_by: user!.id,
          });

          if (fundError) {
            toast({
              variant: 'destructive',
              title: 'Warning',
              description: 'Customer created but fund transaction failed. Please add the transaction manually.',
            });
          }

          queryClient.invalidateQueries({ queryKey: ['fund-balance'] });
          queryClient.invalidateQueries({ queryKey: ['fund-transactions'] });
        }

        toast({
          title: 'Customer Added',
          description: 'New customer has been added successfully.',
        });
      }
      navigate('/customers');
    } catch (error: unknown) {
      const { getUserFriendlyError } = await import('@/lib/errorMessages');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getUserFriendlyError(error),
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

        {/* Fund Balance Warning for new loans */}
        {!isEdit && fundBalance !== undefined && fundBalance !== null && (
          <div className={`form-section mb-0 ${fundBalance > 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
            <p className="text-sm">
              <span className="text-muted-foreground">Available Funds: </span>
              <span className={`font-bold ${fundBalance > 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{fundBalance.toLocaleString('en-IN')}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-section space-y-4">
            <h3 className="font-semibold text-foreground">Customer Details</h3>

            {/* Customer Photo */}
            <div className="flex items-center gap-4">
              <CustomerPhotoUpload
                photoUrl={formData.photo_url || null}
                customerName={formData.name}
                customerId={id}
                size="lg"
                editable={true}
                onPhotoUploaded={(url) => setFormData({ ...formData, photo_url: url })}
              />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Customer Photo</p>
                <p className="text-xs">Tap to upload</p>
              </div>
            </div>

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

          {/* KYC Details - Optional */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="kyc" className="form-section border rounded-xl px-4 mb-0">
              <AccordionTrigger className="font-semibold text-foreground">
                KYC Details (Optional)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input
                      placeholder="e.g., ABCDE1234F"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().slice(0, 10) })}
                      className="touch-input"
                    />
                    <KycFileUpload
                      label="PAN Card"
                      fileUrl={formData.pan_file_url || null}
                      customerId={id}
                      fieldName="pan"
                      onFileUploaded={(url) => setFormData({ ...formData, pan_file_url: url })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhaar Number</Label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="12 digit Aadhaar number"
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      className="touch-input"
                    />
                    <KycFileUpload
                      label="Aadhaar Card"
                      fileUrl={formData.aadhaar_file_url || null}
                      customerId={id}
                      fieldName="aadhaar"
                      onFileUploaded={(url) => setFormData({ ...formData, aadhaar_file_url: url })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      placeholder="Enter bank name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="touch-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Account Number</Label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Enter account number"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value.replace(/\D/g, '') })}
                      className="touch-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      placeholder="e.g., SBIN0001234"
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase().slice(0, 11) })}
                      className="touch-input"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
