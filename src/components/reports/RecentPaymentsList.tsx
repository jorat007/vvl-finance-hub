import { useState } from "react";
import { Clock, ChevronRight, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Payment, useUpdatePayment } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissionChecker } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppReceiptButton } from "@/components/payments/WhatsAppReceiptButton";
import { Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecentPaymentsListProps {
  payments: Payment[] | undefined;
  isLoading: boolean;
  limit?: number;
}

export function RecentPaymentsList({ payments, isLoading, limit = 10 }: RecentPaymentsListProps) {
  const { user, isAdmin, isManager } = useAuth();
  const checkPermission = usePermissionChecker();
  const updatePayment = useUpdatePayment();
  const { toast } = useToast();

  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: "",
    mode: "cash" as "cash" | "online",
    status: "paid" as "paid" | "not_paid",
    remarks: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const canUpdateOwnPayments = checkPermission("payment_update_own");
  const canUpdateAllPayments = checkPermission("payment_update");
  const sameDayOnly = checkPermission("payment_same_day_only");

  const canEditPayment = (payment: Payment) => {
    const today = new Date().toISOString().split("T")[0];
    const isOwnPayment = payment.agent_id === user?.id;
    const isSameDay = payment.date === today;
    if (isAdmin || isManager || canUpdateAllPayments) return true;
    if (!isOwnPayment) return false;
    if (sameDayOnly && !isSameDay) return false;
    return canUpdateOwnPayments;
  };

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditFormData({
      amount: String(payment.amount),
      mode: payment.mode,
      status: payment.status,
      remarks: payment.remarks || "",
    });
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    const amount = Math.round((parseFloat(editFormData.amount) || 0) * 100) / 100;

    // ✅ Validate amount > 0
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0.",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updatePayment.mutateAsync({
        id: editingPayment.id,
        amount,
        mode: editFormData.mode,
        status: editFormData.status,
        remarks: editFormData.remarks || null,
      });
      toast({ title: "Payment Updated", description: "Payment has been updated successfully." });
      setEditingPayment(null);
    } catch (_error: unknown) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update payment. Please try again." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="form-section">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Payments
          </h3>
          <span className="text-xs text-muted-foreground">Last {limit} transactions</span>
        </div>

        {!payments || payments.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No payments recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Payments will appear here once added</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, limit).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    payment.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                  )}
                >
                  {payment.customers?.name?.charAt(0) || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {payment.customers?.name || "Unknown Customer"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{payment.customers?.area}</span>
                    <span>•</span>
                    <span>
                      {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{payment.mode}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn("font-bold", payment.status === "paid" ? "text-success" : "text-warning")}>
                    ₹{Number(payment.amount).toLocaleString("en-IN")}
                  </p>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      payment.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                    )}
                  >
                    {payment.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  {canEditPayment(payment) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditPayment(payment);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <WhatsAppReceiptButton payment={payment} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update the payment details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={editFormData.mode === "cash" ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, mode: "cash" })}
                >
                  💵 Cash
                </Button>
                <Button
                  type="button"
                  variant={editFormData.mode === "online" ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, mode: "online" })}
                >
                  📱 Online
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={editFormData.status === "paid" ? "default" : "outline"}
                  className={editFormData.status === "paid" ? "bg-success hover:bg-success/90" : ""}
                  onClick={() => setEditFormData({ ...editFormData, status: "paid" })}
                >
                  ✅ Paid
                </Button>
                <Button
                  type="button"
                  variant={editFormData.status === "not_paid" ? "default" : "outline"}
                  className={editFormData.status === "not_paid" ? "bg-warning hover:bg-warning/90" : ""}
                  onClick={() => setEditFormData({ ...editFormData, status: "not_paid" })}
                >
                  ⏳ Not Paid
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                placeholder="Optional remarks..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
