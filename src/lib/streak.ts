/**
 * Date keys + streak maths. Pure functions, no React, no storage —
 * which is what makes them easy to test (see streak.test.ts).
 *
 * A "date key" is a local calendar day written as "YYYY-MM-DD".
 * We store days, not timestamps, so a check-in at 11:59 pm and one at
 * 12:01 am land on different days no matter the time zone.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export function todayKey(): string {
  return toKey(new Date());
}

/**
 * Current streak: count backwards while each day has a check-in.
 *
 * DESIGN CHOICE — the "grace" rule:
 * If today isn't checked yet, we start counting from yesterday instead of
 * showing 0. Otherwise every streak would look broken each morning until
 * the user taps. The streak only really breaks once a full day is missed.
 */
export function currentStreak(dates: ReadonlySet<string>, today: string): number {
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/** Longest run of consecutive days ever. */
export function bestStreak(dates: ReadonlySet<string>): number {
  let best = 0;
  for (const day of dates) {
    // Only start counting at the first day of a run.
    if (dates.has(addDays(day, -1))) continue;
    let length = 1;
    let next = addDays(day, 1);
    while (dates.has(next)) {
      length += 1;
      next = addDays(next, 1);
    }
    if (length > best) best = length;
  }
  return best;
}

/** "20:00" -> "8:00 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}

export function makeTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}
