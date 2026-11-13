/**
 * A hooded member of the Lantaarnkring walking a route with a lantern.
 * If you step into the cone of light (and no wall is in between), onCaught is called.
 */
import Phaser from 'phaser';

export type Waypoint = { x: number; y: number; wait?: number };

export class Patrol {
  sprite: Phaser.GameObjects.Sprite;
  private cone: Phaser.GameObjects.Graphics;
  private step = 1;
  private wait = 0;
  private dir = { x: 1, y: 0 };
  private angle = 0;
  grace = 0;

  constructor(
    private scene: Phaser.Scene,
    private route: Waypoint[],
    private opts: { speed?: number; len?: number; half?: number; blocked?: (x: number, y: number) => boolean } = {},
  ) {
    const s = route[0];
    this.sprite = scene.add.sprite(s.x, s.y, 'hooded', 0).setOrigin(0.5, 46 / 48).play('hooded-idle-down');
    this.cone = scene.add.graphics().setDepth(95003).setBlendMode(Phaser.BlendModes.ADD);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  private get len() { return this.opts.len ?? 120; }
  private get half() { return this.opts.half ?? 0.48; }

  /** Moves along the route; returns true if the player is seen. */
  update(dt: number, px: number, py: number): boolean {
    const g = this.sprite;
    const t = this.route[this.step];
    const dx = t.x - g.x, dy = t.y - g.y, d = Math.hypot(dx, dy);
    if (this.wait > 0) {
      this.wait -= dt;
      this.angle = Math.atan2(this.dir.y, this.dir.x) + Math.sin(this.scene.time.now / 650) * 0.7;
      g.play(`hooded-idle-${this.dirName(Math.cos(this.angle), Math.sin(this.angle))}`, true);
    } else if (d < 2) {
      if (t.wait) this.wait = t.wait;
      this.step = (this.step + 1) % this.route.length;
    } else {
      const sp = (this.opts.speed ?? 50) * dt;
      g.x += dx / d * Math.min(sp, d); g.y += dy / d * Math.min(sp, d);
      this.dir = { x: dx / d, y: dy / d };
      this.angle = Math.atan2(dy, dx);
      g.play(`hooded-walk-${this.dirName(dx, dy)}`, true);
    }
    g.setDepth(g.y);
    this.drawCone();
    if (this.grace > 0) { this.grace -= dt; return false; }
    const ox = g.x, oy = g.y - 22;
    const vx = px - ox, vy = py - oy, dist = Math.hypot(vx, vy);
    if (dist > this.len) return false;
    if (dist > 30 && Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(vy, vx) - this.angle)) > this.half) return false;
    // walls block the view
    if (this.opts.blocked) {
      for (let k = 0.1; k < 1; k += 0.1) if (this.opts.blocked(ox + vx * k, oy + vy * k)) return false;
    }
    return true;
  }

  private drawCone() {
    const c = this.cone, x = this.sprite.x, y = this.sprite.y - 22, a = this.angle;
    c.clear();
    c.fillStyle(0xffd27a, 0.2);
    c.beginPath(); c.moveTo(x, y);
    for (let k = -1; k <= 1.001; k += 0.2) {
      // shorten each ray at the first wall
      let r = this.len;
      if (this.opts.blocked) {
        for (let s = 8; s < this.len; s += 8) if (this.opts.blocked(x + Math.cos(a + k * this.half) * s, y + Math.sin(a + k * this.half) * s)) { r = s; break; }
      }
      c.lineTo(x + Math.cos(a + k * this.half) * r, y + Math.sin(a + k * this.half) * r);
    }
    c.closePath(); c.fillPath();
    c.fillStyle(0xffe8a0, 0.45); c.fillCircle(x + (this.dir.x < 0 ? -12 : 12), y + 8, 5);
  }

  private dirName(x: number, y: number) {
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
  }
}
