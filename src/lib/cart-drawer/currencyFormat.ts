// @ts-nocheck
const currencyLocaleMap: Record<string, string> = {
  'R$': 'pt-BR',
  '$': 'en-US',
  '€': 'de-DE',
  '£': 'en-GB',
  'S/': 'es-PE',
};

const currencyCodeMap: Record<string, string> = {
  'R$': 'BRL',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'S/': 'PEN',
};

export function formatCurrency(amount: number, symbol: string = 'R$'): string {
  const locale = currencyLocaleMap[symbol] || 'en-US';
  const code = currencyCodeMap[symbol] || 'USD';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

export function reformatPriceString(price: string | number, symbol: string = 'R$'): string {
  const n = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  if (isNaN(n)) return String(price);
  return formatCurrency(n, symbol);
}