import Phaser from 'phaser';
import { INTERACT_RANGE } from '../config';
import { sprites } from '../assets';
import { Player } from '../entities/Player';
import { Dialog } from '../ui/dialog';
import { Fishing } from '../ui/fishing';
import type { Look } from '../characters/look';

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
  protected dialog = new Dialog();
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
    kb.on('keydown-M', () => this.openMap());
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

  /** Opens the world map on top of this place. */
  openMap() {
    if (!this.registry.get('started') || this.dialog.isOpen || this.travelling) return;
    this.player.halt();
    this.scene.pause();
    this.scene.launch('worldmap', { from: this.scene.key });
  }

  /** Travel from outside (the world map uses this). */
  goTo(scene: string, arrive: Arrival) {
    this.travel(scene, arrive);
  }

  // ---------- helpers for building ----------

  /** An invisible wall. x, y, w, h in pixels (top-left). */
  protected solid(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
    return z;
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
  protected say(who: string, lines: string[], then?: () => void) {
    this.player.halt();
    this.dialog.open(who, lines, then);
  }

  /** Fades out and opens another place. */
  protected travel(scene: string, arrive: Arrival) {
    if (this.travelling) return;
    this.travelling = true;
    this.player.halt();
    this.cameras.main.fadeOut(260, 20, 14, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, { arrive }));
  }

  /** A family member visiting: wanders between a few spots and stops to talk when you press E. */
  /**
   * `look` is either a character look (painted from LPC layers) or a ready-made sprite key whose
   * animations are `<key>-walk-<dir>` and `<key>-idle-<dir>` (like Buurman Mol).
   */
  protected addVisitor(name: string, look: Look | { sprite: string; feet: number }, spots: Array<{ x: number; y: number }>, talk: () => string[], pace = 16) {
    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    const it = { id: name, at: { x: -999, y: -999 }, who: name, lines: [] as string[], action: () => {} };
    this.interactables.push(it);
    const ready = 'sprite' in look ? Promise.resolve(look.sprite) : install(look);
    ready.then((key) => {
      if (!this.sys.isActive()) return;
      const npc = 'sprite' in look
        ? this.add.sprite(spots[0].x, spots[0].y, key, 0).setOrigin(0.5, look.feet).play(`${key}-idle-down`)
        : this.add.sprite(spots[0].x, spots[0].y, `${key}-idle`, 6).setOrigin(0.5, 61 / 64).play(`${key}-idle-down`);
      this.add.image(0, 0, 'shadow').setOrigin(0.5, 0.6).setName(`${name}-shadow`);
      const shadow = this.children.getByName(`${name}-shadow`) as Phaser.GameObjects.Image;
      let talking = false;
      const dirTo = (dx: number, dy: number) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
      const walk = () => {
        if (talking || !this.sys.isActive()) return;
        const to = Phaser.Math.RND.pick(spots);
        const dx = to.x - npc.x, dy = to.y - npc.y;
        npc.play(`${key}-walk-${dirTo(dx, dy)}`);
        this.tweens.add({
          targets: npc, x: to.x, y: to.y, duration: Math.max(200, Math.hypot(dx, dy) * pace),
          onComplete: () => { npc.play(`${key}-idle-down`); this.time.delayedCall(Phaser.Math.Between(2500, 7000), walk); },
        });
      };
      it.action = () => {
        talking = true;
        this.tweens.killTweensOf(npc);
        npc.play(`${key}-idle-${dirTo(this.player.x - npc.x, this.player.y - npc.y)}`);
        this.say(name, talk());
        this.time.delayedCall(6000, () => { talking = false; walk(); });
      };
      this.time.delayedCall(Phaser.Math.Between(1000, 3000), walk);
      this.events.on('update', () => {
        npc.setDepth(npc.y);
        shadow.setPosition(Math.round(npc.x), Math.round(npc.y)).setDepth(npc.y - 1);
        it.at.x = npc.x; it.at.y = npc.y - 6;
      });
    });
  }

  /** Someone who stays in one spot (like a shopkeeper). Resolves with the sprite once their look is painted. */
  protected addNPC(look: Look, x: number, y: number, facing: 'up' | 'down' | 'left' | 'right' = 'down') {
    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    return install(look).then((key) => {
      const npc = this.add.sprite(x, y, `${key}-idle`, 6).setOrigin(0.5, 61 / 64).play(`${key}-idle-${facing}`).setDepth(y);
      this.add.image(x, y, 'shadow').setOrigin(0.5, 0.6).setDepth(y - 1);
      return npc;
    });
  }

  /** A big title across the screen for a moment (chapter done, quest done). */
  protected banner(title: string, sub: string, colour = '#ffe27a') {
    const cam = this.cameras.main;
    const font = '"Pixelify Sans", "Courier New", monospace';
    const t = this.add.text(cam.width / 2, 70, title, { fontFamily: font, fontSize: '20px', color: colour, align: 'center', stroke: '#1a1018', strokeThickness: 5 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200000).setResolution(2).setAlpha(0);
    const t2 = this.add.text(cam.width / 2, 70 + t.height / 2 + 16, sub, { fontFamily: font, fontSize: '12px', color: '#f4ecd8', align: 'center', stroke: '#1a1018', strokeThickness: 4 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(200000).setResolution(2).setAlpha(0);
    this.tweens.add({ targets: [t, t2], alpha: 1, duration: 800, hold: 4500, yoyo: true, onComplete: () => { t.destroy(); t2.destroy(); } });
  }

  /** A twinkle that says "something here". Returns a function that removes it. */
  protected sparkle(x: number, y: number) {
    const s = this.add.image(x, y, 'glow').setScale(0.28).setTint(0xfff2a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 2);
    const d = this.add.image(x, y - 2, 'dot').setScale(2).setDepth(y + 3);
    const tw = this.tweens.add({ targets: [s, d], alpha: { from: 0.25, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
    return () => { tw.remove(); s.destroy(); d.destroy(); };
  }

  /** Keeps an interactable on top of a moving sprite. */
  protected follow(sprite: Phaser.GameObjects.Sprite, it: { id: string; who: string; lines: string[]; action: () => void }) {
    const entry = { ...it, at: { x: sprite.x, y: sprite.y } };
    this.interactables.push(entry);
    this.events.on('update', () => { entry.at.x = sprite.x; entry.at.y = sprite.y - 4; });
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
