export const IST_MS = 5.5 * 60 * 60 * 1000;

// The moment today (India time) started, minus `offsetDays` days
export function istDayStart(offsetDays = 0): Date {
  const shifted = new Date(Date.now() + IST_MS);
  const start = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - offsetDays
  );
  return new Date(start - IST_MS);
}