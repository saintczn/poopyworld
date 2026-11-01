# PoopyWorld

Een privé 2D-pixelart-RPG met een eigen Hub, gemaakt voor twee spelers.

## Stand van zaken

| Mijlpaal | Wat | Status |
| --- | --- | --- |
| 1 | Rondlopen in de villatuin: lopen, botsingen, camera, dingen bekijken | Gebouwd en getest in de browser |
| 2 | Inloggen voor twee spelers, elkaar live zien bewegen, stickers | Nog niet begonnen |
| 3 | Villa binnen, Kroki's plekje, Gilly op bezoek | Nog niet begonnen |
| 4 | Samen inrichten (bouwen en decoreren) | Nog niet begonnen |
| 5 | Stukje wereld richting Heartwood | Nog niet begonnen |
| 6 | Hub v0: dashboard, check-in, vraag van de dag, brieven | Nog niet begonnen |

Alle graphics zijn nu nog tijdelijke tekeningen uit code (`src/art/placeholderArt.ts`).

## Besturing

- Lopen: WASD of pijltjestoetsen
- Bekijken / verder: E, spatie of Enter
- Tekst sluiten: Esc

## Techniek

- TypeScript + [Phaser 3](https://phaser.io) voor het spel, gebouwd met Vite.
- Inhoud (wat waar staat, alle teksten) staat los van de code in `src/content/`.

```
npm install
npm run dev           # lokaal spelen
npm run build         # versie voor hosting (map dist/)
npm run build:single  # alles in één HTML-bestand (map dist-single/)
```
