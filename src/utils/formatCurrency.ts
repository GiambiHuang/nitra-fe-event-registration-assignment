const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

/**
 * Formats an amount as US currency, e.g. "$1,234.00" — the one place prices
 * get formatted, per CLAUDE.md's "format currency through shared utils, never
 * ad hoc" rule.
 * @param amount - The amount in dollars (not cents).
 * @returns e.g. "$1,234.00".
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}
