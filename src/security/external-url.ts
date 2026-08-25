const allowedExternalProtocols = new Set(['http:', 'https:']);
const maximumExternalUrlLength = 2_048;

export function isSafeExternalUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > maximumExternalUrlLength) {
    return false;
  }

  try {
    return allowedExternalProtocols.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
