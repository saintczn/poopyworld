/**
 * The Secret of Hollowmere Manor (an original mystery, inspired by the mood of House of Anubis).
 * Chapter 1: "De Brief". Progress is saved in this browser.
 */
export type MysterySave = {
  letter: boolean; plateHint: boolean; shelfOpen: boolean; seal1: boolean; pages: number[];
  letter2?: boolean; trapdoor?: boolean; seal2?: boolean; caught?: number;
  clockOpen?: boolean; records?: string[]; seal3?: boolean; letter4?: boolean; rope?: boolean; riddle?: boolean; seal4?: boolean; finale?: boolean; tunnelCaught?: number;
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

// ================================================================ Chapter 3: De Klokkentoren
export const CLOCK = {
  normal: ['Een staande klok. Hij tikt, maar de wijzers bewegen niet.', 'Een klok die nooit stilstaat... en toch staat hij stil?'],
  open: [
    'Je kijkt nog eens goed. Achter het glas zwaait de slinger heen en weer, al honderd jaar.',
    'Je pakt de slinger vast. KLIK. De hele klok zwaait open, als een deur.',
    'Erachter: een smalle trap naar boven, het donker in. Het ruikt naar stof en oud papier.',
  ],
  again: ['De klok staat open. De trap naar de zolder wacht.'],
};

export const ATTIC = {
  enter: ['De zolder van Hollowmere. Maanlicht valt door een rond raam op stoffige lakens en oude koffers.', 'In de hoek staat een grammofoon. Er ligt geen plaat op.'],
  sheet: ['Je trekt het laken eraf. Een stofwolk... en een oude kist.', 'In de kist ligt een grammofoonplaat!'],
  sheetEmpty: ['Een stoffig laken over een oude stoel. Verder niks.'],
  gramophoneEmpty: ['Een grammofoon met een koperen hoorn. Er ligt geen plaat op.', 'Ergens op deze zolder moeten de platen liggen.'],
  ladder: ['Een ladder naar boven. Je hoort getik, heel hard, en het knarsen van tandwielen.'],
  window: ['Door het ronde raam zie je de heuvel achter het huis. Er brandt een klein licht bovenop.', 'Het knippert. Alsof het iets wil zeggen.'],
};

/** Odile's voice on three old records: together they give the time to set. */
export const RECORDS: Array<{ id: string; tex: string; name: string; lines: string[] }> = [
  { id: 'red', tex: 'hm-record-a', name: 'Rode plaat', lines: [
    '*kraak... kraak...*',
    '"Dit is Odile Hollow. Als je dit hoort, heb je de zolder gevonden. Goed zo."',
    '"Het was de nacht van 3 maart 1925. De kerkklok van Heartwood had net ELF keer geslagen..."',
  ] },
  { id: 'blue', tex: 'hm-record-b', name: 'Blauwe plaat', lines: [
    '*kraak...*',
    '"...ik zette thee en wachtte. Precies een KWARTIER later zag ik het licht boven de heuvel voor het eerst."',
    '"Ik heb dat moment vastgezet. In de klok. Waar anders?"',
  ] },
  { id: 'yellow', tex: 'hm-record-c', name: 'Gele plaat', lines: [
    '*kraak... tik... kraak...*',
    '"Zet de torenklok op dat moment, en hij geeft je wat ik verborg."',
    '"O, en vergeet niet: die oude klok liep altijd VIJF MINUTEN VOOR. Dat heb ik nooit gerepareerd. Hihi." *klik*',
  ] },
];

export const TOWER = {
  enter: ['De klokkentoren. Enorme tandwielen draaien om je heen. Door de wijzerplaat valt maanlicht naar binnen.', 'Twee hendels: één voor de uren, één voor de minuten.'],
  wrong: (h: number, m: number) => [`BONGGG. De klok slaat. ${h}:${String(m).padStart(2, '0')} is het niet.`],
  right: ['De wijzers vallen op hun plek. Even is het doodstil...', 'Dan beginnen alle tandwielen tegelijk te draaien! Achter de wijzerplaat schuift een luikje open.'],
};

export const SEAL3_FOUND = [
  'Achter het luikje ligt het derde zegel: een zwarte kat voor een stralende zon.',
  'Hij lijkt je aan te kijken met groene ogen. Je denkt meteen aan Simba.',
  'Op een kaartje: "Drie. Het laatste ligt waar alles begon: onder de heuvel. Ik laat jullie een bericht na." — O. H.',
];

// ================================================================ Chapter 4: De Tunnels
export const LETTER4 = [
  'De laatste brief. Het papier is anders: nieuwer, alsof hij net geschreven is.',
  '"Jullie hebben er drie. Het vierde zegel ligt in de tunnels onder de heuvel. Het begin is de oude put achter het landhuis."',
  '"De Lantaarnkring weet nu dat jullie komen. Ze lopen door de tunnels met hun lantaarns. Blijf uit hun licht."',
  '"Breng de vier zegels naar de Sterrenkamer. Dan zul je zien wat ik zag. Ik wacht op jullie." — O. H.',
];

export const WELL = {
  closed: ['Een oude put. Hij is zo diep dat je de bodem niet ziet.', 'Er hangt geen touw. Je kunt er nu niet in.'],
  open: ['Aan de put hangt nu een touwladder. Iemand wil dat jullie naar beneden gaan.', 'Je klimt naar beneden, de duisternis in...'],
};

export const TUNNELS = {
  enter: ['De tunnels onder de heuvel. Natte stenen muren, het druppen van water, en ergens ver weg: voetstappen.', 'Blijf uit het licht van de lantaarns.'],
  caught: [
    ['Een gestalte in een kap draait zich om. "WIE IS DAAR?"', 'Je rent zo hard je kunt terug naar de put.'],
    ['"Indringers!" Een lantaarn zwaait je kant op.', 'Terug naar het begin!'],
    ['Een kap, een lantaarn, een hand op je schouder...', '"Jullie weer." Je wordt vriendelijk maar beslist teruggebracht.'],
  ],
  riddleDoor: ['Een stenen deur met een raadsel erin gebeiteld:', '"Hoe meer je ervan weghaalt, hoe groter het wordt. Wat ben ik?"'],
  riddleWrong: ['Er gebeurt niks. De deur blijft dicht.', 'Denk nog eens na...'],
  riddleRight: ['De letters gloeien op. Met een zucht schuift de deur open.'],
  sealFound: ['Op een stenen sokkel ligt het vierde zegel: een hert onder een vallende ster.', 'Vier van de vier. Het licht aan het einde van de tunnel wacht.'],
  starDoor: ['Een ronde deur met vier holtes: een wolf, een uil, een kat en een hert.'],
  starDoorLocked: (n: number) => [`Je hebt ${n} van de 4 zegels. De deur blijft dicht.`],
};

export const FINALE = {
  enter: ['De Sterrenkamer. Een ronde ruimte diep onder de heuvel. Het plafond is één groot gewelf vol geschilderde sterren.', 'In het midden staat een stenen sokkel met vier holtes.'],
  place: ['Je legt de zegels één voor één in de holtes. Wolf. Uil. Kat. Hert.', 'Ze beginnen te gloeien...'],
  odile: (names: string) => [
    'Een zachte, blauwe gestalte stapt uit het licht. Een vrouw met een kroontje van sterren.',
    'Odile Hollow: "Eindelijk. Ik heb honderd jaar gewacht op de juiste mensen."',
    '"Het licht boven de heuvel is een ster. Ik ontdekte hem in 1925. De Lantaarnkring wilde hem geheimhouden, uit angst dat iemand hem voor zichzelf zou willen."',
    '"Ik wilde hem een naam geven. Maar niet de mijne. De naam van twee mensen die écht voor elkaar zorgen. Voor hun dieren. Voor hun familie. Voor elkaar."',
    `"Daarom heet deze ster vanaf vannacht: de Ster van ${names}."`,
  ],
  grauw: [
    'Achter je klinkt een bekende stem. Grauw. Zonder zijn chagrijnige gezicht, voor het eerst.',
    '"Ik ben de laatste van de Lantaarnkring. We bewaakten de ster tot de juiste mensen kwamen."',
    '"Ik moest jullie testen. Jullie gaven niet op. Niet één keer." Hij kucht. "Odile had gelijk over jullie."',
  ],
  end: (names: string) => [
    'Het plafond van de Sterrenkamer opent zich. Boven je: de echte nachthemel. En recht boven de heuvel straalt één ster feller dan alle andere.',
    `De Ster van ${names}.`,
    'Odile glimlacht en vervaagt in het sterrenlicht. "Kijk af en toe omhoog. Hij is van jullie."',
  ],
};

