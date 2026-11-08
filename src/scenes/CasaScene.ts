import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { TILE as T } from '../config';
import { casa } from '../content/bali';
import { loadMemories, openMemoryForm } from '../ui/memories';

/**
 * Inside Casa Umalas: one long open room. Bedroom on the left, lounge in the middle
 * with big doors onto the garden, kitchen on the right.
 */
const SPEC: RoomSpec = {
  key: 'casa-room',
  map: { w: 896, h: 448 },
  room: { x: 32, y: 128, w: 832, h: 256 },
  wallTop: 32,
  door: { x: 448, w: 64 },
  floorCol: 4,
  wallBlock: 96,
  band: [0xf4ede0, 0xfffaf0, 0xd8ccb4],
};

export class CasaScene extends WorldScene {
  private ambient!: Ambient;
  private mosquito?: Phaser.GameObjects.Sprite;
  private geckoCalls = 0;

  constructor() {
    super('casa');
  }

  protected build(): Arrival {
    const { map, room } = SPEC;
    this.physics.world.setBounds(0, 0, map.w, map.h);
    this.cameras.main.setBounds(0, -20, map.w, map.h + 20).setBackgroundColor('#1c120d');
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));

    // teak beams along the top of the back wall
    const beams = this.add.graphics().setDepth(40);
    beams.fillStyle(0x4a2c18); beams.fillRect(room.x, 30, room.w, 8);
    beams.fillStyle(0x6b4226); beams.fillRect(room.x, 30, room.w, 3);

    const lights: LightSpot[] = [];
    this.furnish(lights);
    this.ambient = new Ambient(this, map, lights, [], undefined, true, undefined, 8);
    return { x: SPEC.door.x, y: room.y + room.h - 10, facing: 'up' };
  }

  private furnish(lights: LightSpot[]) {
    // ---- the big doors with the view, in the middle of the back wall
    this.add.image(448, 54, 'bali-view').setOrigin(0.5, 0).setDepth(50);
    lights.push({ x: 448, y: 150, size: 260, colour: 0xfff1c8, always: 0.15 });
    this.interactables.push({ id: 'view', at: { x: 448, y: 140 }, who: 'Openslaande deuren', lines: [
      'Door de grote deuren zie je het zwembad, de palmen en helemaal achteraan de zee.',
      'Een warme bries waait naar binnen. Het ruikt naar zout en frangipani.',
    ] });

    // ---- bedroom (left)
    this.place('bali-bed', 136, 268, [104, 92]);
    this.place('endtable', 60, 160, [16, 10]);
    this.place('endtable', 212, 160, [16, 10]);
    this.add.image(60, 138, 'candles', 'candle').setDepth(161);
    lights.push({ x: 60, y: 130, size: 90, flicker: true, colour: 0xffb060 }, { x: 212, y: 130, size: 90, flicker: true, colour: 0xffb060 });
    this.add.image(212, 140, 'bali-frangipani').setScale(0.35).setOrigin(0.5, 1).setDepth(161);
    this.place('painting-small', 136, 96).setDepth(50);
    this.interactables.push({
      id: 'bed', at: { x: 136, y: 280 }, who: 'Hemelbed', lines: [],
      action: () => this.say('Hemelbed', ['Een groot teakhouten bed met een klamboe eromheen.', 'Even een middagdutje doen?'], () => this.nap()),
    });
    this.addMosquito();

    // ---- lounge (middle)
    this.add.image(448, 270, 'bali-rug').setDepth(-500);
    this.place('bali-daybed', 448, 228, [96, 30]);
    this.place('potted-plant', 300, 160, [24, 8]);
    this.place('potted-plant', 596, 160, [24, 8]);
    this.place('bali-frog', 520, 358, [20, 8]);
    this.place('floorlamp', 336, 210, [10, 6]);
    lights.push({ x: 336, y: 172, size: 120, colour: 0xffd090 });
    this.interactables.push(
      { id: 'daybed', at: { x: 448, y: 238 }, who: 'Rattan bank', lines: ['Een rattan daybed vol kussens.', 'De perfecte plek voor een middagje niksen met een kokosnoot in de hand.'] },
      { id: 'frog', at: { x: 520, y: 366 }, who: 'Stenen kikker', lines: ['Een stenen kikker met een klein parasolletje.', 'Hij houdt de wacht bij de deur. Heel serieus.'] },
    );
    // the memory wall: frames that fill up with what you write
    this.memoryWall(300, 100);

    // a gecko on the wall
    this.addGecko();

    // ---- kitchen (right)
    this.place('counter-run', 732, 176, [168, 26]);
    this.place('fridge', 840, 168, [30, 18]);
    this.add.image(700, 128, 'bali-coconut').setDepth(178);
    this.add.image(712, 130, 'bali-coconut').setDepth(178);
    this.place('bali-canang', 760, 132).setDepth(178);
    this.place('table', 732, 300, [60, 20]);
    this.place('stool', 690, 304, [12, 6]);
    this.place('stool', 774, 304, [12, 6]);
    lights.push({ x: 732, y: 160, size: 150, colour: 0xfff1c8 });
    this.interactables.push(
      { id: 'kitchen', at: { x: 720, y: 190 }, who: 'Keuken', lines: ['Op het aanrecht: kokosnoten, limoen, sambal en een offerbakje.', 'Iemand heeft hier vanochtend pannenkoekjes met banaan gebakken.'] },
      { id: 'fridge', at: { x: 840, y: 186 }, who: 'Koelkast', lines: ['Kokoswater, mango, ijsthee en een bakje bitterballen van Bram.', 'Geen aardbeien. Bram heeft gecontroleerd.'] },
      { id: 'table', at: { x: 732, y: 322 }, who: 'Ontbijttafel', lines: ['Hier eten jullie ontbijt: vers fruit, roti en heel veel koffie.'] },
    );
  }

  private memoryWall(x: number, y: number) {
    const frames = this.add.graphics().setDepth(50);
    const draw = () => {
      frames.clear();
      const n = loadMemories().length;
      for (let i = 0; i < 4; i++) {
        const fx = x - 54 + i * 36, fy = y - 30 + (i % 2) * 8;
        frames.fillStyle(0x4a2c18); frames.fillRect(fx - 2, fy - 2, 28, 24);
        frames.fillStyle(i < n ? [0x7fb5c9, 0xf5c400, 0x5aa040, 0xe8584a][i] : 0xe9e2cc); frames.fillRect(fx, fy, 24, 20);
        if (i < n) { frames.fillStyle(0xffffff, 0.6); frames.fillRect(fx + 3, fy + 3, 6, 4); }
      }
    };
    draw();
    this.interactables.push({
      id: 'memories', at: { x, y: 140 }, who: 'Herinneringsmuur', lines: [],
      action: () => {
        const list = loadMemories();
        const intro = list.length
          ? ['De herinneringsmuur van Casa Umalas.', ...list.slice(-4).map((m) => `${m.name}: "${m.text}"`), 'Wil je er nog een bijschrijven?']
          : ['Lege fotolijstjes aan de muur.', 'Hier kunnen jullie herinneringen aan Bali opschrijven. Wil je de eerste schrijven?'];
        this.say('Herinneringsmuur', intro, () => {
          this.player.halt();
          openMemoryForm((this.registry.get('playerName') as string) ?? '', () => draw());
        });
      },
    });
  }

  private addGecko() {
    const g = this.add.sprite(620, 60, 'bali-gecko', 0).setDepth(60);
    this.anims.create({ key: 'gecko-walk', frames: this.anims.generateFrameNumbers('bali-gecko', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    const wander = () => {
      const tx = Phaser.Math.Between(560, 840), ty = Phaser.Math.Between(48, 110);
      g.setFlipX(tx < g.x).play('gecko-walk');
      this.tweens.add({
        targets: g, x: tx, y: ty, duration: Phaser.Math.Distance.Between(g.x, g.y, tx, ty) * 30,
        onComplete: () => { g.stop(); this.time.delayedCall(Phaser.Math.Between(1500, 4000), wander); },
      });
    };
    wander();
    // every now and then it calls out
    this.time.addEvent({
      delay: 14000, loop: true, callback: () => {
        const t = this.add.text(g.x, g.y - 8, 'tokèh!', { fontFamily: '"Pixelify Sans", monospace', fontSize: '10px', color: '#fff6dc', stroke: '#2a1a14', strokeThickness: 3 })
          .setOrigin(0.5, 1).setResolution(2).setDepth(6000);
        this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 1600, delay: 600, onComplete: () => t.destroy() });
      },
    });
    this.interactables.push({
      id: 'gecko', at: { x: 700, y: 140 }, who: 'Gekko', lines: [],
      action: () => {
        this.geckoCalls++;
        const lines = this.geckoCalls === 1
          ? ['Een gekko kruipt over de muur.', 'Op Bali zeggen ze: als een gekko zeven keer achter elkaar "tokèh" roept, brengt dat geluk.', 'TOKÈH! TOKÈH! TOKÈH!...', '...hij stopt bij zes. Typisch.']
          : ['De gekko kijkt je aan.', '"Tokèh."'];
        this.say('Gekko', lines);
      },
    });
  }

  private addMosquito() {
    const m = this.add.sprite(170, 190, 'bali-mosquito', 0).setDepth(5500);
    this.anims.create({ key: 'mosquito-buzz', frames: this.anims.generateFrameNumbers('bali-mosquito', { start: 0, end: 1 }), frameRate: 20, repeat: -1 });
    m.play('mosquito-buzz');
    this.mosquito = m;
    let tries = 0;
    const entry = {
      id: 'mosquito', at: { x: m.x, y: m.y }, who: 'Mug', lines: [] as string[],
      action: () => {
        tries++;
        this.cameras.main.shake(120, 0.006);
        if (tries < 3) {
          this.say('Mug', [tries === 1 ? 'KLAP! ...mis. De mug zoemt vrolijk verder.' : 'KLAP! Weer mis. Ze lacht je uit, echt waar.']);
        } else {
          m.destroy(); this.mosquito = undefined; entry.at.y = -9999;
          this.say('Mug', ['KLAP! Raak! Eindelijk rust onder de klamboe.']);
        }
      },
    };
    this.interactables.push(entry);
    this.events.on('update', () => {
      if (!this.mosquito) return;
      const t = this.time.now / 1000;
      this.mosquito.setPosition(150 + Math.sin(t * 1.3) * 60 + Math.sin(t * 5) * 8, 200 + Math.cos(t * 1.7) * 40 + Math.cos(t * 6) * 6);
      entry.at.x = this.mosquito.x; entry.at.y = this.mosquito.y + 16;
    });
  }

  /** A nap: fade out, fade in. */
  private nap() {
    this.player.halt();
    this.registry.set('started', false);
    const cam = this.cameras.main;
    cam.fadeOut(900, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      const z = this.add.text(cam.scrollX + 320, cam.scrollY + 180, 'Zzz...', { fontFamily: '"Pixelify Sans", monospace', fontSize: '22px', color: '#ffffff' })
        .setOrigin(0.5).setResolution(2).setDepth(100000);
      this.time.delayedCall(1400, () => {
        z.destroy();
        cam.fadeIn(900);
        this.registry.set('started', true);
        this.say('Hemelbed', ['Jullie worden wakker van de gekko. Uitgerust en een beetje plakkerig van de warmte.', 'Tijd voor een duik in het zwembad!']);
      });
    });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const p = this.player;
    if (p && this.registry.get('started') && p.y > SPEC.room.y + SPEC.room.h + 8) {
      this.travel('bali', { x: (casa.x * T) + 168, y: casa.y * T + 240, facing: 'down' });
    }
  }
}
