import type { TrackerSnapshot } from './tracker-schema';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatDecimal(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : value;
}

function formatSourceName(value: string): string {
  const normalized = value.replace(/^www\./, '');

  if (normalized.includes('.')) {
    return normalized;
  }

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatTrackerPlatform(snapshot: TrackerSnapshot): string {
  const explicitName = snapshot.sourceDisplayName?.trim() || snapshot.sourceName?.trim();

  if (explicitName) {
    return explicitName;
  }

  if (snapshot.sourceUrl) {
    try {
      return formatSourceName(new URL(snapshot.sourceUrl).hostname);
    } catch {
      return 'Source not specified';
    }
  }

  return 'Source not specified';
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
