/**
 * A few small pieces drawn in code because the art pack has no version of them
 * (the two flags, the mailbox, Kroki's perch, wooden signs, UI bits).
 * They use dark outlines and 3-step shading to sit next to the LPC art.
 */
import Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;
const OUT = '#2a1a14';

function px(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  const t = scene.textures.createCanvas(key, w, h)!;
  const c = t.getContext();
  c.imageSmoothingEnabled = false;
  draw(c);
  t.refresh();
  return t;
}

/** Outlined, shaded rectangle (light on top-left, dark on bottom-right). */
function box(c: Ctx, x: number, y: number, w: number, h: number, base: string, light: string, dark: string) {
  px(c, x - 1, y - 1, w + 2, h + 2, OUT);
  px(c, x, y, w, h, base);
  px(c, x, y, w, 1, light);
  px(c, x, y, 1, h, light);
  px(c, x, y + h - 1, w, 1, dark);
  px(c, x + w - 1, y, 1, h, dark);
}

function woodPost(c: Ctx, x: number, y: number, h: number) {
  box(c, x, y, 4, h, '#8a5a34', '#b07a48', '#5e3a20');
  px(c, x + 1, y + 3, 1, h - 6, '#6e4628');
}

export function buildHandmade(scene: Phaser.Scene) {
  // ---- flags: 2 frames each, 34 x 64 ----
  const flag = (key: string, paint: (c: Ctx, x: number, y: number, i: number, dy: number) => void) => {
    canvas(scene, key, 68, 64, (c) => {
      for (let f = 0; f < 2; f++) {
        const ox = f * 34;
        // pole
        px(c, ox + 5, 6, 4, 56, OUT);
        px(c, ox + 6, 6, 2, 56, '#b9c0c6');
        px(c, ox + 6, 6, 1, 56, '#e4e8eb');
        px(c, ox + 3, 59, 8, 4, OUT); px(c, ox + 4, 60, 6, 2, '#7d858c');
        // gold ball
        px(c, ox + 4, 1, 6, 6, OUT); px(c, ox + 5, 2, 4, 4, '#e8b84a'); px(c, ox + 5, 2, 2, 2, '#fff0b0');
        // cloth (24 x 16), waving
        const W = 24, H = 16;
        for (let i = 0; i < W; i++) {
          const dy = Math.round(Math.sin((i / W) * Math.PI * 1.6 + f * Math.PI) * 1.5);
          px(c, ox + 9 + i, 8 + dy - 1, 1, H + 2, OUT);
        }
        for (let i = 0; i < W; i++) {
          const dy = Math.round(Math.sin((i / W) * Math.PI * 1.6 + f * Math.PI) * 1.5);
          paint(c, ox + 9 + i, 8 + dy, i, dy);
        }
      }
    });
    const t = scene.textures.get(key);
    t.add(0, 0, 0, 0, 34, 64);
    t.add(1, 0, 34, 0, 34, 64);
  };
  const shade = (base: string, light: string, dark: string, dy: number) => (dy > 0 ? dark : dy < 0 ? light : base);
  flag('flag-ng', (c, x, y, i, dy) => {
    const green = shade('#16894c', '#22a85f', '#0f6b3a', dy);
    const white = shade('#f2f2ee', '#ffffff', '#cfd2cc', dy);
    px(c, x, y, 1, 16, i < 8 || i >= 16 ? green : white);
  });
  flag('flag-nl', (c, x, y, _i, dy) => {
    px(c, x, y, 1, 5, shade('#b5262f', '#cf3a42', '#8c1b23', dy));
    px(c, x, y + 5, 1, 6, shade('#f2f2ee', '#ffffff', '#cfd2cc', dy));
    px(c, x, y + 11, 1, 5, shade('#24508f', '#3466ad', '#1a3a6b', dy));
  });

  // ---- mailbox: 24 x 40 ----
  canvas(scene, 'mailbox', 24, 40, (c) => {
    woodPost(c, 10, 18, 21);
    px(c, 7, 37, 10, 3, OUT); px(c, 8, 37, 8, 2, '#5e3a20');
    // rounded red box
    px(c, 3, 5, 18, 14, OUT); px(c, 4, 3, 16, 2, OUT); px(c, 5, 2, 14, 1, OUT);
    px(c, 4, 5, 16, 13, '#c8433a'); px(c, 5, 3, 14, 2, '#c8433a');
    px(c, 5, 3, 14, 1, '#e8685c'); px(c, 4, 5, 1, 12, '#e8685c');
    px(c, 4, 15, 16, 3, '#8f2a25');
    px(c, 6, 9, 10, 1, '#6e1f1b'); // slot
    // little flag
    px(c, 20, 6, 2, 9, OUT); px(c, 20, 6, 4, 4, OUT); px(c, 21, 7, 2, 2, '#f2c94c');
  });

  // ---- Kroki's perch: 52 x 64 ----
  canvas(scene, 'perch', 52, 64, (c) => {
    // round stone base
    px(c, 12, 56, 28, 7, OUT); px(c, 10, 58, 32, 4, OUT);
    px(c, 13, 57, 26, 5, '#a59a8c'); px(c, 11, 59, 30, 2, '#a59a8c');
    px(c, 13, 57, 26, 1, '#c9bfb0'); px(c, 11, 61, 30, 1, '#7d7468');
    // thick post with grain
    box(c, 23, 16, 6, 41, '#8a5a34', '#b07a48', '#5e3a20');
    px(c, 25, 20, 1, 30, '#6e4628'); px(c, 27, 26, 1, 18, '#a06c3e');
    // main perch bar
    box(c, 5, 14, 42, 5, '#9a6a3c', '#c99858', '#6e4628');
    px(c, 4, 15, 1, 3, OUT); px(c, 47, 15, 1, 3, OUT);
    // lower perch
    box(c, 13, 34, 26, 4, '#9a6a3c', '#c99858', '#6e4628');
    // seed dish (left) and water dish (right) hanging under the bar
    px(c, 8, 19, 1, 4, '#5e3a20'); px(c, 3, 23, 11, 6, OUT); px(c, 4, 23, 9, 5, '#e9e2d2'); px(c, 5, 23, 7, 2, '#e3b54e'); px(c, 6, 23, 2, 1, '#b8862c');
    px(c, 43, 19, 1, 4, '#5e3a20'); px(c, 38, 23, 11, 6, OUT); px(c, 39, 23, 9, 5, '#e9e2d2'); px(c, 40, 23, 7, 2, '#5aa9d6'); px(c, 41, 23, 2, 1, '#9ad3f0');
    // little swing
    px(c, 31, 19, 1, 9, '#5e3a20'); px(c, 37, 19, 1, 9, '#5e3a20');
    box(c, 30, 28, 9, 2, '#c08850', '#e0aa70', '#8a5a34');
    // name plate with a heart
    box(c, 18, 44, 16, 7, '#d8b48a', '#f0d4a8', '#a8845a');
    px(c, 23, 46, 2, 1, '#d8434f'); px(c, 26, 46, 2, 1, '#d8434f'); px(c, 23, 47, 5, 1, '#d8434f'); px(c, 24, 48, 3, 1, '#d8434f'); px(c, 25, 49, 1, 1, '#d8434f');
    // toy: string of beads
    px(c, 12, 3, 1, 11, '#5e3a20');
    for (const [y, col] of [[4, '#f06a8a'], [7, '#f2c94c'], [10, '#5aa9d6']] as const) { px(c, 10, y, 5, 3, OUT); px(c, 11, y, 3, 2, col); }
  });

  // ---- Kroki: small green-and-yellow parakeet, 3 frames of 16 x 18 (sit, blink/tilt, wings up) ----
  canvas(scene, 'kroki', 48, 18, (c) => {
    const G = '#4caf3a', GL = '#82d65c', GD = '#2f7a2a', Y = '#f4d83c', YL = '#fff08a', B = '#e9a23b', K = '#1d1a12';
    for (let f = 0; f < 3; f++) {
      const o = f * 16;
      // tail
      px(c, o + 3, 12, 3, 5, OUT); px(c, o + 4, 12, 2, 5, GD); px(c, o + 4, 16, 1, 2, '#2a5fa8');
      // body
      px(c, o + 4, 6, 9, 9, OUT); px(c, o + 5, 7, 7, 7, G); px(c, o + 5, 7, 3, 2, GL); px(c, o + 6, 12, 5, 2, GD);
      // head (yellow face)
      const hy = f === 1 ? 1 : 0;
      px(c, o + 7, 1 + hy, 7, 7, OUT); px(c, o + 8, 2 + hy, 5, 5, Y); px(c, o + 8, 2 + hy, 3, 1, YL);
      // beak and eye
      px(c, o + 13, 4 + hy, 2, 3, OUT); px(c, o + 13, 4 + hy, 1, 2, B);
      px(c, o + 11, 3 + hy, 1, f === 1 ? 1 : 2, K);
      // wing
      if (f === 2) { px(c, o + 1, 3, 7, 6, OUT); px(c, o + 2, 4, 5, 4, GL); px(c, o + 2, 7, 5, 1, GD); }
      else { px(c, o + 5, 8, 5, 5, GD); px(c, o + 6, 9, 3, 3, G); }
      // feet
      px(c, o + 7, 15, 1, 2, '#c98a5a'); px(c, o + 10, 15, 1, 2, '#c98a5a');
    }
  });
  const kt = scene.textures.get('kroki');
  for (let f = 0; f < 3; f++) kt.add(f, 0, f * 16, 0, 16, 18);
  scene.anims.create({ key: 'kroki-idle', frames: scene.anims.generateFrameNumbers('kroki', { frames: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1] }), frameRate: 4, repeat: -1 });
  scene.anims.create({ key: 'kroki-flap', frames: scene.anims.generateFrameNumbers('kroki', { frames: [2, 0, 2, 0] }), frameRate: 12, repeat: -1 });

  // ---- goats: 3 coats x 2 walk frames, 28 x 24 each, facing right ----
  canvas(scene, 'goat', 168, 24, (c) => {
    const coats = [['#f4f1ea', '#d9d2c4', '#b8ad9a'], ['#b07a4a', '#8a5a34', '#6a4226'], ['#4a4440', '#353030', '#25201e']];
    coats.forEach(([base, mid, dark], ci) => {
      for (let f = 0; f < 2; f++) {
        const o = (ci * 2 + f) * 28;
        // legs (alternate per frame)
        const l = f === 0 ? [6, 10, 16, 20] : [7, 9, 17, 19];
        for (const lx of l) { px(c, o + lx, 17, 2, 6, OUT); px(c, o + lx, 17, 1, 5, mid); }
        // body
        px(c, o + 4, 9, 19, 10, OUT); px(c, o + 5, 10, 17, 8, base); px(c, o + 5, 15, 17, 3, mid); px(c, o + 6, 10, 8, 1, '#ffffff');
        // tail
        px(c, o + 2, 9, 3, 3, OUT); px(c, o + 3, 9, 1, 2, base);
        // neck + head
        px(c, o + 18, 4, 8, 9, OUT); px(c, o + 19, 5, 6, 7, base); px(c, o + 23, 8, 3, 3, mid);
        px(c, o + 22, 6, 1, 1, OUT); // eye
        // horns + ear
        px(c, o + 18, 1, 2, 4, dark); px(c, o + 20, 0, 2, 4, dark); px(c, o + 17, 6, 2, 2, mid);
        // beard
        px(c, o + 24, 12, 1, 3, mid);
      }
    });
  });
  const gt = scene.textures.get('goat');
  for (let i = 0; i < 6; i++) gt.add(i, 0, i * 28, 0, 28, 24);
  for (let ci = 0; ci < 3; ci++) {
    scene.anims.create({ key: `goat-walk-${ci}`, frames: scene.anims.generateFrameNumbers('goat', { frames: [ci * 2, ci * 2 + 1] }), frameRate: 6, repeat: -1 });
    scene.anims.create({ key: `goat-idle-${ci}`, frames: [{ key: 'goat', frame: ci * 2 }], frameRate: 1 });
  }

  // ---- sticker emotes: 6 icons of 20 x 20 in a little speech bubble ----
  // 1 heart, 2 laughing, 3 kiss, 4 middle finger, 5 poop, 6 music
  canvas(scene, 'stickers', 120, 22, (c) => {
    for (let i = 0; i < 6; i++) {
      const o = i * 20;
      // bubble
      px(c, o + 1, 0, 18, 18, OUT); px(c, o + 2, 1, 16, 16, '#fffaf0'); px(c, o + 2, 15, 16, 2, '#efe2c6');
      px(c, o + 8, 18, 4, 1, OUT); px(c, o + 9, 19, 2, 1, OUT); px(c, o + 9, 18, 2, 1, '#fffaf0');
      const p = (x: number, y: number, w: number, h: number, col: string) => px(c, o + x, y, w, h, col);
      if (i === 0) { // heart
        const R = '#e8394f', L = '#ff7a8a';
        p(5, 5, 4, 3, R); p(11, 5, 4, 3, R); p(4, 6, 12, 4, R); p(5, 10, 10, 2, R); p(7, 12, 6, 1, R); p(9, 13, 2, 1, R); p(6, 6, 2, 1, L);
      } else if (i === 1) { // laughing face
        const Y = '#f6c83a';
        p(5, 3, 10, 12, Y); p(4, 5, 12, 8, Y); p(6, 6, 3, 1, OUT); p(11, 6, 3, 1, OUT);
        p(6, 9, 8, 3, OUT); p(7, 10, 6, 1, '#e8394f'); p(3, 8, 2, 2, '#7ec8f2'); p(15, 8, 2, 2, '#7ec8f2');
      } else if (i === 2) { // kiss face with heart
        const Y = '#f6c83a';
        p(4, 4, 10, 11, Y); p(3, 6, 12, 7, Y); p(5, 7, 2, 1, OUT); p(9, 6, 2, 2, OUT); p(8, 11, 2, 2, '#e8394f');
        p(13, 3, 2, 2, '#e8394f'); p(16, 3, 2, 2, '#e8394f'); p(13, 4, 5, 2, '#e8394f'); p(14, 6, 3, 1, '#e8394f');
      } else if (i === 3) { // middle finger
        const S = '#f0c49a', D = '#c98f63';
        p(9, 2, 3, 8, S); p(9, 2, 3, 1, D); p(8, 2, 1, 8, OUT); p(12, 2, 1, 8, OUT); p(9, 1, 3, 1, OUT);
        p(5, 9, 10, 6, S); p(4, 9, 1, 6, OUT); p(15, 9, 1, 6, OUT); p(5, 15, 10, 1, OUT); p(5, 8, 3, 1, OUT); p(13, 8, 2, 1, OUT);
        p(5, 11, 3, 1, D); p(12, 11, 3, 1, D); p(7, 14, 6, 1, D);
      } else if (i === 4) { // poop (it is PoopyWorld after all)
        const B = '#8a5a34', L = '#b07a48';
        p(8, 3, 3, 2, B); p(6, 5, 8, 3, B); p(4, 8, 12, 3, B); p(3, 11, 14, 4, B); p(7, 5, 2, 1, L); p(5, 8, 3, 1, L); p(4, 11, 3, 1, L);
        p(7, 12, 2, 2, '#ffffff'); p(11, 12, 2, 2, '#ffffff'); p(8, 13, 1, 1, OUT); p(12, 13, 1, 1, OUT);
      } else { // music note
        const M = '#5a4ad1';
        p(7, 3, 8, 2, M); p(7, 3, 2, 9, M); p(13, 3, 2, 8, M); p(4, 11, 5, 4, M); p(10, 10, 5, 4, M);
      }
    }
  });
  const st = scene.textures.get('stickers');
  for (let i = 0; i < 6; i++) st.add(i, 0, i * 20, 0, 20, 22);

  // ---- wooden sign: 30 x 36 ----
  canvas(scene, 'sign', 30, 36, (c) => {
    woodPost(c, 13, 16, 18);
    box(c, 2, 3, 26, 15, '#a8744a', '#c8945e', '#7a5032');
    px(c, 3, 10, 24, 1, '#8a5a34');
    px(c, 6, 7, 16, 1, '#5e3a20'); px(c, 6, 13, 12, 1, '#5e3a20');
  });

  // ---- "press E" bubble: 15 x 16 ----
  canvas(scene, 'key-e', 15, 16, (c) => {
    px(c, 0, 0, 15, 13, OUT); px(c, 1, 1, 13, 11, '#fff6e4'); px(c, 1, 10, 13, 2, '#e6d8bc');
    px(c, 5, 13, 5, 1, OUT); px(c, 6, 14, 3, 1, OUT); px(c, 7, 15, 1, 1, OUT);
    px(c, 5, 3, 2, 7, OUT); px(c, 5, 3, 6, 2, OUT); px(c, 5, 6, 5, 1, OUT); px(c, 5, 8, 6, 2, OUT);
  });

  // ---- soft shadow under characters: 26 x 8 ----
  canvas(scene, 'shadow', 26, 8, (c) => {
    c.fillStyle = 'rgba(20, 30, 10, 0.28)';
    c.beginPath();
    c.ellipse(13, 4, 12, 3.5, 0, 0, Math.PI * 2);
    c.fill();
  });
}
