import { MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { numberToWords } from '@/lib/numberToWords';

interface LoanShareData {
  customerName: string;
  mobile: string;
  loanDisplayId: string;
  loanAmount: number;
  interestRate: number;
  processingFeeRate: number;
  otherDeductions: number;
  otherDeductionRemarks?: string;
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
    `   🏢 *VVL ENTERPRISES*`,
    `   _Finance Management_`,
    `   License: TN-02-0194510`,
    ``,
    ``,
    `📋 *LOAN DETAILS*`,
    ``,
    `Customer Details`,
    `👤 Name: *${data.customerName}*`,
    `📱 Mobile: ${data.mobile}`,
    ``,
    `Loan Information`,
    `🔖 Loan ID: *${data.loanDisplayId}*`,
    `💰 Gross Loan Amount: ₹${data.loanAmount.toLocaleString('en-IN')}`,
    ``,
    `Charges Breakdown`,
    `📊 Interest (${data.interestRate}%): ₹${interestAmt.toLocaleString('en-IN')}`,
    `📊 Processing Fee (${data.processingFeeRate}%): ₹${processingAmt.toLocaleString('en-IN')}`,
    data.otherDeductions > 0 ? `📊 Other Deductions: ₹${data.otherDeductions.toLocaleString('en-IN')}` : '',
    `📊 *Total Charges: ₹${totalCharges.toLocaleString('en-IN')}*`,
    ``,
    `Settlement`,
    `💵 Net Disbursal: *₹${data.disbursalAmount.toLocaleString('en-IN')}*`,
    `💰 Outstanding Amount: *₹${data.outstandingAmount.toLocaleString('en-IN')}*`,
    `📅 Daily Installment: ₹${data.dailyAmount.toLocaleString('en-IN')}`,
    ``,
    `Tenure`,
    `📅 From: ${startFormatted}`,
    `📅 To: ${endFormatted}`,
    ``,
    ``,
    `  VVL Enterprises `,
    ``,
  ].filter(Boolean).join('\n');
}

function generateLoanPdf(data: LoanShareData) {
  const interestAmt = Math.round(data.loanAmount * data.interestRate / 100);
  const processingAmt = Math.round(data.loanAmount * data.processingFeeRate / 100);
  const totalCharges = interestAmt + processingAmt + data.otherDeductions;

  const startFormatted = new Date(data.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const endFormatted = data.endDate ? new Date(data.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Loan Details - ${data.loanDisplayId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @media print {
    body { padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; padding: 20px; color: #1e293b; }
  .doc { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: #fff; padding: 28px 24px 20px; text-align: center; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
  .header .sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
  .header .license { font-size: 10px; opacity: 0.6; margin-top: 2px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.18); border-radius: 20px; padding: 5px 20px; font-size: 13px; font-weight: 700; margin-top: 14px; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .body { padding: 24px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #eff6ff; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #64748b; }
  .row .value { font-weight: 600; color: #1e293b; text-align: right; }
  .highlight-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 12px; padding: 16px; margin: 16px 0; display: flex; justify-content: space-around; text-align: center; }
  .highlight-box .item {}
  .highlight-box .amount { font-size: 22px; font-weight: 800; color: #1d4ed8; }
  .highlight-box .lbl { font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .amount-words { font-size: 11px; color: #64748b; font-style: italic; text-align: center; margin-top: -8px; margin-bottom: 12px; }
  .charges-total { background: #f8fafc; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #dc2626; margin-top: 8px; }
  .tenure-bar { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .tenure-bar .date-block { text-align: center; }
  .tenure-bar .date-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
  .tenure-bar .date-value { font-size: 13px; font-weight: 700; color: #15803d; margin-top: 2px; }
  .tenure-bar .arrow { font-size: 18px; color: #86efac; }
  .daily-box { background: linear-gradient(135deg, #fefce8, #fef9c3); border-radius: 12px; padding: 14px; text-align: center; margin-top: 12px; }
  .daily-box .amount { font-size: 24px; font-weight: 800; color: #a16207; }
  .daily-box .lbl { font-size: 10px; color: #92400e; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 11px; color: #94a3b8; }
  .footer .note { font-size: 10px; color: #cbd5e1; margin-top: 6px; }
  .print-btn { display: block; margin: 16px auto; padding: 10px 28px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .print-btn:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <h1>VVL ENTERPRISES</h1>
    <div class="sub">Finance Management</div>
    <div class="license">License No: TN-02-0194510</div>
    <div class="badge">LOAN AGREEMENT</div>
  </div>
  <div class="meta">
    <span>Loan ID: <b>${data.loanDisplayId}</b></span>
    <span>Date: ${today}</span>
  </div>
  <div class="body">
    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="row"><span class="label">Name</span><span class="value">${data.customerName}</span></div>
      <div class="row"><span class="label">Mobile</span><span class="value">${data.mobile}</span></div>
    </div>

    <div class="highlight-box">
      <div class="item">
        <div class="amount">₹${data.loanAmount.toLocaleString('en-IN')}</div>
        <div class="lbl">Gross Loan Amount</div>
      </div>
    </div>
    <div class="amount-words">( ${numberToWords(data.loanAmount)} Rupees Only )</div>

    <div class="section">
      <div class="section-title">Charges Breakdown</div>
      <div class="row"><span class="label">Interest @ ${data.interestRate}%</span><span class="value">₹${interestAmt.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Processing Fee @ ${data.processingFeeRate}%</span><span class="value">₹${processingAmt.toLocaleString('en-IN')}</span></div>
      ${data.otherDeductions > 0 ? `<div class="row"><span class="label">Other Deductions${data.otherDeductionRemarks ? ' (' + data.otherDeductionRemarks + ')' : ''}</span><span class="value">₹${data.otherDeductions.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="charges-total"><span>Total Charges</span><span>₹${totalCharges.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Settlement Summary</div>
      <div class="row"><span class="label">Net Disbursal Amount</span><span class="value" style="color:#059669;font-size:15px;">₹${data.disbursalAmount.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Total Outstanding Amount</span><span class="value" style="color:#dc2626;font-size:15px;">₹${data.outstandingAmount.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Charges ${data.includeChargesInOutstanding ? 'Included in' : 'Deducted from'} Outstanding</span><span class="value" style="font-size:11px;">${data.includeChargesInOutstanding ? 'Yes – Full amount disbursed' : 'No – Charges deducted upfront'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Tenure</div>
      <div class="tenure-bar">
        <div class="date-block"><div class="date-label">From</div><div class="date-value">${startFormatted}</div></div>
        <div class="arrow">→</div>
        <div class="date-block"><div class="date-label">To</div><div class="date-value">${endFormatted}</div></div>
      </div>
    </div>

    <div class="daily-box">
      <div class="amount">₹${data.dailyAmount.toLocaleString('en-IN')}</div>
      <div class="lbl">Daily Installment Amount</div>
    </div>
  </div>
  <div class="footer">
    <p>This is a system-generated loan summary from VVL Enterprises.</p>
    <p class="note">© ${new Date().getFullYear()} VVL Enterprises. All rights reserved.</p>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">📄 Save as PDF / Print</button>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  }
}

export function WhatsAppLoanShareButton({ data }: { data: LoanShareData }) {
  const handleWhatsApp = () => {
    const text = generateLoanShareText(data);
    const phoneNumber = data.mobile.startsWith('91') ? data.mobile : `91${data.mobile}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePdf = () => {
    generateLoanPdf(data);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-success text-primary hover:bg-primary/10"
        onClick={handlePdf}
      >
        <MessageCircle className="w-4 h-4 mr-1" /> PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-success text-success hover:bg-success/10"
        onClick={handleWhatsApp}
      >
        <MessageCircle className="w-4 h-4 mr-1" /> Message
      </Button>
    </div>
  );
}
