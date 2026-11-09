import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { CABINETS, loadPuck } from '../content/puck';
import { randomLook } from '../characters/look';
import { rng } from '../world/ground';

const SPEC: RoomSpec = {
  key: 'puck-room', map: { w: 512, h: 448 }, room: { x: 32, y: 128, w: 448, h: 256 }, wallTop: 32,
  door: { x: 256, w: 64 }, floorCol: 0, wallBlock: 384, band: [0x4a2a5a, 0x7a4a8a, 0x2a1a34],
};

/** Inside PUCK Arcade: cabinets along the wall, a bar, neon, and the first playable mini-game. */
export class PuckScene extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('puck');
  }

  protected build(): Arrival {
    this.physics.world.setBounds(0, 0, SPEC.map.w, SPEC.map.h);
    this.cameras.main.setBackgroundColor('#140c18').setBounds((SPEC.map.w - 640) / 2, -20, 640, SPEC.map.h + 20);
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));

    const lights: LightSpot[] = [];
    // neon PUCK on the wall
    const neon = this.add.text(256, 62, 'PUCK', {
      fontFamily: '"Pixelify Sans", "Courier New", monospace', fontSize: '30px', color: '#ff7ae0', stroke: '#5a1a5a', strokeThickness: 4,
    }).setOrigin(0.5).setResolution(2).setDepth(60);
    this.tweens.add({ targets: neon, alpha: { from: 1, to: 0.75 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    lights.push({ x: 256, y: 62, size: 220, colour: 0xff5fd2, flicker: true, always: 0.45 });

    // cabinets
    const save = loadPuck();
    for (const cab of CABINETS) {
      this.place(cab.key, cab.x, 150, [32, 18]);
      lights.push({ x: cab.x, y: 118, size: 70, colour: 0x9be3ff, always: 0.35 });
      const best = save.best[cab.game ?? ''] ?? 0;
      this.interactables.push({
        id: cab.key, at: { x: cab.x, y: 166 }, who: cab.title, lines: [],
        action: cab.game
          ? () => this.say(cab.title, [`${cab.title}! Beste score: ${best}.`, 'Femke, Ricardo en Lotte schuiven aan. Spelen!'], () => this.travelTo(cab.game!))
          : () => this.say(cab.title, ['Het scherm knippert: "BINNENKORT".']),
      });
    }

    // bar on the right
    this.place('counter-run', 392, 214, [168, 24]);
    this.place('stool', 330, 236, [16, 8]);
    this.place('stool', 380, 236, [16, 8]);
    this.place('stool', 430, 236, [16, 8]);
    this.place('fridge', 462, 150, [30, 18]);
    this.place('potted-plant', 50, 372, [22, 8]);
    this.place('barrels', 452, 372, [40, 14]);
    this.place('low-shelf', 96, 320, [90, 10]);
    this.place('crates', 96, 300).setDepth(321);
    lights.push({ x: 392, y: 190, size: 180, colour: 0xffb060, always: 0.3 });
    this.interactables.push(
      { id: 'bar', at: { x: 380, y: 250 }, who: 'Bar', lines: ['De barkeeper zet twee glazen klaar.', '"Voor jullie twee altijd het eerste drankje van het huis."'] },
      { id: 'prizes', at: { x: 96, y: 336 }, who: 'Prijzenbalie', lines: [`Je hebt ${save.tickets} tickets.`, 'Straks kun je tickets hier inwisselen voor stickers, kleding en meubels.'] },
    );
    // a regular at the bar
    this.addVisitor('Barkeeper Mo', randomLook(rng(7)), [{ x: 360, y: 186 }, { x: 420, y: 186 }], () => ['Welkom bij PUCK!', 'Vier kasten, vier spellen. Bitterbal Rush, Geitenchaos, Gladde Paniek en Aardbeien Ontsnapping.', 'Femke is overal heel goed in. Zegt ze zelf.'], 30);

    this.ambient = new Ambient(this, SPEC.map, lights, [], undefined, true);
    return { x: 256, y: 370, facing: 'up' };
  }

  /** Fades out and starts a mini-game scene (not a walkable place). */
  private travelTo(game: string) {
    this.player.halt();
    this.cameras.main.fadeOut(260, 20, 10, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(game));
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const p = this.player;
    if (p && this.registry.get('started') && p.y > SPEC.room.y + SPEC.room.h + 8) this.travel('village', { x: 440, y: 344, facing: 'down' });
  }
}
