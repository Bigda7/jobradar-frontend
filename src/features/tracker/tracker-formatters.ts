import type { TrackerSnapshot } from './tracker-schema';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatDecimal(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : value;
}

export function formatTrackerSalary(
  snapshot: TrackerSnapshot,
): string | null {
  if (!snapshot.salaryMin && !snapshot.salaryMax) {
    return null;
  }

  const amount =
    snapshot.salaryMin && snapshot.salaryMax
      ? `${formatDecimal(snapshot.salaryMin)}–${formatDecimal(snapshot.salaryMax)}`
      : formatDecimal(snapshot.salaryMin ?? snapshot.salaryMax!);
  const currency = snapshot.salaryCurrency
    ? ` ${snapshot.salaryCurrency}`
    : '';
  const period = snapshot.salaryPeriod ? ` / ${snapshot.salaryPeriod}` : '';

  return `${amount}${currency}${period}`;
}
