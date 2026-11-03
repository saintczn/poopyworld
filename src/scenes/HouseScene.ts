import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';

/**
 * Inside the house: one open living room with a kitchen corner.
 * Room is 14 x 8 floor tiles with a 3-tile-high back wall; coordinates are pixels.
 */
const ROOM = { x: 32, y: 128, w: 448, h: 256 };
const WALL_TOP = 32;
const MAP = { w: 512, h: 448 };
const DOOR = { x: 256, w: 64 };

export class HouseScene extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('house');
  }

  protected build(): Arrival {
    this.physics.world.setBounds(0, 0, MAP.w, MAP.h);
    const cam = this.cameras.main;
    cam.setBackgroundColor('#1c120d');
    // The room is narrower than the screen: let the camera show it centred.
    cam.setBounds((MAP.w - 640) / 2, -20, 640, MAP.h + 20);

    this.paintRoom();
    this.furnish();
    this.walls();

    const lights: LightSpot[] = [
      { x: 160, y: 120, size: 230, flicker: true, colour: 0xff9a40, always: 0.28 },
      { x: 96, y: 258, size: 160, always: 0.1 },
      { x: 64, y: 80, size: 90, colour: 0xfff1c8 },
      { x: 380, y: 80, size: 90, colour: 0xfff1c8 },
    ];
    this.ambient = new Ambient(this, MAP, lights, [], undefined, true);

    this.interactables.push(
      { id: 'fireplace', at: { x: 160, y: 160 }, who: 'Open haard', lines: ['Het vuur knettert gezellig.', 'Perfect voor een koude avond samen op de bank.'] },
      { id: 'sofa', at: { x: 160, y: 318 }, who: 'De bank', lines: ['Een zachte groene bank met uitzicht op de open haard.', 'Hier komt straks filmavond. Popcorn of bitterballen?'] },
      {
        id: 'clock', at: { x: 104, y: 156 }, who: 'Staande klok', lines: [],
        action: () => {
          const t = new Date();
          const hh = String(t.getHours()).padStart(2, '0'), mm = String(t.getMinutes()).padStart(2, '0');
          this.say('Staande klok', [`Tik, tak. Het is ${hh}:${mm}.`, 'In PoopyWorld loopt de tijd gelijk met de echte tijd. Kijk maar eens buiten als het donker is.']);
        },
      },
      { id: 'books', at: { x: 216, y: 158 }, who: 'Boekenkast', lines: ['Boeken, spelletjes en een leeg fotoalbum.', 'Het album wordt straks gevuld met jullie eigen herinneringen.'] },
      { id: 'painting', at: { x: 300, y: 152 }, who: 'Schilderij', lines: ['Een schilderijtje van de bergen.', 'Deze muur wordt straks jullie herinneringsmuur, met foto\'s uit de Hub.'] },
      { id: 'kitchen', at: { x: 356, y: 172 }, who: 'Keuken', lines: ['Een aanrecht met een fornuis en kastjes.', 'Straks kun je hier koken met wat je in de moestuin oogst.'] },
      { id: 'fridge', at: { x: 460, y: 172 }, who: 'Koelkast', lines: ['Je opent de koelkast.', 'Bitterballen. Nog meer bitterballen. En helemaal achterin... een bakje aardbeien. Snel weer dicht.'] },
      { id: 'dining', at: { x: 370, y: 346 }, who: 'Eettafel', lines: ['Een tafel voor twee, met een kleedje en een kaarsje.'] },
      { id: 'window', at: { x: 64, y: 156 }, who: 'Raam', lines: ['Buiten zie je de tuin, de vijver en de geitenwei.'] },
    );
    return { x: DOOR.x, y: 370, facing: 'up' };
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const p = this.player;
    if (p && this.registry.get('started') && p.y > ROOM.y + ROOM.h + 8) {
      this.travel('garden', { x: 512, y: 252, facing: 'down' });
    }
  }

  private paintRoom() {
    const floor = this.textures.get('floorwood').getSourceImage() as HTMLImageElement;
    const walls = this.textures.get('walls').getSourceImage() as HTMLImageElement;
    const key = 'house-room';
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, MAP.w, MAP.h)!;
      const c = tex.getContext();
      c.imageSmoothingEnabled = false;
      const rnd = new Phaser.Math.RandomDataGenerator(['house']);
      // warm wooden floor
      for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += 32) {
        for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += 32) {
          const row = rnd.pick([0, 0, 1, 2]);
          c.drawImage(floor, 64, row * 32, 32, 32, x, y, 32, 32);
        }
      }
      // floor in the doorway
      for (let x = DOOR.x - DOOR.w / 2; x < DOOR.x + DOOR.w / 2; x += 32) c.drawImage(floor, 64, 0, 32, 32, x, ROOM.y + ROOM.h, 32, 16);
      // back wall: cream paint with trim and skirting
      for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += 32) {
        const sx = x === ROOM.x ? 192 : x === ROOM.x + ROOM.w - 32 ? 256 : 224;
        c.drawImage(walls, sx, 0, 32, 96, x, WALL_TOP, 32, 96);
      }
      // soft shadow along the bottom of the wall
      const grad = c.createLinearGradient(0, ROOM.y, 0, ROOM.y + 14);
      grad.addColorStop(0, 'rgba(40,20,10,0.35)');
      grad.addColorStop(1, 'rgba(40,20,10,0)');
      c.fillStyle = grad;
      c.fillRect(ROOM.x, ROOM.y, ROOM.w, 14);
      // door mat
      c.fillStyle = '#3a2418'; c.fillRect(DOOR.x - 26, ROOM.y + ROOM.h - 22, 52, 20);
      c.fillStyle = '#9a4a32'; c.fillRect(DOOR.x - 24, ROOM.y + ROOM.h - 20, 48, 16);
      c.fillStyle = '#c86a44'; c.fillRect(DOOR.x - 20, ROOM.y + ROOM.h - 17, 40, 10);
      c.fillStyle = '#e9b27a';
      for (let i = 0; i < 5; i++) c.fillRect(DOOR.x - 16 + i * 8, ROOM.y + ROOM.h - 13, 4, 2);
      tex.refresh();
    }
    this.add.image(0, 0, key).setOrigin(0).setDepth(-1000);
  }

  /** The thick wall tops around the room (drawn over everything at the edges). */
  private walls() {
    const g = this.add.graphics().setDepth(5000);
    const band = (x: number, y: number, w: number, h: number) => {
      g.fillStyle(0x3a2a24); g.fillRect(x - 2, y - 2, w + 4, h + 4);
      g.fillStyle(0xe9e2cc); g.fillRect(x, y, w, h);
      g.fillStyle(0xfdf8ea); g.fillRect(x, y, w, 2);
      g.fillStyle(0xc9bfa6); g.fillRect(x, y + h - 2, w, 2);
    };
    const L = ROOM.x - 16, R = ROOM.x + ROOM.w, B = ROOM.y + ROOM.h;
    band(L, WALL_TOP - 16, ROOM.w + 32, 16);
    band(L, WALL_TOP - 16, 16, B + 16 - (WALL_TOP - 16));
    band(R, WALL_TOP - 16, 16, B + 16 - (WALL_TOP - 16));
    band(L, B, DOOR.x - DOOR.w / 2 - L, 16);
    band(DOOR.x + DOOR.w / 2, B, R + 16 - (DOOR.x + DOOR.w / 2), 16);

    // collisions
    this.solid(0, 0, MAP.w, ROOM.y + 8);
    this.solid(0, 0, ROOM.x + 4, MAP.h);
    this.solid(ROOM.x + ROOM.w - 4, 0, MAP.w, MAP.h);
    this.solid(0, B + 2, DOOR.x - DOOR.w / 2 + 6, MAP.h);
    this.solid(DOOR.x + DOOR.w / 2 - 6, B + 2, MAP.w, MAP.h);
  }

  private wallItem(name: string, x: number, bottom: number) {
    this.place(name, x, bottom).setDepth(50);
  }

  private furnish() {
    // on the back wall
    this.wallItem('window', 64, 110);
    this.wallItem('window', 380, 104);
    this.wallItem('painting-wide', 160, 62);
    this.wallItem('painting-small', 300, 96);
    // against the back wall
    this.place('clock', 104, 142, [18, 10]);
    this.place('fireplace', 160, 144, [70, 16]);
    this.place('bookshelf', 216, 142, [30, 10]);
    this.place('potted-plant', 250, 146, [24, 8]);
    this.place('counter-run', 357, 156, [168, 26]);
    this.place('fridge', 460, 150, [30, 18]);
    // fire in the hearth
    this.add.sprite(160, 134, 'campfire').setOrigin(0.5, 1).setScale(0.75).setDepth(145).play('fire');
    // living area
    this.add.image(160, 272, 'rug', 'rug-blue').setDepth(-500);
    this.place('sofa-back', 160, 318, [90, 18]);
    this.place('endtable', 224, 312, [18, 8]);
    this.place('floorlamp', 96, 314, [12, 6]);
    this.place('pot-flowers', 224, 290);
    // dining corner
    this.add.image(370, 308, 'rug', 'rug-rose').setDepth(-500);
    this.place('table', 370, 330, [74, 14]);
    this.place('stool', 322, 336, [18, 8]);
    this.place('stool', 418, 336, [18, 8]);
    this.place('pot-flowers', 370, 312).setDepth(331); // on the table
    this.place('potted-plant', 462, 372, [22, 8]);
    this.place('planter-fern', 52, 372, [22, 8]);
  }
}
