/**
 * Format a number as Japanese currency (JPY)
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '--';
  
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format a date as a localized string
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};