/**
 * Holidays and your own special days, in the world:
 * Sinterklaas (shoe by the fireplace, pepernoten in the village), Christmas (tree, presents, lights on the villa),
 * New Year (fireworks), Valentine (hearts), birthdays (balloons, banner, cake, confetti) and your anniversary.
 */
import Phaser from 'phaser';
import { VIEW_WIDTH as W } from '../config';
import { holidays, birthdaysToday, anniversaryYears, today } from './season';

const FONT = '"Pixelify Sans", "Courier New", monospace';

type Talker = { say: (who: string, lines: string[], then?: () => void) => void; interactables: Array<{ id: string; at: { x: number; y: number }; who: string; lines: string[]; action?: () => void }> };

// ---------------------------------------------------------------- small saves
const K = 'poopyworld.festive.v1';
type FestiveSave = { shoeDate?: string; shoeGifts?: number; pepernoten?: number; pepernotenDay?: string; candles?: number; presentsOpened?: string };
export function loadFestive(): FestiveSave { try { return JSON.parse(localStorage.getItem(K) ?? '{}'); } catch { return {}; } }
function saveFestive(s: FestiveSave) { try { localStorage.setItem(K, JSON.stringify(s)); } catch { /* fine */ } }
const dayKey = (d = today()) => d.toISOString().slice(0, 10);

/** One festive line an NPC adds when you talk to them (or null on a normal day). */
export function festiveGreeting(): string | null {
  const h = holidays();
  if (h.includes('birthday')) return `GEFELICITEERD, ${birthdaysToday().join(' en ').toUpperCase()}! Hiep hiep hoera!`;
  if (h.includes('anniversary')) return `Ik hoorde dat jullie vandaag ${anniversaryYears()} jaar samen zijn! Gefeliciteerd, jullie twee.`;
  if (h.includes('newyear')) return 'Gelukkig nieuwjaar! Al een oliebol gehad?';
  if (h.includes('christmas')) return 'Fijne feestdagen!';
  if (h.includes('valentine')) return 'Fijne Valentijnsdag, jullie twee!';
  if (h.includes('sinterklaas')) return 'Heb jij je schoen al gezet? Sinterklaas is in het land!';
  return null;
}

/** Confetti burst at a screen position. */
export function confetti(scene: Phaser.Scene, x = W / 2, y = 120, n = 60) {
  const cols = [0xe8282a, 0xf5c400, 0x2f8ad0, 0x2f8a4a, 0xff7ae0, 0xffffff];
  for (let i = 0; i < n; i++) {
    const c = scene.add.rectangle(x, y, 3, 2, Phaser.Math.RND.pick(cols)).setScrollFactor(0).setDepth(200500);
    const a = Phaser.Math.FloatBetween(-Math.PI, 0), v = Phaser.Math.Between(80, 220);
    scene.tweens.add({
      targets: c, x: x + Math.cos(a) * v, y: y + Math.sin(a) * v * 0.6 + Phaser.Math.Between(120, 240), angle: Phaser.Math.Between(-360, 360),
      alpha: 0, duration: Phaser.Math.Between(1200, 2200), ease: 'Quad.easeIn', onComplete: () => c.destroy(),
    });
  }
}

/** A banner strung between two poles. */
function banner(scene: Phaser.Scene, x: number, y: number, text: string, colour = 0xe8584a) {
  const t = scene.add.text(x, y, text, { fontFamily: FONT, fontSize: '12px', color: '#ffffff', stroke: '#2a1a14', strokeThickness: 3 }).setOrigin(0.5).setResolution(2).setDepth(y + 400);
  const w = t.width + 24;
  const g = scene.add.graphics().setDepth(y + 399);
  g.lineStyle(1, 0x3a3a3a); g.lineBetween(x - w / 2 - 20, y - 10, x - w / 2, y - 4); g.lineBetween(x + w / 2, y - 4, x + w / 2 + 20, y - 10);
  g.fillStyle(0x2a1a14); g.fillRect(x - w / 2 - 1, y - 11, w + 2, 22);
  g.fillStyle(colour); g.fillRect(x - w / 2, y - 10, w, 20);
  for (let k = -w / 2; k < w / 2; k += 10) { g.fillStyle(0xffffff, 0.25); g.fillTriangle(x + k, y + 10, x + k + 10, y + 10, x + k + 5, y + 16); }
}

/** Twinkling string lights from (x0, y) to (x1, y), sagging a little. */
function stringLights(scene: Phaser.Scene, x0: number, x1: number, y: number) {
  const g = scene.add.graphics().setDepth(y + 300);
  g.lineStyle(1, 0x2a2a2a);
  const pts: Array<{ x: number; y: number }> = [];
  for (let x = x0; x <= x1; x += 12) pts.push({ x, y: y + Math.sin(((x - x0) / 60) * Math.PI) * 5 });
  g.strokePoints(pts);
  const cols = [0xff4040, 0xffd040, 0x40a0ff, 0x60e060];
  pts.forEach((p, i) => {
    const b = scene.add.image(p.x, p.y + 3, 'glow').setScale(0.09).setTint(cols[i % 4]).setBlendMode(Phaser.BlendModes.ADD).setDepth(90006);
    scene.add.rectangle(p.x, p.y + 3, 2, 3, cols[i % 4]).setDepth(y + 301);
    scene.tweens.add({ targets: b, alpha: { from: 1, to: 0.3 }, duration: 600 + (i % 3) * 200, yoyo: true, repeat: -1, delay: i * 90 });
  });
}

function fireworks(scene: Phaser.Scene) {
  scene.time.addEvent({
    delay: 1300, loop: true, callback: () => {
      const cam = scene.cameras.main.worldView;
      const x = Phaser.Math.Between(cam.x + 60, cam.right - 60), top = Phaser.Math.Between(cam.y + 40, cam.y + 140);
      const col = Phaser.Math.RND.pick([0xff5050, 0xffd050, 0x50c0ff, 0xff70e0, 0x80ff80, 0xffffff]);
      const rocket = scene.add.image(x, cam.bottom, 'dot').setTint(0xffe0a0).setDepth(95500);
      scene.tweens.add({
        targets: rocket, y: top, duration: 700, ease: 'Quad.easeOut', onComplete: () => {
          rocket.destroy();
          const flash = scene.add.image(x, top, 'glow').setTint(col).setBlendMode(Phaser.BlendModes.ADD).setDepth(95500).setScale(0.6);
          scene.tweens.add({ targets: flash, alpha: 0, scale: 1.4, duration: 600, onComplete: () => flash.destroy() });
          for (let i = 0; i < 26; i++) {
            const a = (i / 26) * Math.PI * 2, v = Phaser.Math.Between(40, 70);
            const s = scene.add.image(x, top, 'dot').setTint(col).setDepth(95501).setBlendMode(Phaser.BlendModes.ADD);
            scene.tweens.add({ targets: s, x: x + Math.cos(a) * v, y: top + Math.sin(a) * v + 20, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => s.destroy() });
          }
        },
      });
    },
  });
}

function floatingHearts(scene: Phaser.Scene) {
  scene.time.addEvent({
    delay: 700, loop: true, callback: () => {
      const cam = scene.cameras.main.worldView;
      const h = scene.add.image(Phaser.Math.Between(cam.x, cam.right), cam.bottom + 10, 'hm-heart').setDepth(95500).setScale(Phaser.Math.FloatBetween(1, 1.8)).setAlpha(0.85);
      scene.tweens.add({ targets: h, y: cam.y - 20, x: h.x + Phaser.Math.Between(-40, 40), duration: Phaser.Math.Between(5000, 8000), onComplete: () => h.destroy() });
    },
  });
}

// ---------------------------------------------------------------- outdoors
/** Decorates the garden around the villa. `villa` is its top-left corner and width. */
export function decorateGarden(scene: Phaser.Scene, villa: { x: number; y: number; w: number }, path: { x: number; y: number }) {
  const h = holidays();
  if (h.includes('christmas') || h.includes('newyear')) stringLights(scene, villa.x + 16, villa.x + villa.w - 16, villa.y + 98);
  if (h.includes('newyear')) fireworks(scene);
  if (h.includes('valentine') || h.includes('anniversary')) floatingHearts(scene);
  if (h.includes('birthday')) {
    const names = birthdaysToday().join(' & ');
    banner(scene, path.x, path.y, `Gefeliciteerd ${names}!`);
    for (const [x, y] of [[villa.x + 20, villa.y + 230], [villa.x + villa.w - 20, villa.y + 230], [path.x - 120, path.y + 40], [path.x + 120, path.y + 40]]) {
      const b = scene.add.image(x, y, 'hm-balloons').setOrigin(0.5, 1).setDepth(y);
      scene.tweens.add({ targets: b, y: y - 4, angle: { from: -3, to: 3 }, duration: 1600 + x % 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    scene.time.delayedCall(900, () => confetti(scene));
  }
  if (h.includes('anniversary')) {
    banner(scene, path.x, path.y + (h.includes('birthday') ? 34 : 0), `${anniversaryYears()} jaar samen!`, 0xd8283a);
    scene.time.delayedCall(900, () => confetti(scene, W / 2, 120, 40));
  }
}

/** Decorates the village square. Sinterklaas: pepernoten to collect. */
export function decorateVillage(scene: Phaser.Scene & Talker, square: { x: number; y: number }) {
  const h = holidays();
  if (h.includes('newyear')) fireworks(scene);
  if (h.includes('valentine') || h.includes('anniversary')) floatingHearts(scene);
  if (h.includes('christmas')) {
    scene.add.image(square.x + 110, square.y + 10, 'hm-xmas-tree').setOrigin(0.5, 1).setScale(1.4).setDepth(square.y + 10);
    scene.add.image(square.x + 110, square.y - 120, 'glow').setTint(0xffe27a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setDepth(90006);
    scene.interactables.push({ id: 'xmas-tree', at: { x: square.x + 110, y: square.y + 20 }, who: 'Kerstboom', lines: ['Een enorme kerstboom midden op het plein, vol lichtjes en ballen.', 'Iemand heeft er een pluche schildpad als piek in gehangen. Niemand weet wie.'] });
  }
  if (h.includes('birthday')) banner(scene, square.x, square.y - 150, `Heel Heartwood feliciteert ${birthdaysToday().join(' & ')}!`);
  if (h.includes('sinterklaas')) {
    const fs = loadFestive();
    if (fs.pepernotenDay !== dayKey()) { fs.pepernotenDay = dayKey(); saveFestive(fs); }
    const spots = [[-200, 60], [-120, 140], [-40, 200], [60, 170], [160, 120], [240, 60], [300, 200], [-260, 220], [120, 260], [-300, 120]];
    let found = 0;
    for (const [dx, dy] of spots) {
      const x = square.x + dx, y = square.y + dy;
      const p = scene.add.image(x, y, 'hm-pepernoot').setDepth(y).setScale(1.3);
      const it = {
        id: `pepernoot-${dx}`, at: { x, y }, who: 'Pepernoot', lines: [] as string[],
        action: () => {
          p.destroy(); it.at.y = -9999; found++;
          const s = loadFestive(); s.pepernoten = (s.pepernoten ?? 0) + 1; saveFestive(s);
          if (found === spots.length) scene.say('Pepernoten', ['Alle tien gevonden! Je zakken zitten vol pepernoten.', `(In totaal ${s.pepernoten} pepernoten gevonden.)`]);
          else scene.say('Pepernoot', [Phaser.Math.RND.pick(['Een pepernoot! Hap.', 'Nog een pepernoot. Die gaat in je zak.', 'Pepernoot gevonden. Sint is hier langs geweest.']), `(${found}/${spots.length})`]);
        },
      };
      scene.interactables.push(it);
    }
  }
}

// ---------------------------------------------------------------- indoors
/** The living room: tree and presents, the Sinterklaas shoe, the birthday cake, roses. */
export function decorateHouse(scene: Phaser.Scene & Talker, spots: { tree: { x: number; y: number }; shoe: { x: number; y: number }; table: { x: number; y: number } }, name: string) {
  const h = holidays();
  if (h.includes('christmas') || h.includes('newyear')) {
    const { x, y } = spots.tree;
    scene.add.image(x, y, 'hm-xmas-tree').setOrigin(0.5, 1).setDepth(y);
    scene.add.image(x, y - 90, 'glow').setTint(0xffe27a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setDepth(90006);
    scene.add.image(x - 22, y + 6, 'hm-present-a').setOrigin(0.5, 1).setDepth(y + 6);
    scene.add.image(x + 20, y + 8, 'hm-present-b').setOrigin(0.5, 1).setDepth(y + 8);
    scene.add.image(x + 2, y + 12, 'hm-present-c').setOrigin(0.5, 1).setDepth(y + 12);
    scene.interactables.push({
      id: 'presents', at: { x, y: y + 22 }, who: 'Cadeautjes', lines: [], action: () => {
        const d = today();
        const opened = loadFestive().presentsOpened === String(d.getFullYear());
        if (d.getMonth() === 11 && d.getDate() >= 25 && !opened) {
          const s = loadFestive(); s.presentsOpened = String(d.getFullYear()); saveFestive(s);
          confetti(scene);
          scene.say('Cadeautjes', ['Het is Kerst! Jullie mogen de cadeautjes openmaken!', 'Een warme sjaal, een doos M&M\'s van Gilly, en een kaartje: "Voor jullie tweetjes. Fijne kerst! — Iedereen uit PoopyWorld"']);
        } else if (opened) {
          scene.say('Cadeautjes', ['De cadeautjes zijn open. Het papier ligt nog overal.']);
        } else {
          scene.say('Cadeautjes', [`Drie cadeautjes onder de boom. Op eentje staat jouw naam, ${name}.`, 'Je schudt eraan. Het rammelt. Niet openmaken tot 25 december!']);
        }
      },
    });
  }
  if (h.includes('sinterklaas')) {
    const { x, y } = spots.shoe;
    const fs = loadFestive();
    const filled = fs.shoeDate && fs.shoeDate < dayKey();
    scene.add.image(x, y, 'hm-shoe').setOrigin(0.5, 1).setDepth(y + 1).setVisible(!!fs.shoeDate);
    let letter: Phaser.GameObjects.Container | null = null;
    if (filled) {
      const bar = scene.add.image(0, 0, 'hm-choco');
      const ch = scene.add.text(0, 2, (name[0] ?? 'P').toUpperCase(), { fontFamily: FONT, fontSize: '16px', color: '#3a1a08' }).setOrigin(0.5).setResolution(2);
      letter = scene.add.container(x + 18, y - 10, [bar, ch]).setDepth(y + 2).setScale(0.7);
    }
    scene.interactables.push({
      id: 'shoe', at: { x, y: y + 10 }, who: 'Schoen', lines: [], action: () => {
        const s = loadFestive();
        if (!s.shoeDate) {
          s.shoeDate = dayKey(); saveFestive(s);
          scene.say('Schoen zetten', ['Je zet je schoen bij de open haard, met een wortel voor het paard.', 'Je zingt zachtjes: "Sinterklaas kapoentje, gooi wat in mijn schoentje..."', 'Kom morgen kijken of de Sint is langs geweest!']);
        } else if (s.shoeDate < dayKey()) {
          s.shoeGifts = (s.shoeGifts ?? 0) + 1; s.shoeDate = undefined; saveFestive(s);
          letter?.destroy();
          scene.say('Schoen', [
            `De Sint is geweest! In je schoen zit een chocoladeletter: de ${(name[0] ?? 'P').toUpperCase()}, van ${name}.`,
            'En een mandarijn, een handje pepernoten en een briefje:',
            '"Sinterklaas zag in zijn boek, dat jij en je lief samen op avontuur gaan, op elke hoek. Blijf dat doen, zegt de Sint, want samen is het leukst, zo vindt hij dat het klinkt."',
            'Het rijmt niet helemaal. De Sint is ook al oud. Zet je schoen gerust nog een keer.',
          ]);
        } else {
          scene.say('Schoen', ['Je schoen staat klaar. Kom morgen terug!']);
        }
      },
    });
  }
  if (h.includes('birthday')) {
    const { x, y } = spots.table;
    const cakeImg = scene.add.image(x, y, 'hm-cake').setOrigin(0.5, 1).setDepth(y + 30);
    const flames = [-8, 0, 8].map((dx) => scene.add.image(x + dx, y - 30, 'glow').setScale(0.05).setTint(0xffb030).setBlendMode(Phaser.BlendModes.ADD).setDepth(90006));
    let blown = false;
    scene.interactables.push({
      id: 'cake', at: { x, y: y + 18 }, who: 'Verjaardagstaart', lines: [], action: () => {
        if (blown) { scene.say('Taart', ['Er is nog taart over. Er is altijd nog taart over.']); return; }
        blown = true;
        flames.forEach((f) => f.destroy());
        confetti(scene);
        const s = loadFestive(); s.candles = (s.candles ?? 0) + 1; saveFestive(s);
        scene.say('Verjaardagstaart', ['Je haalt diep adem... en blaast alle kaarsjes in één keer uit!', `Lang zal ${birthdaysToday().join(' en ')} leven, lang zal ze leven, in de gloria!`, 'Doe een wens. Niet hardop zeggen.']);
      },
    });
    void cakeImg;
  }
  if (h.includes('anniversary') || h.includes('valentine')) {
    const { x, y } = spots.table;
    scene.add.image(x + 30, y, 'hm-roses').setOrigin(0.5, 1).setDepth(y + 31);
    scene.interactables.push({ id: 'roses', at: { x: x + 30, y: y + 18 }, who: 'Rozen', lines: h.includes('anniversary')
      ? [`Een bos rode rozen met een kaartje: "${anniversaryYears()} jaar samen. En nog heel veel jaren erbij."`]
      : ['Een bos rode rozen. Op het kaartje staat alleen een hartje. Dat zegt genoeg.'] });
  }
}
