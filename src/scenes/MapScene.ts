import Phaser from 'phaser';
import { PLACES, placeOf, currentGoal, type Place } from '../content/places';
import type { WorldScene } from './WorldScene';

const FONT = '"Pixelify Sans", "Courier New", monospace';

/**
 * The world map (M): where you are, where to go next, and quick travel to places you know.
 * It opens on top of the place you are in, which waits paused underneath.
 */
export class MapScene extends Phaser.Scene {
  private from = '';
  private selected = 0;
  private pins: Array<{ place: Place; ring: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }> = [];
  private info!: Phaser.GameObjects.Text;

  constructor() {
    super('worldmap');
  }

  create(data: { from: string }) {
    this.from = data.from;
    this.pins = [];
    const hud = document.getElementById('hud');
    if (hud) { hud.style.visibility = 'hidden'; this.events.once('shutdown', () => { hud.style.visibility = ''; }); }
    this.add.image(0, 0, 'worldmap').setOrigin(0).setScale(2);

    const here = placeOf(this.from);
    const goal = currentGoal();
    const title = this.add.text(20, 16, 'Kaart van PoopyWorld', { fontFamily: FONT, fontSize: '16px', color: '#fff6dc', stroke: '#3a2412', strokeThickness: 4 }).setResolution(2);
    title.setDepth(5);
    this.add.text(20, 36, 'Klik op een plek om erheen te reizen  ·  M of Esc: sluiten', { fontFamily: FONT, fontSize: '10px', color: '#fff6dc', stroke: '#3a2412', strokeThickness: 3 }).setResolution(2);

    PLACES.forEach((p, i) => {
      const open = p.unlocked();
      const { x, y } = p.map;
      const ring = this.add.circle(x, y, 7, open ? 0xfff2c8 : 0x8a8a8a).setStrokeStyle(2, 0x3a2412);
      this.add.circle(x, y, 3, open ? (p.id === here ? 0xe8584a : 0x3a2412) : 0x5a5a5a);
      const label = this.add.text(x, y + 11, open ? p.name : '???', {
        fontFamily: FONT, fontSize: '11px', color: open ? '#fff6dc' : '#cfcfcf', stroke: '#3a2412', strokeThickness: 3,
      }).setOrigin(0.5, 0).setResolution(2);
      this.pins.push({ place: p, ring, label });
      if (open) {
        const zone = this.add.zone(x, y + 8, Math.max(40, label.width + 8), 34).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => this.select(i));
        zone.on('pointerdown', () => this.go(p));
      }
      if (p.id === here) {
        const pulse = this.add.circle(x, y, 8).setStrokeStyle(2, 0xe8584a);
        this.tweens.add({ targets: pulse, scale: 2.4, alpha: 0, duration: 1100, repeat: -1 });
        this.add.text(x, y - 12, 'Jij bent hier', { fontFamily: FONT, fontSize: '10px', color: '#ffd0c8', stroke: '#3a2412', strokeThickness: 3 }).setOrigin(0.5, 1).setResolution(2);
      }
      if (p.id === goal.place && p.id !== here) {
        const star = this.add.text(x, y - 12, '!', { fontFamily: FONT, fontSize: '18px', color: '#ffe27a', stroke: '#3a2412', strokeThickness: 4 }).setOrigin(0.5, 1).setResolution(2);
        this.tweens.add({ targets: star, y: y - 18, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    // bottom bar: the goal, and what's selected
    const bar = this.add.graphics();
    bar.fillStyle(0x2a1a10, 0.88); bar.fillRoundedRect(14, 300, 612, 46, 6);
    bar.lineStyle(2, 0xc9a46a); bar.strokeRoundedRect(14, 300, 612, 46, 6);
    this.add.text(26, 306, `Doel: ${goal.text}`, { fontFamily: FONT, fontSize: '11px', color: '#ffe27a', wordWrap: { width: 590 } }).setResolution(2);
    this.info = this.add.text(26, 326, '', { fontFamily: FONT, fontSize: '10px', color: '#f4ecd8', wordWrap: { width: 590 } }).setResolution(2);

    this.selected = Math.max(0, PLACES.findIndex((p) => p.id === here));
    this.select(this.selected);

    const kb = this.input.keyboard!;
    kb.on('keydown-M', () => this.close());
    kb.on('keydown-ESC', () => this.close());
    const step = (d: number) => {
      let i = this.selected;
      do { i = (i + d + PLACES.length) % PLACES.length; } while (!PLACES[i].unlocked());
      this.select(i);
    };
    kb.on('keydown-RIGHT', () => step(1)); kb.on('keydown-D', () => step(1));
    kb.on('keydown-LEFT', () => step(-1)); kb.on('keydown-A', () => step(-1));
    kb.on('keydown-ENTER', () => this.go(PLACES[this.selected]));
    kb.on('keydown-E', () => this.go(PLACES[this.selected]));
    kb.on('keydown-SPACE', () => this.go(PLACES[this.selected]));
  }

  private select(i: number) {
    this.selected = i;
    this.pins.forEach((pin, j) => pin.ring.setFillStyle(j === i ? 0xffe27a : pin.place.unlocked() ? 0xfff2c8 : 0x8a8a8a));
    const p = PLACES[i];
    const here = placeOf(this.from) === p.id;
    this.info.setText(`${p.name}: ${p.blurb}${here ? '  (hier ben je nu)' : '  Enter of klik: reizen'}`);
  }

  private go(p: Place) {
    if (!p.unlocked()) return;
    const fromPlace = PLACES.find((q) => q.id === placeOf(this.from))!;
    const world = this.scene.get(this.from) as WorldScene;
    this.close();
    if (fromPlace.id === p.id) return;
    if (fromPlace.island !== p.island) {
      // across the sea you fly
      this.registry.set('flightTo', p.island === 'bali' ? 'bali' : 'home');
      this.registry.set('flightArrive', p.island === 'bali' ? null : { scene: p.scene, arrive: p.arrive });
      world.goTo('flight', { x: 0, y: 0 });
    } else {
      world.goTo(p.scene, p.arrive);
    }
  }

  private close() {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
