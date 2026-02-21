import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoanShareData {
  customerName: string;
  mobile: string;
  loanDisplayId: string;
  loanAmount: number;
  interestRate: number;
  processingFeeRate: number;
  otherDeductions: number;
  includeChargesInOutstanding: boolean;
  disbursalAmount: number;
  outstandingAmount: number;
  dailyAmount: number;
  startDate: string;
  endDate?: string;
}

function generateLoanShareText(data: LoanShareData) {
  const interestAmt = Math.round(data.loanAmount * data.interestRate / 100);
  const processingAmt = Math.round(data.loanAmount * data.processingFeeRate / 100);
  const totalCharges = interestAmt + processingAmt + data.otherDeductions;

  const startFormatted = new Date(data.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const endFormatted = data.endDate ? new Date(data.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

  return [
    `━━━━━━━━━━━━━━━━━━━━`,
    `   🏢 *VVL ENTERPRISES*`,
    `   _Finance Management_`,
    `   License: TN-02-0194510`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *LOAN DETAILS*`,
    ``,
    `━━━ Customer Details ━━━`,
    `👤 Name: *${data.customerName}*`,
    `📱 Mobile: ${data.mobile}`,
    ``,
    `━━━ Loan Information ━━━`,
    `🔖 Loan ID: *${data.loanDisplayId}*`,
    `💰 Gross Loan Amount: ₹${data.loanAmount.toLocaleString('en-IN')}`,
    ``,
    `━━━ Charges Breakdown ━━━`,
    `📊 Interest (${data.interestRate}%): ₹${interestAmt.toLocaleString('en-IN')}`,
    `📊 Processing Fee (${data.processingFeeRate}%): ₹${processingAmt.toLocaleString('en-IN')}`,
    data.otherDeductions > 0 ? `📊 Other Deductions: ₹${data.otherDeductions.toLocaleString('en-IN')}` : '',
    `📊 *Total Charges: ₹${totalCharges.toLocaleString('en-IN')}*`,
    ``,
    `━━━ Settlement ━━━━━━━━━`,
    `💵 Net Disbursal: *₹${data.disbursalAmount.toLocaleString('en-IN')}*`,
    `💰 Outstanding Amount: *₹${data.outstandingAmount.toLocaleString('en-IN')}*`,
    `📅 Daily Installment: ₹${data.dailyAmount.toLocaleString('en-IN')}`,
    ``,
    `━━━ Tenure ━━━━━━━━━━━━`,
    `📅 From: ${startFormatted}`,
    `📅 To: ${endFormatted}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `  _VVL Enterprises_`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].filter(Boolean).join('\n');
}

export function WhatsAppLoanShareButton({ data }: { data: LoanShareData }) {
  const handleShare = () => {
    const text = generateLoanShareText(data);
    const phoneNumber = data.mobile.startsWith('91') ? data.mobile : `91${data.mobile}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-success text-success hover:bg-success/10"
      onClick={handleShare}
    >
      <MessageCircle className="w-4 h-4 mr-1" /> Share via WhatsApp
    </Button>
  );
}
