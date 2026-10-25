// Backend stores integer cents; currency is a display choice only.
const CURRENCY = 'USD';
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY });
export const money = (cents: number) => fmt.format(cents / 100);
