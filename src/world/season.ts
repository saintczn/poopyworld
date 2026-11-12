/**
 * The calendar of PoopyWorld: seasons, holidays and your own special days, all following the real date.
 * For testing: ?date=2026-12-05, ?season=autumn, ?holiday=christmas,birthday
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Holiday = 'sinterklaas' | 'christmas' | 'newyear' | 'valentine' | 'birthday' | 'anniversary';

const params = () => new URLSearchParams(location.search);

/** Today (or the test date). */
export function today(): Date {
  const forced = params().get('date');
  if (forced) {
    const [y, m, d] = forced.split('-').map(Number);
    const now = new Date();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes());
  }
  return new Date();
}

export function season(d = today()): Season {
  const forced = params().get('season') as Season | null;
  if (forced) return forced;
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

// ---------------------------------------------------------------- your own dates (set in the Hub)
export type SpecialDates = {
  /** Birthdays as "MM-DD" with a name. */
  birthdays: Array<{ name: string; date: string; year?: string }>;
  /** The day you got together, "YYYY-MM-DD". */
  together?: string;
};
const DK = 'poopyworld.dates.v1';
export function loadDates(): SpecialDates {
  try { return { birthdays: [], ...JSON.parse(localStorage.getItem(DK) ?? '{}') }; } catch { return { birthdays: [] }; }
}
export function saveDates(d: SpecialDates) {
  try { localStorage.setItem(DK, JSON.stringify(d)); } catch { /* fine */ }
}

const mmdd = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Whose birthday is it today (names)? */
export function birthdaysToday(d = today()): string[] {
  const forced = params().get('holiday');
  if (forced?.includes('birthday')) return [loadDates().birthdays[0]?.name || 'Ginger'];
  return loadDates().birthdays.filter((b) => b.date === mmdd(d)).map((b) => b.name);
}

/** How many years together, if today is the anniversary. */
export function anniversaryYears(d = today()): number | null {
  const t = loadDates().together;
  const forced = params().get('holiday');
  if (forced?.includes('anniversary')) return t ? Math.max(1, d.getFullYear() - Number(t.slice(0, 4))) : 1;
  if (!t || t.slice(5) !== mmdd(d)) return null;
  const years = d.getFullYear() - Number(t.slice(0, 4));
  return years > 0 ? years : null;
}

/** Days since you got together (for the book). */
export function daysTogether(d = today()): number | null {
  const t = loadDates().together;
  if (!t) return null;
  const [y, m, dd] = t.split('-').map(Number);
  return Math.floor((d.getTime() - new Date(y, m - 1, dd).getTime()) / 86400000);
}

export function holidays(d = today()): Holiday[] {
  const forced = params().get('holiday');
  if (forced) return forced.split(',') as Holiday[];
  const m = d.getMonth() + 1, day = d.getDate();
  const out: Holiday[] = [];
  if ((m === 11 && day >= 13) || (m === 12 && day <= 5)) out.push('sinterklaas');
  if (m === 12 && day >= 6 && day <= 27) out.push('christmas');
  if ((m === 12 && day === 31) || (m === 1 && day === 1)) out.push('newyear');
  if (m === 2 && day === 14) out.push('valentine');
  if (birthdaysToday(d).length) out.push('birthday');
  if (anniversaryYears(d)) out.push('anniversary');
  return out;
}

export function isHoliday(h: Holiday) {
  return holidays().includes(h);
}
