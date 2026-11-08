/** Yara and Ben: looks and how they talk. Gilly lives in gilly.ts. */
import type { Look } from '../characters/look';

const pick = <T>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export const YARA_LOOK: Look = {
  body: 'f', skin: 'Peach', eyes: 'Brown', hair: 'curly', hairColor: 'Chestnut', beard: 'none',
  shirt: 'vneck', shirtColor: 'Wine', legs: 'pants', legsColor: 'Black', shoes: 'boots', shoesColor: 'Black',
};

export const BEN_LOOK: Look = {
  body: 'm', skin: 'Porcelain', eyes: 'Blue', hair: 'none', hairColor: 'White', beard: 'full',
  shirt: 'buttoned', shirtColor: 'Denim', legs: 'pants', legsColor: 'Tan', shoes: 'shoes', shoesColor: 'Brown',
};

/** Yara: bossy and confident, with a soft side. */
export function yaraTalk(): string[] {
  const orders = [
    'Die bloemen staan verkeerd. Rood hoort links. Iedereen weet dat.',
    'Jullie brievenbus hangt scheef. Niet tegenspreken, hij hangt scheef.',
    'Als ik jullie was zou ik die geiten eens opvoeden. Ze luisteren naar niemand. Behalve naar mij.',
    'Die kampvuurplek? Prima. Had ik ook zo gedaan. Bijna.',
    'Wie heeft dat pad gelegd? Het is goed. Maar ik had het rechter gedaan.',
  ];
  const soft = [
    'Maar eerlijk? Het is hier echt mooi geworden. Zeg niet dat ik dat zei.',
    'Als je ergens hulp bij nodig hebt, kom je naar mij. Duidelijk?',
    'Ik ben trots op jullie. Zo. Nu ga ik weer kritiek leveren.',
  ];
  return [pick(['Eindelijk, daar ben je.', 'Goed dat je er bent, ik moet je iets vertellen.', 'Luister even.']), pick(orders), pick(soft)];
}

/** Ben: quiet. Mostly "Hm." Now and then one dry line. */
export function benTalk(): string[] {
  if (Math.random() < 0.55) return [pick(['Hm.', 'Hm. (Hij knikt.)', '...Hm.'])];
  return [pick(['Hm.', '...']), pick([
    'Mooi vuurtje.',
    'Die geiten. Die zijn slimmer dan ze eruitzien.',
    'Gilly heeft het weer over de vissen gehad, neem ik aan.',
    'Rustig hier. Goed zo.',
    'Yara heeft gezegd hoe het moet, zeker.',
  ])];
}

/** Buurman Mol: lives under the lawn, wanders around the house. More to come. */
const MOL = [
  ['Goedendag, buren! Ik ben Buurman Mol.', 'Ik woon onder jullie gazon. Al heel lang. Niet schrikken.'],
  ['Die bobbels in het gras? Dat ben ik niet.', '...', 'Oké, dat ben ik wel.'],
  ['Ik zie niet zo goed, daarom heb ik deze bril.', 'Ik zie er nog steeds niks mee, maar hij staat wel heel goed.'],
  ['Als jullie ooit iets kwijt zijn: zeg het maar. Ik graaf het wel op.', 'Behalve sleutels. Sleutels zijn eng.'],
  ['De geiten en ik hebben een afspraak. Zij blijven boven, ik blijf onder.', 'Alleen die witte houdt zich er niet aan.'],
  ['Weet je wat ik het lekkerst vind? Wormen.', 'Weet je wat ik het minst lekker vind? Aardbeien. Net als zij, toch?'],
];
let molVisit = 0;
export function molTalk(): string[] {
  return MOL[molVisit++ % MOL.length];
}

/** Simba, the black cat. */
const SIMBA = [
  ['Miauw.', 'Simba kijkt je aan alsof jij hém nog iets verschuldigd bent.'],
  ['Simba rolt op zijn rug in het gras.', 'Het is een val. Niet aan zijn buik komen.'],
  ['Simba zit heel stil naar een vlinder te staren.', 'Zijn kont wiebelt. Er gaat iets gebeuren.'],
  ['Simba spint en kopt tegen je been.', 'Hij mist de sneeuw, denk ik. Er staat een sneeuwbol in de woonkamer...'],
  ['Simba en Buurman Mol hebben een ingewikkelde relatie.'],
];
let simbaVisit = 0;
export function simbaTalk(): string[] {
  return SIMBA[simbaVisit++ % SIMBA.length];
}

