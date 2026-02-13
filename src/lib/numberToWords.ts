// Indian numbering system: Crore, Lakh, Thousand
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convertChunk(num % 100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);

  const intPart = Math.floor(num);
  let result = '';

  if (intPart >= 10000000) {
    result += convertChunk(Math.floor(intPart / 10000000)) + ' Crore ';
    return result + numberToWords(intPart % 10000000);
  }
  if (intPart >= 100000) {
    result += convertChunk(Math.floor(intPart / 100000)) + ' Lakh ';
    return result + numberToWords(intPart % 100000);
  }
  if (intPart >= 1000) {
    result += convertChunk(Math.floor(intPart / 1000)) + ' Thousand ';
    return result + numberToWords(intPart % 1000);
  }

  return convertChunk(intPart).trim();
}
