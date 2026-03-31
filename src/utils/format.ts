export const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
export const formatNumber = (value: number, digits = 2) => value.toFixed(digits);
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
