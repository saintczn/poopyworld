/**
 * Build & Decorate for a room: drag furniture with the mouse (snapped to a grid),
 * turn it, put it away, add new pieces, undo. The layout is saved in this browser.
 */
import Phaser from 'phaser';
import { sprites } from '../assets';
import { FURNITURE, FURNITURE_BY_KEY, type PlacedItem } from '../content/furniture';

const GRID = 8;
type Rect = { x: number; y: number; w: number; h: number };
type Live = { item: PlacedItem; img: Phaser.GameObjects.Image; zone?: Phaser.GameObjects.Zone };
type SolidFn = (x: number, y: number, w: number, h: number) => Phaser.GameObjects.Zone;

const $ = (id: string) => document.getElementById(id)!;

export class Decorator {
  private live: Live[] = [];
  private selected: Live | null = null;
  private undoStack: string[] = [];
  private active = false;
  private gridGfx: Phaser.GameObjects.Graphics;
  private nextId = 1;

  constructor(
    private scene: Phaser.Scene,
    private room: Rect,
    private storageKey: string,
    defaults: PlacedItem[],
    private makeSolid: SolidFn,
    private onChange: (items: PlacedItem[]) => void,
  ) {
    let items = defaults;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) items = JSON.parse(saved);
    } catch { /* use defaults */ }
    this.nextId = Math.max(0, ...items.map((i) => i.id)) + 1;
    for (const it of items) this.spawn({ ...it });
    this.gridGfx = scene.add.graphics().setDepth(4000).setVisible(false);
    this.drawGrid();
    this.wireInput();
    this.buildCatalog();
    this.onChange(this.items());
  }

  get isActive() { return this.active; }
  items(): PlacedItem[] { return this.live.map((l) => ({ ...l.item })); }

  toggle() {
    this.active = !this.active;
    this.gridGfx.setVisible(this.active);
    $('build-bar').hidden = !this.active;
    if (!this.active) this.select(null);
    for (const l of this.live) l.img.input!.enabled = this.active;
  }

  // ---------- items ----------

  private spawn(item: PlacedItem) {
    const def = FURNITURE_BY_KEY[item.key];
    const sp = sprites[item.key];
    if (!def || !sp) return null;
    const img = this.scene.add.image(item.x, item.y, sp[0], item.key).setOrigin(0.5, 1).setFlipX(item.flip);
    img.setInteractive({ useHandCursor: true, draggable: true });
    img.input!.enabled = this.active;
    const l: Live = { item, img };
    this.live.push(l);
    this.refresh(l);
    return l;
  }

  private refresh(l: Live) {
    const def = FURNITURE_BY_KEY[l.item.key];
    l.img.setPosition(l.item.x, l.item.y).setFlipX(l.item.flip);
    l.img.setDepth(def.floor ? -500 + l.item.y / 1000 : l.item.z ?? l.item.y);
    if (def.solid) {
      const [w, h] = def.solid;
      if (!l.zone) l.zone = this.makeSolid(l.item.x - w / 2, l.item.y - h, w, h);
      l.zone.setPosition(l.item.x, l.item.y - h / 2);
      (l.zone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
  }

  private remove(l: Live) {
    l.img.destroy();
    l.zone?.destroy();
    this.live = this.live.filter((x) => x !== l);
  }

  private select(l: Live | null) {
    if (this.selected) this.selected.img.clearTint();
    this.selected = l;
    if (l) l.img.setTint(0xffc966);
    const has = !!l;
    for (const id of ['build-turn', 'build-remove']) ($(id) as HTMLButtonElement).disabled = !has;
    $('build-selected').textContent = l ? FURNITURE_BY_KEY[l.item.key].name : 'Klik op een meubel om het te verplaatsen';
  }

  private snapshot() {
    this.undoStack.push(JSON.stringify(this.items()));
    if (this.undoStack.length > 20) this.undoStack.shift();
  }

  private commit() {
    const items = this.items();
    try { localStorage.setItem(this.storageKey, JSON.stringify(items)); } catch { /* fine */ }
    this.onChange(items);
  }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    for (const l of [...this.live]) this.remove(l);
    for (const it of JSON.parse(prev) as PlacedItem[]) this.spawn(it);
    for (const l of this.live) l.img.input!.enabled = this.active;
    this.select(null);
    this.commit();
  }

  turn() {
    const l = this.selected;
    if (!l) return;
    this.snapshot();
    const def = FURNITURE_BY_KEY[l.item.key];
    if (def.turnsInto) {
      const item = { ...l.item, key: def.turnsInto };
      this.remove(l);
      const n = this.spawn(item);
      if (n) { n.img.input!.enabled = true; this.select(n); }
    } else {
      l.item.flip = !l.item.flip;
      this.refresh(l);
    }
    this.commit();
  }

  removeSelected() {
    if (!this.selected) return;
    this.snapshot();
    this.remove(this.selected);
    this.select(null);
    this.commit();
  }

  add(key: string) {
    this.snapshot();
    const l = this.spawn({ id: this.nextId++, key, x: this.room.x + this.room.w / 2, y: this.room.y + this.room.h / 2 + 24, flip: false });
    if (l) { l.img.input!.enabled = true; this.select(l); }
    this.commit();
  }

  // ---------- input ----------

  private clamp(l: Live, x: number, y: number) {
    const halfW = l.img.displayWidth / 2;
    const r = this.room;
    const sx = Math.round(x / GRID) * GRID, sy = Math.round(y / GRID) * GRID;
    return {
      x: Phaser.Math.Clamp(sx, r.x + Math.min(halfW, r.w / 2), r.x + r.w - Math.min(halfW, r.w / 2)),
      y: Phaser.Math.Clamp(sy, r.y + 24, r.y + r.h),
    };
  }

  private wireInput() {
    const s = this.scene;
    s.input.on('gameobjectdown', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if (!this.active) return;
      const l = this.live.find((x) => x.img === obj);
      if (l) this.select(l);
    });
    s.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.active) return;
      const l = this.live.find((x) => x.img === obj);
      if (l) { this.snapshot(); this.select(l); }
    });
    s.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
      const l = this.live.find((x) => x.img === obj);
      if (!l || !this.active) return;
      const p = this.clamp(l, dx, dy);
      l.item.x = p.x; l.item.y = p.y; delete l.item.z;
      this.refresh(l);
    });
    s.input.on('dragend', () => { if (this.active) this.commit(); });
    s.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.active && over.length === 0) this.select(null);
    });

    const kb = s.input.keyboard!;
    kb.on('keydown-R', () => { if (this.active) this.turn(); });
    kb.on('keydown-DELETE', () => { if (this.active) this.removeSelected(); });
    kb.on('keydown-BACKSPACE', () => { if (this.active) this.removeSelected(); });
    kb.on('keydown-Z', (e: KeyboardEvent) => { if (this.active && (e.ctrlKey || e.metaKey)) this.undo(); });
  }

  private drawGrid() {
    const g = this.gridGfx, r = this.room;
    g.lineStyle(1, 0xffffff, 0.12);
    for (let x = r.x; x <= r.x + r.w; x += 32) g.lineBetween(x, r.y, x, r.y + r.h);
    for (let y = r.y; y <= r.y + r.h; y += 32) g.lineBetween(r.x, y, r.x + r.w, y);
  }

  /** The HTML bar: catalogue buttons and actions. Rebuilt each time, since scenes restart. */
  private buildCatalog() {
    const cat = $('build-catalog');
    cat.innerHTML = '';
    for (const f of FURNITURE) {
      if (f.key === 'sofa-front') continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat-item';
      b.textContent = f.name;
      b.addEventListener('click', () => this.add(f.key));
      cat.appendChild(b);
    }
    const on = (id: string, fn: () => void) => { const el = $(id); const c = el.cloneNode(true); el.replaceWith(c); c.addEventListener('click', fn); };
    on('build-turn', () => this.turn());
    on('build-remove', () => this.removeSelected());
    on('build-undo', () => this.undo());
    on('build-done', () => this.toggle());
    this.select(null);
  }
}
