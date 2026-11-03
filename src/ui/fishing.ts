/**
 * Fishing mini-game: wait for a bite, then stop the moving marker inside the green zone.
 * A reaction game (no memory needed). Plain HTML on top of the game.
 */
import { rollFish, saveCatch, POND_FISH, type Fish } from '../content/fish';

const $ = (id: string) => document.getElementById(id)!;

export class Fishing {
  private root = $('fishing');
  private msg = $('fish-msg');
  private bar = $('fish-bar');
  private zone = $('fish-zone');
  private marker = $('fish-marker');
  private state: 'idle' | 'waiting' | 'bite' | 'reel' | 'done' = 'idle';
  private pos = 0;
  private dir = 1;
  private speed = 0.9;
  private zoneAt = 0.4;
  private zoneW = 0.2;
  private raf = 0;
  private timer = 0;
  private onClose: () => void = () => {};

  get isOpen() { return !this.root.hidden; }

  open(onClose: () => void) {
    this.onClose = onClose;
    this.root.hidden = false;
    this.bar.hidden = true;
    this.state = 'waiting';
    this.msg.textContent = 'Je gooit je lijn uit... wachten op beet.';
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.bite(), 1200 + Math.random() * 2600);
  }

  private bite() {
    if (this.state !== 'waiting') return;
    this.state = 'reel';
    this.msg.textContent = 'BEET! Druk op E als het streepje in het groen is!';
    this.zoneW = 0.12 + Math.random() * 0.12;
    this.zoneAt = 0.1 + Math.random() * (0.8 - this.zoneW);
    this.speed = 0.8 + Math.random() * 0.7;
    this.zone.style.left = `${this.zoneAt * 100}%`;
    this.zone.style.width = `${this.zoneW * 100}%`;
    this.bar.hidden = false;
    this.pos = 0; this.dir = 1;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000; last = t;
      this.pos += this.dir * this.speed * dt;
      if (this.pos > 1) { this.pos = 1; this.dir = -1; }
      if (this.pos < 0) { this.pos = 0; this.dir = 1; }
      this.marker.style.left = `${this.pos * 100}%`;
      if (this.state === 'reel') this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Called when E / space / enter is pressed while fishing. */
  press() {
    if (this.state === 'waiting') {
      window.clearTimeout(this.timer);
      this.finish('Te vroeg! De vissen schrokken weg.');
    } else if (this.state === 'reel') {
      cancelAnimationFrame(this.raf);
      const hit = this.pos >= this.zoneAt && this.pos <= this.zoneAt + this.zoneW;
      if (hit) {
        const fish: Fish = rollFish();
        const all = saveCatch(fish.name);
        const kinds = Object.keys(all).length;
        this.finish(`Gevangen: ${fish.name}! ${fish.text} (${kinds} van ${POND_FISH.length} soorten gevonden)`);
      } else {
        this.finish('Net mis! Hij zwom weg.');
      }
    } else if (this.state === 'done') {
      this.close();
    }
  }

  private finish(text: string) {
    this.state = 'done';
    this.msg.textContent = `${text}  Druk op E om verder te gaan.`;
  }

  close() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.timer);
    this.state = 'idle';
    this.root.hidden = true;
    this.onClose();
  }
}
