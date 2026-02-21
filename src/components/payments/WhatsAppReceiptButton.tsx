import { MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Payment } from '@/hooks/useData';

interface WhatsAppReceiptButtonProps {
  payment: Payment;
  agentName?: string;
}

function generateReceiptText(payment: Payment, agentName?: string) {
  const customer = payment.customers;
  if (!customer) return '';

  const totalPaid = Number(payment.amount);
  const loanAmount = Number(customer.loan_amount || 0);
  const dailyAmount = Number(customer.daily_amount || 0);
  const date = new Date(payment.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return [
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
}

function generatePdfReceipt(payment: Payment, agentName?: string) {
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
  const receiptId = payment.id.slice(0, 8).toUpperCase();

  // Build HTML receipt
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; padding: 20px; }
  .receipt { max-width: 400px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; padding: 24px 20px; text-align: center; }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
  .header p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
  .header .license { font-size: 10px; opacity: 0.7; margin-top: 2px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 16px; font-size: 12px; font-weight: 600; margin-top: 12px; }
  .body { padding: 20px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #64748b; }
  .row .value { font-weight: 600; color: #1e293b; }
  .section { margin-top: 16px; }
  .section-title { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #eff6ff; }
  .amount-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
  .amount-box .amount { font-size: 28px; font-weight: 800; color: #059669; }
  .amount-box .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .footer { background: #f8fafc; padding: 16px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 11px; color: #94a3b8; }
  .status-paid { color: #059669; background: #ecfdf5; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .status-unpaid { color: #d97706; background: #fffbeb; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>VVL ENTERPRISES</h1>
    <p>Finance Management</p>
    <p class="license">License: TN-02-0194510</p>
    <div class="badge">PAYMENT RECEIPT</div>
  </div>
  <div class="body">
    <div class="row">
      <span class="label">Receipt ID</span>
      <span class="value">#${receiptId}</span>
    </div>
    <div class="row">
      <span class="label">Date</span>
      <span class="value">${date}</span>
    </div>

    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="row"><span class="label">Name</span><span class="value">${customer.name}</span></div>
      <div class="row"><span class="label">Mobile</span><span class="value">${customer.mobile}</span></div>
      <div class="row"><span class="label">Area</span><span class="value">${customer.area}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Loan Details</div>
      <div class="row"><span class="label">Loan Amount</span><span class="value">₹${loanAmount.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Daily Amount</span><span class="value">₹${dailyAmount.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="amount-box">
      <div class="amount">₹${totalPaid.toLocaleString('en-IN')}</div>
      <div class="label">Amount Paid</div>
    </div>

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="row"><span class="label">Mode</span><span class="value">${payment.mode === 'cash' ? '💵 Cash' : '📱 Online'}</span></div>
      <div class="row"><span class="label">Status</span><span class="${payment.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</span></div>
      ${payment.remarks ? `<div class="row"><span class="label">Remarks</span><span class="value">${payment.remarks}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Collection Agent</div>
      <div class="row"><span class="label">Agent</span><span class="value">${agentName || 'VVL Agent'}</span></div>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for your payment!</p>
    <p style="margin-top:4px">© ${new Date().getFullYear()} VVL Enterprises. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;

  // Open in new window and trigger print (which allows Save as PDF)
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

export function WhatsAppReceiptButton({ payment, agentName }: WhatsAppReceiptButtonProps) {
  const handleWhatsAppShare = () => {
    const customer = payment.customers;
    if (!customer) return;

    const receipt = generateReceiptText(payment, agentName);
    const phoneNumber = customer.mobile.startsWith('91')
      ? customer.mobile
      : `91${customer.mobile}`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(receipt)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePdfReceipt = () => {
    generatePdfReceipt(payment, agentName);
  };

  if (!payment.customers || payment.status !== 'paid') return null;

  return (
    <div className="flex gap-1">
    
      {/*  
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
        onClick={(e) => {
          e.stopPropagation();
          handleWhatsAppShare();
        }}
        title="Share receipt via WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
 */}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
        onClick={(e) => {
          e.stopPropagation();
          handlePdfReceipt();
        }}
        title="Generate PDF receipt"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </div>
  );
}
