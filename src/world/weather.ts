/**
 * The real weather in Amsterdam (from Open-Meteo, free and without a key), so that when it rains
 * outside your window it rains in your garden too. Cached for half an hour; if the internet is
 * unavailable the game simply keeps clear skies. For testing: ?weather=rain|storm|fog|snow|cloudy|clear
 */
export type Weather = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm' | 'snow';

const K = 'poopyworld.weather.v1';
const URL_ = 'https://api.open-meteo.com/v1/forecast?latitude=52.37&longitude=4.89&current=weather_code,temperature_2m';

function fromCode(code: number): Weather {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
}

type Cached = { at: number; weather: Weather; temp?: number };

/** What we know right now (instant). */
export function weatherNow(): { weather: Weather; temp?: number } {
  const forced = new URLSearchParams(location.search).get('weather') as Weather | null;
  if (forced) return { weather: forced };
  try {
    const c = JSON.parse(localStorage.getItem(K) ?? 'null') as Cached | null;
    if (c && Date.now() - c.at < 3 * 3600000) return { weather: c.weather, temp: c.temp };
  } catch { /* fine */ }
  return { weather: 'clear' };
}

/** Fetches fresh weather if the cache is older than 30 minutes. Resolves with the (new) weather. */
export async function refreshWeather(): Promise<{ weather: Weather; temp?: number }> {
  if (new URLSearchParams(location.search).get('weather')) return weatherNow();
  try {
    const c = JSON.parse(localStorage.getItem(K) ?? 'null') as Cached | null;
    if (c && Date.now() - c.at < 30 * 60000) return { weather: c.weather, temp: c.temp };
  } catch { /* fine */ }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(URL_, { signal: ctrl.signal });
    clearTimeout(timer);
    const j = await r.json();
    const out: Cached = { at: Date.now(), weather: fromCode(Number(j.current?.weather_code ?? 0)), temp: j.current?.temperature_2m };
    localStorage.setItem(K, JSON.stringify(out));
    return { weather: out.weather, temp: out.temp };
  } catch {
    return weatherNow();
  }
}

export const WEATHER_NL: Record<Weather, string> = {
  clear: 'zonnig', cloudy: 'bewolkt', fog: 'mistig', rain: 'regen', storm: 'onweer', snow: 'sneeuw',
};
