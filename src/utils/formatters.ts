export function formatNumberWithComma(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumberWithComma(value, decimals)}%`;
}

