/**
 * Character looks: which LPC layers a character is built from, in which colours,
 * and how to paint them into one sprite sheet (walk 512x256 + idle 192x256).
 */
import palettes from '../assets/palettes.json';

const layerUrls = import.meta.glob('../assets/chars/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type BodyType = 'f' | 'm';

export type Look = {
  body: BodyType;
  skin: string;
  eyes: string;
  hair: string;        // a hair style key, or 'none'
  hairColor: string;
  beard: string;       // 'none' | 'trimmed' | 'full' | 'mustache'
  shirt: string;
  shirtColor: string;
  legs: string;
  legsColor: string;
  shoes: string;
  shoesColor: string;
};

export const OPTIONS = {
  body: [['f', 'Vrouw'], ['m', 'Man']] as Array<[BodyType, string]>,
  skin: palettes.order.skin,
  eyes: Object.keys(palettes.eyes),
  hair: [
    ['curly', 'Krullen lang'], ['page', 'Lang steil'], ['bun', 'Knot met pony'], ['bob-side', 'Bob'], ['bob-bangs', 'Bob met pony'],
    ['idol', 'Golvend'], ['twists', 'Twists'], ['twists-fade', 'Twists kort'], ['dreads', 'Dreadlocks'], ['cornrows', 'Cornrows'],
    ['natural', 'Afro kort'], ['short-curly', 'Krullen kort'], ['parted', 'Scheiding'], ['cowlick', 'Kuif'],
    ['flattop', 'Flat top'], ['flattop-fade', 'Flat top fade'], ['buzzcut', 'Opgeschoren'], ['none', 'Kaal'],
  ] as Array<[string, string]>,
  hairColor: palettes.order.hair,
  beard: [['none', 'Geen'], ['trimmed', 'Kort'], ['full', 'Vol'], ['mustache', 'Snor']] as Array<[string, string]>,
  shirt: [['tee', 'T-shirt'], ['vneck', 'V-hals'], ['scoop', 'Ronde hals'], ['polo', 'Polo'], ['buttoned', 'Overhemd kort'], ['longsleeve', 'Lange mouw']] as Array<[string, string]>,
  legs: [['pants', 'Broek'], ['cuffed', 'Opgerolde broek'], ['leggings', 'Legging'], ['shorts', 'Korte broek'], ['overalls', 'Tuinbroek']] as Array<[string, string]>,
  shoes: [['shoes', 'Schoenen'], ['boots', 'Laarzen']] as Array<[string, string]>,
  cloth: palettes.order.cloth,
};

/** Dutch names for the colours, so the creator speaks Dutch. */
export const COLOUR_NL: Record<string, string> = {
  Porcelain: 'Porselein', Ivory: 'Ivoor', Peach: 'Perzik', Tan: 'Getint', Honey: 'Honing', Bronze: 'Brons', Tawny: 'Karamel',
  Brown: 'Bruin', Coffee: 'Koffie', Raven: 'Ravenzwart', Black: 'Zwart', Charcoal: 'Antraciet', Chestnut: 'Kastanje',
  'Ash Brown': 'Asbruin', Red: 'Rood', Ruby: 'Robijn', Orange: 'Oranje', Blonde: 'Blond', Platinum: 'Platina', White: 'Wit',
  Gray: 'Grijs', Pink: 'Roze', Purple: 'Paars', Violet: 'Violet', Blue: 'Blauw', Teal: 'Petrol', Green: 'Groen', Hazel: 'Hazelnoot',
  Linen: 'Linnen', Wine: 'Wijnrood', Coral: 'Koraal', Mustard: 'Mosterd', Lemon: 'Citroen', Mint: 'Mint', Forest: 'Bosgroen',
  Sky: 'Hemelsblauw', Cerulean: 'Azuur', Denim: 'Denim', Navy: 'Marine', Lavender: 'Lavendel', Leather: 'Leer',
};

export const DEFAULT_LOOK: Look = {
  body: 'f', skin: 'Porcelain', eyes: 'Green', hair: 'curly', hairColor: 'Red', beard: 'none',
  shirt: 'scoop', shirtColor: 'Mint', legs: 'pants', legsColor: 'Denim', shoes: 'shoes', shoesColor: 'Brown',
};

/** A representative swatch colour for a palette entry. */
export function swatch(category: 'hair' | 'skin' | 'eyes' | 'cloth', name: string) {
  const values = Object.values((palettes as unknown as Record<string, Record<string, Record<string, string>>>)[category][name] ?? {});
  const info = values.map((h) => {
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return { h, lum: r * 0.3 + g * 0.59 + b * 0.11, sat: max === 0 ? 0 : (max - min) / max, v: max / 255 };
  });
  if (!info.length) return '#888888';
  if (category === 'eyes') {
    return '#' + info.reduce((a, b) => (b.sat * (b.v > 0.3 ? 1 : 0.2) > a.sat * (a.v > 0.3 ? 1 : 0.2) ? b : a)).h;
  }
  // Skin, hair and cloth: a light mid-tone of the ramp (skip the highlight).
  info.sort((a, b) => b.lum - a.lum);
  return '#' + info[Math.min(info.length - 1, category === 'skin' ? 1 : 2)].h;
}

// ---------- painting ----------

const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadLayer(name: string) {
  const url = layerUrls[`../assets/chars/${name}.png`];
  if (!url) return null;
  if (!imageCache.has(name)) {
    imageCache.set(name, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    }));
  }
  return imageCache.get(name)!;
}

type Pal = Record<string, string>;
function paletteFor(category: string, colour: string): Pal | undefined {
  return (palettes as unknown as Record<string, Record<string, Pal>>)[category]?.[colour];
}

/** The layers of a look, back to front, with the palette each one uses. */
export function layersOf(look: Look): Array<[string, Pal | undefined]> {
  const b = look.body;
  const hairPal = paletteFor('hair', look.hairColor);
  const out: Array<[string, Pal | undefined]> = [];
  if (look.hair === 'curly' || look.hair === 'page') out.push([`hairback-${look.hair}`, hairPal]);
  out.push([`body-${b}`, paletteFor('skin', look.skin)]);
  out.push([`feet-${look.shoes}-${b}`, paletteFor('shoes', look.shoesColor)]);
  out.push([`legs-${look.legs}-${b}`, paletteFor('cloth', look.legsColor)]);
  out.push([`shirt-${look.shirt}-${b}`, paletteFor('cloth', look.shirtColor)]);
  out.push([`head-${b}`, paletteFor('skin', look.skin)]);
  out.push(['eyes', paletteFor('eyes', look.eyes)]);
  out.push([b === 'm' ? 'brows-thick' : 'brows-thin', hairPal]);
  if (look.beard !== 'none') out.push([`beard-${look.beard}`, hairPal]);
  if (look.hair !== 'none') out.push([`hair-${look.hair}`, hairPal]);
  return out;
}

function recolour(data: ImageData, pal: Pal | undefined) {
  if (!pal) return;
  const map = new Map<number, number>();
  for (const [k, v] of Object.entries(pal)) map.set(parseInt(k, 16), parseInt(v, 16));
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const to = map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to !== undefined) { d[i] = (to >> 16) & 255; d[i + 1] = (to >> 8) & 255; d[i + 2] = to & 255; }
  }
}

/** Paints a full character sheet (704x256: walk then idle) for a look. */
export async function paintLook(look: Look): Promise<HTMLCanvasElement> {
  const out = document.createElement('canvas');
  out.width = 704; out.height = 256;
  const ctx = out.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = 704; tmp.height = 256;
  const t = tmp.getContext('2d', { willReadFrequently: true })!;
  for (const [name, pal] of layersOf(look)) {
    const p = loadLayer(name);
    if (!p) continue;
    const img = await p;
    t.clearRect(0, 0, 704, 256);
    t.drawImage(img, 0, 0);
    const data = t.getImageData(0, 0, 704, 256);
    recolour(data, pal);
    t.putImageData(data, 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }
  return out;
}

/** Splits a painted sheet into the walk and idle canvases. */
export function splitSheet(sheet: HTMLCanvasElement) {
  const walk = document.createElement('canvas');
  walk.width = 512; walk.height = 256;
  walk.getContext('2d')!.drawImage(sheet, 0, 0, 512, 256, 0, 0, 512, 256);
  const idle = document.createElement('canvas');
  idle.width = 192; idle.height = 256;
  idle.getContext('2d')!.drawImage(sheet, 512, 0, 192, 256, 0, 0, 192, 256);
  return { walk, idle };
}
