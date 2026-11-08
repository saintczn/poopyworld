import Phaser from 'phaser';
import { TILE as T } from '../config';
import type { Arrival } from './WorldScene';

const FONT = '"Pixelify Sans", "Courier New", monospace';

/** A little plane flying across the world map, between home and Bali. */
export class FlightScene extends Phaser.Scene {
  constructor() {
    super('flight');
  }

  create() {
    type Isle = 'home' | 'bali' | 'brasil';
    const to = (this.registry.get('flightTo') as Isle) ?? 'bali';
    const from = (this.registry.get('flightFrom') as Isle | null) ?? (to === 'home' ? 'bali' : 'home');
    this.registry.set('flightFrom', null);
    const custom = this.registry.get('flightArrive') as { scene: string; arrive: Arrival } | null;
    this.registry.set('flightArrive', null);

    const hud = document.getElementById('hud');
    if (hud) { hud.style.visibility = 'hidden'; this.events.once('shutdown', () => { hud.style.visibility = ''; }); }
    this.add.image(0, 0, 'worldmap').setOrigin(0).setScale(2);
    const at: Record<Isle, Phaser.Math.Vector2> = {
      home: new Phaser.Math.Vector2(300, 240), bali: new Phaser.Math.Vector2(500, 256), brasil: new Phaser.Math.Vector2(500, 112),
    };
    const a = at[from], b = at[to];
    const back = b.x < a.x;
    const curve = new Phaser.Curves.QuadraticBezier(a, new Phaser.Math.Vector2((a.x + b.x) / 2, Math.min(a.y, b.y) - 90), b);

    const trail = this.add.graphics();
    const plane = this.add.image(a.x, a.y, 'plane').setScale(2).setFlipX(back);
    const shadow = this.add.image(a.x, a.y + 26, 'plane').setScale(1.6).setTint(0x1a3a48).setAlpha(0.2).setFlipX(back);
    const text = this.add.text(320, 34, to === 'bali' ? 'Op weg naar Bali...' : to === 'brasil' ? 'Op weg naar Brazilië...' : 'Op weg naar huis...', {
      fontFamily: FONT, fontSize: '18px', color: '#fff6dc', stroke: '#3a2412', strokeThickness: 5,
    }).setOrigin(0.5).setResolution(2);
    this.add.text(320, 58, to === 'bali' ? 'Een kleine 16 uur vliegen. Hier gaat het iets sneller.' : to === 'brasil' ? 'Rio de Janeiro, here we come. Gilly heeft al drie keer gebeld.' : 'Nog even slapen in het vliegtuig.', {
      fontFamily: FONT, fontSize: '11px', color: '#fff6dc', stroke: '#3a2412', strokeThickness: 3,
    }).setOrigin(0.5).setResolution(2);
    this.tweens.add({ targets: text, scale: 1.05, duration: 600, yoyo: true, repeat: -1 });

    this.cameras.main.fadeIn(300);
    const state = { t: 0 };
    let last = a.clone();
    this.tweens.add({
      targets: state, t: 1, duration: 3200, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const p = curve.getPoint(state.t);
        trail.fillStyle(0xffffff, 0.9).fillRect(Math.round(p.x), Math.round(p.y) + 2, 2, 2);
        plane.setPosition(p.x, p.y).setRotation(Phaser.Math.Angle.Between(last.x, last.y, p.x, p.y) + (back ? Math.PI : 0));
        shadow.setPosition(p.x + 6, p.y + 26 - Math.sin(state.t * Math.PI) * 10);
        last = p.clone();
      },
      onComplete: () => {
        this.cameras.main.fadeOut(400, 20, 14, 10);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (custom) this.scene.start(custom.scene, { arrive: custom.arrive });
          else if (to === 'bali') this.scene.start('bali', { arrive: { x: 3.9 * T, y: 15.3 * T, facing: 'right' } });
          else if (to === 'brasil') this.scene.start('brasil', { arrive: { x: 3.6 * T, y: 11.8 * T, facing: 'right' } });
          else this.scene.start('village', { arrive: { x: 28.6 * T, y: 25.0 * T, facing: 'down' } });
        });
      },
    });
  }
}
