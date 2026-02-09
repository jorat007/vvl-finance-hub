import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Payment } from '@/hooks/useData';

interface WhatsAppReceiptButtonProps {
  payment: Payment;
  agentName?: string;
}

export function WhatsAppReceiptButton({ payment, agentName }: WhatsAppReceiptButtonProps) {
  const handleShare = () => {
    const customer = payment.customers;
    if (!customer) return;

    const totalPaid = Number(payment.amount);
    const loanAmount = Number(customer.loan_amount || 0);
    const dailyAmount = Number(customer.daily_amount || 0);
    const date = new Date(payment.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const receipt = [
      `━━━━━━━━━━━━━━━━━━━━`,
      `   🏢 *VVL ENTERPRISES*`,
      `   _Finance Management_`,
      `   License: TN-02-0194510`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📋 *PAYMENT RECEIPT*`,
      ``,
      `📅 Date: ${date}`,
      `🔖 Receipt ID: ${payment.id.slice(0, 8).toUpperCase()}`,
      ``,
      `━━━ Customer Details ━━━`,
      `👤 Name: *${customer.name}*`,
      `📱 Mobile: ${customer.mobile}`,
      `📍 Area: ${customer.area}`,
      ``,
      `━━━ Loan Details ━━━━━━`,
      `💰 Loan Amount: ₹${loanAmount.toLocaleString('en-IN')}`,
      `📊 Daily Amount: ₹${dailyAmount.toLocaleString('en-IN')}`,
      ``,
      `━━━ Payment Details ━━━`,
      `💵 Amount Paid: *₹${totalPaid.toLocaleString('en-IN')}*`,
      `💳 Mode: ${payment.mode === 'cash' ? 'Cash' : 'Online'}`,
      `✅ Status: ${payment.status === 'paid' ? 'Paid' : 'Not Paid'}`,
      payment.remarks ? `📝 Remarks: ${payment.remarks}` : '',
      ``,
      `━━━ Collection Agent ━━━`,
      `🧑‍💼 Agent: ${agentName || 'VVL Agent'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `  _Thank you for your payment!_`,
      `  _VVL Enterprises_`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ].filter(Boolean).join('\n');

    const phoneNumber = customer.mobile.startsWith('91')
      ? customer.mobile
      : `91${customer.mobile}`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(receipt)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!payment.customers || payment.status !== 'paid') return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      title="Share receipt via WhatsApp"
    >
      <MessageCircle className="w-4 h-4" />
    </Button>
  );
}
