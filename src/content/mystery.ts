/**
 * The Secret of Hollowmere Manor (an original mystery, inspired by the mood of House of Anubis).
 * Chapter 1: "De Brief". Progress is saved in this browser.
 */
export type MysterySave = {
  letter: boolean; plateHint: boolean; shelfOpen: boolean; seal1: boolean; pages: number[];
  letter2?: boolean; trapdoor?: boolean; seal2?: boolean; caught?: number;
};

const K = 'poopyworld.mystery.v1';
export function loadMystery(): MysterySave {
  try { return { letter: false, plateHint: false, shelfOpen: false, seal1: false, pages: [], ...JSON.parse(localStorage.getItem(K) ?? '{}') }; }
  catch { return { letter: false, plateHint: false, shelfOpen: false, seal1: false, pages: [] }; }
}
export function saveMystery(m: MysterySave) {
  try { localStorage.setItem(K, JSON.stringify(m)); } catch { /* fine */ }
}

export const LETTER = [
  'Er zit een brief in de brievenbus. Het papier is vergeeld en ruikt naar kaarsvet.',
  '"Aan de twee bewoners van het huis bij het meer. Het is lang geleden dat hier iemand woonde die zo goed voor zijn dieren zorgt."',
  '"Ik heb jullie hulp nodig. Kom naar mijn huis op de heuvel, voorbij Heartwood. Het pad begint aan het eind van de onderste straat."',
  '"P.S. Neem elkaar mee. Sommige deuren gaan alleen open voor twee." — O. H.',
];

export const PAGES = [
  {
    who: 'Dagboek, pagina 1',
    lines: ['"3 maart 1925. Vannacht zag ik weer het licht boven de heuvel. Geen ster die ik ken."', '"Het knippert, alsof het iets wil zeggen. Ik ga het uitzoeken, wat de anderen ook zeggen." — Odile Hollow'],
  },
  {
    who: 'Dagboek, pagina 2',
    lines: ['"12 maart. De Lantaarnkring zegt dat ik moet stoppen met zoeken. Waarom zijn ze zo bang?"', '"Ik heb het eerste zegel verstopt waar alleen een sterrenkijker zou zoeken."'],
  },
];

export const SEAL_FOUND = [
  'Achter de boekenkast ligt een stenen zegel: een wolf onder een ster. Het voelt warm aan.',
  'Ernaast ligt een briefje: "Dit is de eerste van vier. Breng ze naar het licht. Vertrouw de Lantaarnkring niet." — O. H.',
];

// ================================================================ Chapter 2: De Lantaarnkring
export const LETTER2 = [
  'Weer een brief, met hetzelfde vergeelde papier. Er zit een lavendeltakje bij.',
  '"Jullie hebben het eerste zegel gevonden. Ik wist dat ik op jullie kon rekenen."',
  '"Het tweede ligt onder het huis, in de oude kelder. Het luik zit verstopt in de studeerkamer, onder het blauwe kleed."',
  '"Maar pas op voor Grauw, de huisbewaarder. Hij loopt elke avond zijn ronde met zijn lantaarn. Hij hoort bij de Kring."',
  '"Laat je niet zien. En als je wordt gezien: rennen." — O. H.',
];

export const GRAUW = {
  caught: [
    ['"WAT DOEN JULLIE HIER?!"', 'Grauw schijnt je recht in je gezicht met zijn lantaarn.', '"Dit huis is verboden terrein. ERUIT!"'],
    ['"Jullie weer?! Hebben jullie geen eigen huis?"', '"Eruit. En kom niet terug." Hij zegt dat elke keer.'],
    ['"Ik zie alles. Ik hoor alles. Ik ruik zelfs jullie zonnebrand."', '"ERUIT!"'],
    ['Grauw zucht heel diep.', '"Weet je hoe laat het is? Bedtijd. Voor mij. Eruit."'],
  ],
  hint: ['Grauw loopt een vaste ronde door de hal en de studeerkamer.', 'Kijk waar zijn lantaarn schijnt, wacht tot hij zich omdraait, en sluip erachter langs.'],
};

export const TRAPDOOR = {
  find: ['Je tilt een hoekje van het blauwe kleed op...', 'Er zit een houten luik in de vloer, met een ijzeren ring. Er komt koude lucht onderdoor.', 'Je trekt het open. Een stenen trap gaat naar beneden, het donker in.'],
  closed: ['Een blauw kleed met sterren erop. Het ligt een beetje bobbelig, alsof er iets onder zit.'],
};

export const CELLAR = {
  enter: ['De kelder van Hollowmere. Het is aardedonker, op het licht van je lantaarn na.', 'Ergens drupt water. Ergens anders kraakt iets. Je doet maar alsof je dat niet hoorde.'],
  brazier: ['Een vuurschaal met een felle vlam. Het licht valt als een smalle straal door de kelder.', 'Op de rand staat gegraveerd: "Leid het licht naar de maan."'],
  mirror: ['Een oude spiegel op een draaivoet.', 'Je draait hem een kwartslag.'],
  doorClosed: ['Een stenen deur met een maan erin gebeiteld. De maan is dof en koud.', 'Als er licht op zou vallen...'],
  doorOpen: ['De deur is in de vloer verdwenen. Waar hij stond, gloeit nog een zilveren maan op de grond.'],
};

export const PAGES2 = [
  {
    who: 'Dagboek, pagina 3',
    lines: ['"20 maart. Ik heb de vier zegels verstopt, elk op een plek die de Kring niet kent."', '"De wolf in mijn studeerkamer. De uil onder het huis. De andere twee... die schrijf ik niet op. Zelfs niet hier." — O. H.'],
  },
  {
    who: 'Dagboek, pagina 4',
    lines: ['"De Kring wil het licht boven de heuvel voor zichzelf. Ze zeggen dat het gevaarlijk is in de verkeerde handen."', '"Daar hebben ze gelijk in. Daarom mogen het hún handen niet zijn."'],
  },
];

export const SEAL2_FOUND = [
  'In de nis achter de stenen deur ligt het tweede zegel: een uil onder een halve maan. Het voelt koel aan, als nachtlucht.',
  'Eronder ligt een kaartje in hetzelfde handschrift: "Twee van de vier. De volgende hoort bij de tijd. Zoek de klok die nooit stilstaat." — O. H.',
];

