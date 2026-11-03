/**
 * The character creator: first the name (with the Poopy Ginger joke), then the look.
 * Plain HTML on top of the game, so text stays sharp and it works on any screen.
 */
import { OPTIONS, COLOUR_NL, DEFAULT_LOOK, paintLook, swatch, type Look } from '../characters/look';
import type { Profile } from '../characters/profile';

const GINGER = 'Poopy Ginger';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

type Done = (p: Profile) => void;

export class Creator {
  private root = $('creator');
  private look: Look = { ...DEFAULT_LOOK };
  private name = '';
  private ginger = false;
  private sheet: HTMLCanvasElement | null = null;
  private dir = 2; // 0 up, 1 left, 2 down, 3 right
  private frame = 0;
  private timer = 0;
  private paintToken = 0;
  private onDone: Done = () => {};

  constructor() {
    $('name-form').addEventListener('submit', (e) => { e.preventDefault(); this.submitName(); });
    $('turn-left').addEventListener('click', () => { this.dir = [1, 2, 3, 0][this.dir]; });
    $('turn-right').addEventListener('click', () => { this.dir = [3, 0, 1, 2][this.dir]; });
    $('look-random').addEventListener('click', () => this.randomise());
    $('look-done').addEventListener('click', () => this.finish());
  }

  /** Opens the creator. With an existing profile it skips straight to the look. */
  open(existing: Profile | null, onDone: Done) {
    this.onDone = onDone;
    this.root.hidden = false;
    this.attempts = 0;
    if (existing) {
      this.name = existing.name;
      this.ginger = !!existing.ginger;
      this.look = { ...existing.look };
      this.showLook();
    } else {
      $('step-name').hidden = false;
      $('step-look').hidden = true;
      const input = $<HTMLInputElement>('name-input');
      input.value = '';
      this.say('Typ je naam en druk op Enter.');
      setTimeout(() => input.focus(), 50);
    }
  }

  // ---------- step 1: the name ----------

  private attempts = 0;

  private say(text: string) {
    const msg = $('name-msg');
    msg.textContent = text;
    msg.classList.remove('shake');
    void msg.offsetWidth;
    msg.classList.add('shake');
  }

  private submitName() {
    const input = $<HTMLInputElement>('name-input');
    const typed = input.value.trim().replace(/\s+/g, ' ');
    if (!typed) { this.say('Je moet wel iets intypen!'); return; }
    const isGinger = typed.toLowerCase() === GINGER.toLowerCase();

    if (isGinger) {
      this.accept(GINGER, true, this.attempts === 0 ? 'Uitstekende keuze. Echt waar.' : 'Wijs besluit. Welkom, Poopy Ginger!');
      return;
    }
    if (this.attempts === 0) {
      this.attempts = 1;
      this.say(`Nee hoor... maar ${GINGER} is nog beschikbaar!`);
      input.value = GINGER;
      input.select();
      return;
    }
    if (this.attempts === 1) {
      this.attempts = 2;
      this.say(`Weet je het zeker? Je wilt echt niet ${GINGER} heten?`);
      input.select();
      return;
    }
    this.accept(typed, false, `Oké, ${typed}. ${GINGER} blijft altijd voor je beschikbaar.`);
  }

  private accept(name: string, ginger: boolean, line: string) {
    this.name = name;
    this.ginger = ginger;
    this.say(line);
    $<HTMLInputElement>('name-input').disabled = true;
    setTimeout(() => {
      $<HTMLInputElement>('name-input').disabled = false;
      this.showLook();
    }, 1900);
  }

  // ---------- step 2: the look ----------

  private showLook() {
    $('step-name').hidden = true;
    $('step-look').hidden = false;
    $('look-title').textContent = `Hoe ziet ${this.name} eruit?`;
    this.buildOptions();
    this.repaint();
    cancelAnimationFrame(this.timer);
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 95) { last = t; this.frame = (this.frame + 1) % 8; this.drawPreview(); }
      this.timer = requestAnimationFrame(tick);
    };
    this.timer = requestAnimationFrame(tick);
  }

  private buildOptions() {
    const box = $('opts');
    box.innerHTML = '';
    const stepper = (label: string, key: keyof Look, list: Array<[string, string]>) => {
      const row = document.createElement('div');
      row.className = 'opt';
      const id = `opt-${key}`;
      row.innerHTML = `<label for="${id}">${label}</label><div class="stepper"><button class="arrow" type="button" aria-label="Vorige">&#9664;</button><span id="${id}" aria-live="polite"></span><button class="arrow" type="button" aria-label="Volgende">&#9654;</button></div>`;
      const [prev, next] = row.querySelectorAll('button');
      const show = () => { row.querySelector('span')!.textContent = list.find(([k]) => k === this.look[key])?.[1] ?? ''; };
      const move = (d: number) => {
        const i = Math.max(0, list.findIndex(([k]) => k === this.look[key]));
        (this.look[key] as string) = list[(i + d + list.length) % list.length][0];
        show(); this.repaint();
      };
      prev.addEventListener('click', () => move(-1));
      next.addEventListener('click', () => move(1));
      show();
      box.appendChild(row);
    };
    const colours = (label: string, key: keyof Look, category: 'hair' | 'skin' | 'eyes' | 'cloth', list: string[]) => {
      const row = document.createElement('div');
      row.className = 'opt';
      row.innerHTML = `<label>${label}</label><div class="swatches" role="group" aria-label="${label}"></div>`;
      const wrap = row.querySelector('.swatches')!;
      for (const name of list) {
        const b = document.createElement('button');
        b.type = 'button';
        b.style.background = swatch(category, name);
        b.title = COLOUR_NL[name] ?? name;
        b.setAttribute('aria-label', COLOUR_NL[name] ?? name);
        b.setAttribute('aria-pressed', String(this.look[key] === name));
        b.addEventListener('click', () => {
          (this.look[key] as string) = name;
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          this.repaint();
        });
        wrap.appendChild(b);
      }
      box.appendChild(row);
    };
    stepper('Lichaam', 'body', OPTIONS.body);
    colours('Huidskleur', 'skin', 'skin', OPTIONS.skin);
    colours('Ogen', 'eyes', 'eyes', OPTIONS.eyes);
    stepper('Kapsel', 'hair', OPTIONS.hair);
    colours('Haarkleur', 'hairColor', 'hair', OPTIONS.hairColor);
    stepper('Baard', 'beard', OPTIONS.beard);
    stepper('Shirt', 'shirt', OPTIONS.shirt);
    colours('Shirtkleur', 'shirtColor', 'cloth', OPTIONS.cloth);
    stepper('Broek', 'legs', OPTIONS.legs);
    colours('Broekkleur', 'legsColor', 'cloth', OPTIONS.cloth);
    stepper('Schoenen', 'shoes', OPTIONS.shoes);
    colours('Schoenkleur', 'shoesColor', 'cloth', OPTIONS.cloth);
  }

  private randomise() {
    const pick = <V>(l: V[]) => l[Math.floor(Math.random() * l.length)];
    const body = pick(OPTIONS.body)[0];
    this.look = {
      body, skin: pick(OPTIONS.skin), eyes: pick(OPTIONS.eyes), hair: pick(OPTIONS.hair)[0], hairColor: pick(OPTIONS.hairColor),
      beard: body === 'm' && Math.random() < 0.4 ? pick(OPTIONS.beard.slice(1))[0] : 'none',
      shirt: pick(OPTIONS.shirt)[0], shirtColor: pick(OPTIONS.cloth), legs: pick(OPTIONS.legs)[0], legsColor: pick(OPTIONS.cloth),
      shoes: pick(OPTIONS.shoes)[0], shoesColor: pick(['Brown', 'Black', 'Leather', 'Tan', 'White', 'Charcoal']),
    };
    this.buildOptions();
    this.repaint();
  }

  private async repaint() {
    const token = ++this.paintToken;
    const sheet = await paintLook(this.look);
    if (token === this.paintToken) { this.sheet = sheet; this.drawPreview(); }
  }

  private drawPreview() {
    const c = $<HTMLCanvasElement>('preview-canvas');
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    if (this.sheet) ctx.drawImage(this.sheet, this.frame * 64, this.dir * 64, 64, 64, 0, 0, 64, 64);
  }

  private finish() {
    cancelAnimationFrame(this.timer);
    this.root.hidden = true;
    this.onDone({ name: this.name, look: { ...this.look }, ginger: this.ginger });
  }
}
