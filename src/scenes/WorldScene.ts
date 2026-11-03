import Phaser from 'phaser';
import { INTERACT_RANGE } from '../config';
import { sprites } from '../assets';
import { Player } from '../entities/Player';
import { Dialog } from '../ui/dialog';
import { Fishing } from '../ui/fishing';

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;

/** Something you can look at or use. `at` is in pixels (where you stand / look). */
export type Interactable = {
  id: string;
  at: { x: number; y: number };
  who: string;
  lines: string[];
  /** Instead of (or after) the text, do something, like entering a building. */
  action?: () => void;
};

export type Arrival = { x: number; y: number; facing?: 'up' | 'down' | 'left' | 'right' };

/**
 * Everything a walkable place shares: the player, walls, the E-to-look system,
 * keyboard input, the camera and moving between places with a fade.
 */
export abstract class WorldScene extends Phaser.Scene {
  protected player!: Player;
  protected solids!: Phaser.Physics.Arcade.StaticGroup;
  protected interactables: Interactable[] = [];
  private keys!: Keys;
  private hint!: Phaser.GameObjects.Image;
  private dialog = new Dialog();
  private nearby: Interactable | null = null;
  private interactPressed = false;
  private escapePressed = false;
  private travelling = false;

  /** Build the place; return where the player starts if no arrival point was given. */
  protected abstract build(): Arrival;
  protected tick(_time: number) {}

  create(data: { arrive?: Arrival }) {
    this.travelling = false;
    this.interactables = [];
    this.solids = this.physics.add.staticGroup();
    const start = this.build();
    const arrive = data?.arrive ?? start;

    this.player = new Player(this, arrive.x, arrive.y, this.registry.get('lookKey'));
    if (arrive.facing) this.player.face(arrive.facing);
    this.physics.add.collider(this.player, this.solids);

    this.hint = this.add.image(0, 0, 'key-e').setOrigin(0.5, 1).setDepth(100000).setVisible(false);

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.14, 0.14);
    cam.setRoundPixels(true);
    cam.fadeIn(280, 20, 14, 10);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Keys;
    const kb = this.input.keyboard!;
    const press = () => {
      if (this.fishing.isOpen) { this.fishing.press(); return; }
      this.interactPressed = true;
    };
    kb.on('keydown-E', press);
    kb.on('keydown-SPACE', press);
    kb.on('keydown-ENTER', press);
    kb.on('keydown-ESC', () => { if (this.fishing.isOpen) this.fishing.close(); else this.escapePressed = true; });
    // Sticker emotes on keys 1-6.
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.showSticker(i)));
    kb.on('keydown-H', () => {
      if (this.registry.get('started') && !this.dialog.isOpen) { this.player.halt(); this.game.events.emit('open-hub'); }
    });
    kb.on('keydown-C', () => {
      if (this.registry.get('started') && !this.dialog.isOpen) { this.player.halt(); this.game.events.emit('open-creator'); }
    });

    const onLook = (_p: unknown, key: string) => this.player.setLook(key);
    this.registry.events.on('changedata-lookKey', onLook);
    this.events.once('shutdown', () => this.registry.events.off('changedata-lookKey', onLook));

    // Debug helper for screenshots: ?at=x,y puts the player there.
    const at = new URLSearchParams(location.search).get('at');
    if (at && !data?.arrive) {
      const [x, y] = at.split(',').map(Number);
      this.player.setPosition(x, y);
      cam.centerOn(x, y);
    }
  }

  // ---------- helpers for building ----------

  /** An invisible wall. x, y, w, h in pixels (top-left). */
  protected solid(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
  }

  /** A named sprite with its feet at (x, y) pixels, sorted by depth, with an optional solid base. */
  protected place(name: string, x: number, y: number, solid?: [number, number], flip = false) {
    const def = sprites[name];
    const img = def ? this.add.image(x, y, def[0], name) : this.add.image(x, y, name);
    img.setOrigin(0.5, 1).setDepth(y).setFlipX(flip);
    if (solid) this.solid(x - solid[0] / 2, y - solid[1], solid[0], solid[1]);
    return img;
  }

  protected fishing = new Fishing();
  private sticker?: Phaser.GameObjects.Image;

  /** Opens the fishing mini-game; the player stands still until it closes. */
  protected startFishing() {
    this.player.halt();
    this.registry.set('started', false);
    this.fishing.open(() => this.registry.set('started', true));
  }


  /** Pops a sticker above the player's head for a moment. */
  protected showSticker(i: number) {
    if (!this.registry.get('started') || this.dialog.isOpen) return;
    this.sticker?.destroy();
    const s = this.add.image(this.player.x, this.player.y - 56, 'stickers', i).setOrigin(0.5, 1).setDepth(100001).setScale(0.2);
    this.sticker = s;
    this.tweens.add({ targets: s, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: s, alpha: 0, delay: 1800, duration: 300, onComplete: () => s.destroy() });
    const follow = () => { if (s.active) s.setPosition(Math.round(this.player.x), Math.round(this.player.y) - 56); };
    this.events.on('update', follow);
    s.once('destroy', () => this.events.off('update', follow));
  }

  /** Shows a text box. */
  protected say(who: string, lines: string[]) {
    this.player.halt();
    this.dialog.open(who, lines);
  }

  /** Fades out and opens another place. */
  protected travel(scene: string, arrive: Arrival) {
    if (this.travelling) return;
    this.travelling = true;
    this.player.halt();
    this.cameras.main.fadeOut(260, 20, 14, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, { arrive }));
  }

  // ---------- every frame ----------

  update(time: number) {
    this.tick(time);
    if (!this.registry.get('started') || this.travelling) { this.interactPressed = false; this.hint?.setVisible(false); return; }
    const k = this.keys;
    const interact = this.interactPressed;
    const escape = this.escapePressed;
    this.interactPressed = false;
    this.escapePressed = false;

    if (this.dialog.isOpen) {
      this.player.halt();
      this.hint.setVisible(false);
      if (escape) this.dialog.close();
      else if (interact) this.dialog.advance();
      return;
    }

    const dx = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0);
    const dy = (k.UP.isDown || k.W.isDown ? -1 : 0) + (k.DOWN.isDown || k.S.isDown ? 1 : 0);
    this.player.move(dx, dy);

    this.nearby = this.findNearby();
    const bob = Math.sin(time / 180) > 0 ? -1 : 0;
    this.hint
      .setVisible(this.nearby !== null)
      .setPosition(Math.round(this.player.x), Math.round(this.player.y) - 52 + bob);

    if (interact && this.nearby) {
      this.player.halt();
      if (this.nearby.action && this.nearby.lines.length === 0) this.nearby.action();
      else this.dialog.open(this.nearby.who, this.nearby.lines);
    }
  }

  private findNearby(): Interactable | null {
    const look = this.player.lookPoint();
    let best: Interactable | null = null;
    let bestD = INTERACT_RANGE;
    for (const it of this.interactables) {
      const d = Math.min(
        Phaser.Math.Distance.Between(look.x, look.y, it.at.x, it.at.y),
        Phaser.Math.Distance.Between(this.player.x, this.player.y - 4, it.at.x, it.at.y) + 6,
      );
      if (d < bestD) { bestD = d; best = it; }
    }
    return best;
  }
}
