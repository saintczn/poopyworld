/**
 * Hub v0: the menu side of PoopyWorld. Today's greeting, a daily check-in, the question of the day
 * and a short history. Saved in this browser until accounts exist (milestone 2).
 */
import { loadDates, saveDates, daysTogether } from '../world/season';
import { MOODS, questionOfTheDay } from '../content/questions';
import { loadCatches } from '../content/fish';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

type CheckIn = { date: string; mood: string; day: string; thanks: string };
type Answers = Record<string, { question: string; answer: string }>;

const K_CHECKINS = 'poopyworld.checkins.v1';
const K_ANSWERS = 'poopyworld.answers.v1';

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* still works for this session */ }
}
const today = () => new Date().toISOString().slice(0, 10);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export class Hub {
  private root = $('hub');
  private mood = '';
  private onClose: () => void = () => {};

  constructor() {
    $('hub-close').addEventListener('click', () => this.close());
    $('checkin-save').addEventListener('click', () => this.saveCheckIn());
    $('answer-save').addEventListener('click', () => this.saveAnswer());
    $('dates-save').addEventListener('click', () => this.saveDates());
    const moods = $('moods');
    for (const [name, colour] of MOODS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mood';
      b.textContent = name;
      b.style.setProperty('--mood', colour);
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        this.mood = name;
        moods.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      moods.appendChild(b);
    }
  }

  get isOpen() { return !this.root.hidden; }

  open(name: string, onClose: () => void) {
    this.onClose = onClose;
    const h = new Date().getHours();
    const hello = h < 6 ? 'Goedenacht' : h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond';
    $('hub-hello').textContent = `${hello}, ${name}!`;
    $('hub-date').textContent = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
    $('hub-question').textContent = questionOfTheDay();
    const ans = read<Answers>(K_ANSWERS, {})[today()];
    $<HTMLTextAreaElement>('answer-text').value = ans?.answer ?? '';
    $('answer-note').textContent = ans ? 'Opgeslagen. Je kunt het nog aanpassen.' : '';
    const fish = loadCatches();
    const caught = Object.values(fish).reduce((a, b) => a + b, 0);
    $('hub-stats').textContent = caught ? `Je hebt al ${caught} keer iets gevangen in de vijver (${Object.keys(fish).length} soorten).` : 'Tip: probeer eens te vissen bij de vijver.';
    this.renderHistory();
    this.fillDates();
    this.root.hidden = false;
  }

  private fillDates() {
    const d = loadDates();
    const year = new Date().getFullYear();
    [0, 1].forEach((i) => {
      const b = d.birthdays[i];
      $<HTMLInputElement>(`bday${i + 1}-name`).value = b?.name ?? '';
      $<HTMLInputElement>(`bday${i + 1}-date`).value = b ? `${b.year ?? year}-${b.date}` : '';
    });
    $<HTMLInputElement>('together-date').value = d.together ?? '';
    const days = daysTogether();
    $('dates-note').textContent = days !== null && days >= 0 ? `Jullie zijn al ${days} dagen samen.` : '';
  }

  private saveDates() {
    const birthdays = [1, 2].flatMap((i) => {
      const name = $<HTMLInputElement>(`bday${i}-name`).value.trim();
      const v = $<HTMLInputElement>(`bday${i}-date`).value;
      return name && v ? [{ name, date: v.slice(5), year: v.slice(0, 4) }] : [];
    });
    const together = $<HTMLInputElement>('together-date').value || undefined;
    saveDates({ birthdays, together });
    const days = daysTogether();
    $('dates-note').textContent = `Opgeslagen!${days !== null && days >= 0 ? ` Jullie zijn al ${days} dagen samen.` : ''}`;
  }

  close() {
    this.root.hidden = true;
    this.onClose();
  }

  private saveCheckIn() {
    const note = $('checkin-note');
    if (!this.mood) { note.textContent = 'Kies eerst hoe je je voelt.'; return; }
    const list = read<CheckIn[]>(K_CHECKINS, []).filter((c) => c.date !== today());
    list.unshift({ date: today(), mood: this.mood, day: $<HTMLInputElement>('checkin-day').value.trim(), thanks: $<HTMLInputElement>('checkin-thanks').value.trim() });
    write(K_CHECKINS, list.slice(0, 60));
    note.textContent = 'Check-in opgeslagen. Fijn dat je er bent!';
    this.renderHistory();
  }

  private saveAnswer() {
    const text = $<HTMLTextAreaElement>('answer-text').value.trim();
    if (!text) { $('answer-note').textContent = 'Typ eerst een antwoord.'; return; }
    const all = read<Answers>(K_ANSWERS, {});
    all[today()] = { question: questionOfTheDay(), answer: text };
    write(K_ANSWERS, all);
    $('answer-note').textContent = 'Opgeslagen. Met accounts zien jullie straks elkaars antwoord, pas als jullie allebei hebben geantwoord.';
  }

  private renderHistory() {
    const list = read<CheckIn[]>(K_CHECKINS, []);
    const box = $('hub-history');
    if (!list.length) { box.innerHTML = '<p class="muted">Nog geen check-ins. Je eerste staat hier zodra je hem opslaat.</p>'; return; }
    const colour = Object.fromEntries(MOODS);
    box.innerHTML = list.slice(0, 5).map((c) => `
      <div class="hist-row">
        <span class="chip" style="--mood:${colour[c.mood] ?? '#ccc'}">${esc(c.mood)}</span>
        <span class="hist-date">${new Date(c.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
        <span class="hist-text">${esc(c.day || '')}${c.thanks ? ` <em>Waardering: ${esc(c.thanks)}</em>` : ''}</span>
      </div>`).join('');
  }
}
