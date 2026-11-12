/**
 * "Ons Boek": a scrapbook that fills itself with everything the two of you do in PoopyWorld.
 * It reads the saves of every part of the game, so there is nothing to keep up to date by hand.
 */
import { sheets, sprites } from '../assets';
import { loadMystery } from '../content/mystery';
import { loadBali } from '../content/bali';
import { loadBrasil, PHOTO_KEY } from '../content/brasil';
import { loadParaty, STAMPS } from '../content/paraty';
import { loadPuck, PRIZES, CABINETS } from '../content/puck';
import { loadCatches } from '../content/fish';
import { loadMemories } from './memories';
import { loadFestive } from '../world/festive';
import { daysTogether, loadDates } from '../world/season';

const read = <T,>(k: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fallback; } catch { return fallback; } };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Remembers each day you played. */
export function markPlayedToday() {
  const days = read<string[]>('poopyworld.days.v1', []);
  const d = new Date().toISOString().slice(0, 10);
  if (!days.includes(d)) { days.push(d); localStorage.setItem('poopyworld.days.v1', JSON.stringify(days.slice(-2000))); }
}

/** A pixel-art picture from the game's own art (drawn into a little canvas after the page renders). */
function pic(key: string, scale = 2, frameW = 0) {
  return `<canvas class="pic" data-key="${key}" data-scale="${scale}" data-fw="${frameW}"></canvas>`;
}

function drawPics(root: HTMLElement) {
  root.querySelectorAll<HTMLCanvasElement>('canvas.pic').forEach((cv) => {
    const key = cv.dataset.key!, scale = Number(cv.dataset.scale), fw = Number(cv.dataset.fw);
    const sp = (sprites as Record<string, [string, number, number, number, number]>)[key];
    const url = sp ? (sheets as Record<string, string>)[sp[0]] : (sheets as Record<string, string>)[key];
    if (!url) { cv.remove(); return; }
    const img = new Image();
    img.onload = () => {
      const [x, y, w, h] = sp ? sp.slice(1) as number[] : [0, 0, fw || img.naturalWidth, img.naturalHeight];
      cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
      const c = cv.getContext('2d')!;
      c.imageSmoothingEnabled = false;
      c.drawImage(img, x, y, w, h, 0, 0, cv.width, cv.height);
    };
    img.src = url;
  });
}

function stat(label: string, value: string | number, icon = '') {
  return `<div class="stat">${icon}<div><b>${value}</b><span>${label}</span></div></div>`;
}

type Page = { title: string; html: string };

function pages(name: string): Page[] {
  const m = loadMystery(), b = loadBali(), br = loadBrasil(), pa = loadParaty(), pk = loadPuck(), fs = loadFestive();
  const fish = loadCatches();
  const pet = read<{ name?: string; pets?: number }>('poopyworld.pet.v1', {});
  const checkins = read<unknown[]>('poopyworld.checkins.v1', []);
  const days = read<string[]>('poopyworld.days.v1', []);
  const together = daysTogether();
  const dates = loadDates();
  const surf = read<{ best?: number }>('poopyworld.surf.v1', {});
  const kots = Number(localStorage.getItem('poopyworld.kots.v1') ?? '0');
  const memories = loadMemories();
  const photo = localStorage.getItem(PHOTO_KEY);
  const wish = localStorage.getItem('poopyworld.wish.v1') ?? '';
  const caught = Object.values(fish).reduce((a, n) => a + n, 0);
  const yes = (v: unknown) => (v ? '✓' : '—');

  const out: Page[] = [];
  out.push({
    title: 'Ons Boek',
    html: `<div class="cover">
      <p class="cover-sub">Het verhaal van</p>
      <h2>${esc(name)}</h2>
      <p class="muted">en al jullie avonturen in PoopyWorld</p>
      <div class="stats">
        ${stat('dagen gespeeld', days.length || 1)}
        ${together !== null && together >= 0 ? stat('dagen samen', together) : ''}
        ${stat('check-ins', checkins.length)}
      </div>
      ${dates.together ? '' : '<p class="muted small">Tip: vul in de Hub (H) in sinds wanneer jullie samen zijn.</p>'}
      <p class="muted small">Blader met de pijltjes of de knoppen. Sluiten met J of Esc.</p>
    </div>`,
  });
  out.push({
    title: 'Thuis',
    html: `<div class="stats">
      ${stat(pet.name ? `het schildpadje, ${pet.pets ?? 0} keer geaaid` : 'het schildpadje bij de vijver heeft nog geen naam', pet.name ? esc(pet.name) : '?', pic('bali-prize-turtle', 2))}
      ${stat('vissen gevangen', caught, '')}
      ${stat('soorten vis', Object.keys(fish).length)}
    </div>
    <p>Kroki zit nog altijd op zijn stokje bij de villa en houdt alles in de gaten. Simba duikt in de sneeuwbol de sneeuw in, en Buurman Mol graaft onder het gazon.</p>
    ${(pk.prizes ?? []).length ? `<p><b>In de woonkamer:</b> ${PRIZES.filter((p) => pk.prizes!.includes(p.id)).map((p) => esc(p.name.toLowerCase())).join(', ')}.</p>` : ''}`,
  });
  out.push({
    title: 'Het mysterie van Hollowmere',
    html: `<div class="seals">
      <div class="seal ${m.seal1 ? '' : 'missing'}">${pic('seal-gold', 1)}<span>Wolf</span></div>
      <div class="seal ${m.seal2 ? '' : 'missing'}">${pic('hm-seal-owl', 1.6)}<span>Uil</span></div>
      <div class="seal missing"><span class="q">?</span><span>???</span></div>
      <div class="seal missing"><span class="q">?</span><span>???</span></div>
    </div>
    <div class="stats">
      ${stat('zegels gevonden', `${(m.seal1 ? 1 : 0) + (m.seal2 ? 1 : 0)} / 4`)}
      ${stat('keer betrapt door Grauw', m.caught ?? 0)}
      ${stat('brieven van O. H.', (m.letter ? 1 : 0) + (m.letter2 ? 1 : 0))}
    </div>
    <p class="muted">${m.seal2 ? 'Wordt vervolgd: De Klokkentoren.' : m.seal1 ? 'Er komt nog post...' : m.letter ? 'Het pad naar de heuvel wacht.' : 'Kijk eens in de brievenbus.'}</p>`,
  });
  out.push({
    title: 'Bali',
    html: `<div class="stats">
      ${stat("Bram's geheime recept", yes(b.done))}
      ${stat('babyschildpadjes naar zee', b.turtles ?? 0, pic('bali-turtle-baby', 2, 14))}
      ${stat('kokosnoten gedronken', b.coconuts ?? 0, pic('bali-coconut', 2))}
      ${stat('aap-aanvallen overleefd', b.monkeyAttacks ?? 0, pic('bali-monkey', 1.5, 28))}
      ${stat('surfrecord', surf.best ?? 0)}
      ${stat('bezoeken aan het kotsmonument', kots)}
    </div>
    <h4>Herinneringen van de muur in Casa Umalas</h4>
    ${memories.length ? `<ul class="memories">${memories.map((x) => `<li><b>${esc(x.name)}:</b> "${esc(x.text)}" <span class="muted">${x.date}</span></li>`).join('')}</ul>` : '<p class="muted">Nog leeg. Schrijf er een op de herinneringsmuur in Casa Umalas.</p>'}`,
  });
  out.push({
    title: 'Brazilië',
    html: `${photo ? `<figure class="polaroid"><img src="${photo}" alt="Familiefoto op Copacabana"><figcaption>Familie op Copacabana</figcaption></figure>` : '<p class="muted">Nog geen familiefoto. Gilly wacht op het strand van Copacabana.</p>'}
    <div class="stats">
      ${stat('penalty-wedstrijden gewonnen van Yara', `${br.penaltyWins ?? 0} / ${br.penaltyGames ?? 0}`, pic('br-ball', 2))}
      ${stat('stempels van Paraty', `${pa.stamps.length} / ${STAMPS.length}`)}
    </div>
    <div class="stamps">${STAMPS.map((s) => `<span class="stamp ${pa.stamps.includes(s.id) ? '' : 'missing'}">${s.icon}<small>${s.short}</small></span>`).join('')}</div>`,
  });
  out.push({
    title: 'PUCK',
    html: `<div class="stats">
      ${CABINETS.map((c) => stat(`record ${c.title}`, pk.best[c.game ?? ''] ?? 0)).join('')}
      ${stat('tickets', pk.tickets)}
      ${stat('potjes gespeeld', pk.plays)}
    </div>`,
  });
  out.push({
    title: 'Feestdagen',
    html: `<div class="stats">
      ${stat('chocoladeletters van de Sint', fs.shoeGifts ?? 0, pic('hm-shoe', 1.5))}
      ${stat('pepernoten gevonden', fs.pepernoten ?? 0, pic('hm-pepernoot', 2))}
      ${stat('verjaardagstaarten uitgeblazen', fs.candles ?? 0, pic('hm-cake', 1))}
    </div>
    <p class="muted">${dates.birthdays.length ? `Feestdagen in jullie agenda: ${dates.birthdays.map((x) => `${esc(x.name)} (${x.date.split('-').reverse().join('-')})`).join(', ')}${dates.together ? `, en jullie dag (${dates.together.slice(5).split('-').reverse().join('-')})` : ''}.` : 'Vul in de Hub jullie verjaardagen in: dan viert de hele wereld mee.'}</p>`,
  });
  out.push({
    title: 'Ons volgende avontuur',
    html: `<p>Waar willen jullie hierna samen naartoe, in het echt? Schrijf het op. Het blijft in dit boek staan.</p>
    <textarea id="book-wish" rows="5" maxlength="400" placeholder="Samen naar...">${esc(wish)}</textarea>
    <div class="row"><button class="btn small" type="button" id="book-wish-save">Bewaren</button><span class="note" id="book-wish-note"></span></div>
    <p class="muted">Wordt vervolgd...</p>`,
  });
  return out;
}

export class Book {
  private root: HTMLDivElement;
  private page = 0;
  private list: Page[] = [];
  private onClose: () => void = () => {};
  private openedAt = 0;
  private keyHandler = (e: KeyboardEvent) => {
    // the key press that opened the book must not close it again
    if (!this.isOpen || performance.now() - this.openedAt < 300) return;
    if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') { if (e.key === 'Escape') this.close(); return; }
    if (e.key === 'ArrowRight' || e.key === 'd') this.turn(1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') this.turn(-1);
    else if (e.key === 'Escape' || e.key === 'j' || e.key === 'J') this.close();
  };

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'book';
    this.root.hidden = true;
    document.body.appendChild(this.root);
    window.addEventListener('keydown', this.keyHandler);
  }

  get isOpen() { return !this.root.hidden; }

  open(name: string, onClose: () => void) {
    this.onClose = onClose;
    this.openedAt = performance.now();
    this.list = pages(name);
    this.page = 0;
    this.render();
    this.root.hidden = false;
  }

  close() {
    if (!this.isOpen) return;
    this.root.hidden = true;
    this.onClose();
  }

  private turn(d: number) {
    const step = window.innerWidth >= 900 ? 2 : 1;
    this.page = Math.max(0, Math.min(this.list.length - 1, this.page + d * step));
    if (step === 2) this.page -= this.page % 2;
    this.render();
  }

  private render() {
    const wide = window.innerWidth >= 900;
    const shown = wide ? [this.list[this.page], this.list[this.page + 1]] : [this.list[this.page]];
    const n = this.list.length;
    this.root.innerHTML = `
      <div class="book-wrap">
        <div class="book ${wide ? 'spread' : ''}">
          ${shown.map((p, i) => p ? `<section class="book-page"><h3>${esc(p.title)}</h3>${p.html}<footer>${this.page + i + 1}</footer></section>` : '<section class="book-page empty"></section>').join('')}
        </div>
        <div class="book-nav">
          <button class="btn alt small" type="button" data-turn="-1" ${this.page === 0 ? 'disabled' : ''}>&larr; Vorige</button>
          <span class="muted">${this.page + 1}${wide && this.page + 1 < n ? `-${this.page + 2}` : ''} / ${n}</span>
          <button class="btn alt small" type="button" data-turn="1" ${this.page + (wide ? 2 : 1) >= n ? 'disabled' : ''}>Volgende &rarr;</button>
          <button class="btn small" type="button" data-close>Dicht <kbd>J</kbd></button>
        </div>
      </div>`;
    this.root.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => b.addEventListener('click', () => this.turn(Number(b.dataset.turn))));
    this.root.querySelector('[data-close]')!.addEventListener('click', () => this.close());
    drawPics(this.root);
    const save = this.root.querySelector('#book-wish-save');
    save?.addEventListener('click', () => {
      localStorage.setItem('poopyworld.wish.v1', (this.root.querySelector('#book-wish') as HTMLTextAreaElement).value.trim());
      this.root.querySelector('#book-wish-note')!.textContent = 'Bewaard in het boek.';
    });
  }
}
