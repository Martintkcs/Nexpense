/**
 * Pénzösszeg formázás (pl. 4320 → "4 320 Ft")
 */
export function formatCurrency(amount: number, currency = 'HUF', locale = 'hu-HU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Munkaórák számítása: ár / órabér
 */
export function calcWorkHours(price: number, hourlyWage: number): { hours: number; minutes: number; display: string } {
  const totalHours = price / hourlyWage;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  let display = '';
  if (hours > 0) display += `${hours} óra `;
  display += `${minutes} perc`;

  return { hours, minutes, display: display.trim() };
}

/**
 * Összeg rövidítése (pl. 127450 → "127K")
 */
export function shortenAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return amount.toString();
}
