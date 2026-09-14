/**
 * Deterministic Indian Number and Currency Formatter
 * Avoids SSR / client hydration mismatches by not relying on browser-locale-dependent toLocaleString.
 */

export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  const isNegative = val < 0;
  const absVal = Math.abs(Math.round(val));
  const str = absVal.toString();

  if (str.length <= 3) {
    return (isNegative ? '-' : '') + str;
  }

  // Last 3 digits
  const lastThree = str.substring(str.length - 3);
  // Rest of the digits grouped in 2s from right to left
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return (isNegative ? '-' : '') + formattedOther + ',' + lastThree;
}

export function formatCurrencyINR(val: number, showDecimals = false): string {
  if (showDecimals) {
    const fixed = Math.abs(val).toFixed(2);
    const [whole, decimal] = fixed.split('.');
    const formattedWhole = formatINR(Number(whole));
    const prefix = val < 0 ? '-₹' : '₹';
    return `${prefix}${formattedWhole}.${decimal}`;
  }
  return (val < 0 ? '-₹' : '₹') + formatINR(val);
}
