import type { JobResponse } from '../../api';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

function formatDecimal(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : value;
}

export function formatSalary(
  match: Pick<
    JobResponse,
    | 'salary_min'
    | 'salary_max'
    | 'salary_currency'
    | 'salary_period'
  >,
): string | null {
  const { salary_min, salary_max, salary_currency, salary_period } = match;

  if (!salary_min && !salary_max) {
    return null;
  }

  const amount =
    salary_min && salary_max
      ? `${formatDecimal(salary_min)}–${formatDecimal(salary_max)}`
      : formatDecimal(salary_min ?? salary_max!);
  const currency = salary_currency ? ` ${salary_currency}` : '';
  const period = salary_period ? ` / ${salary_period}` : '';

  return `${amount}${currency}${period}`;
}

export function formatRelativeDate(
  value: string | null,
  fallback = 'Date unavailable',
  now = Date.now(),
): string {
  if (!value) {
    return fallback;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return fallback;
  }

  const seconds = Math.min(0, Math.round((timestamp - now) / 1_000));
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTimeFormatter.format(
        Math.round(seconds / unitSeconds),
        unit,
      );
    }
  }

  return 'just now';
}

export function formatLabel(value: string): string {
  return value
    .trim()
    .split(/\s*[,;/|]\s*/)
    .filter(Boolean)
    .map((label) =>
      label
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' '),
    )
    .join(', ');
}
