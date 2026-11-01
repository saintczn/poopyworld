# PoopyWorld

Een persoonlijke 2D-wereld voor twee spelers: een plek waar jullie samen kunnen thuiskomen, rondlopen, ontdekken, dieren bezoeken, het huis inrichten en kleine dagelijkse momenten delen.

**Live testversie:** https://saintczn.github.io/poopyworld/

## De bedoeling

PoopyWorld is meer dan een losse pixelart-tuin. De tuin is alleen de eerste plek van een grotere, gedeelde wereld. De sfeer moet warm, persoonlijk, speels en knus voelen — alsof het jullie eigen kleine wereld is.

## Roadmap

| Fase | Wat hoort erbij | Status |
| --- | --- | --- |
| 1. Eerste tuin | Rondlopen, camera, botsingen en plekjes bekijken | Eerste speelbare prototype |
| 2. Samen online | Twee spelers kunnen inloggen, elkaar live zien bewegen en stickers gebruiken | Nog te bouwen |
| 3. Jullie villa | Naar binnen, Kroki's plekje en Gilly op bezoek | Nog te bouwen |
| 4. Samen inrichten | Meubels plaatsen, bouwen en decoreren | Nog te bouwen |
| 5. Heartwood | De wereld uitbreiden met een route en dorp | Nog te bouwen |
| 6. Jullie Hub | Dashboard, check-in, vraag van de dag en brieven | Nog te bouwen |

## Huidige prototype

De tuin bevat alvast herkenningspunten die bij jullie wereld horen: de villa met Nederlandse en Nigeriaanse vlag, Kroki's plekje, de buitenkeuken, vijver, moestuin, geitenwei en de weg richting Heartwood. De huidige graphics zijn nog prototype-art en vormen nadrukkelijk niet de definitieve visuele stijl.

## Besturing

- Lopen: WASD of pijltjestoetsen
- Bekijken / verder: E, spatie of Enter
- Tekst sluiten: Esc

## Techniek

- TypeScript + Phaser 3 voor het spel, gebouwd met Vite.
- Inhoud (wat waar staat en de teksten) staat los van de code in `src/content/`.
- De huidige GitHub Pages-versie is een single-player prototype. Er is nog geen accountsysteem, gedeelde wereld of realtime multiplayer.

```bash
npm install
npm run dev           # lokaal spelen
npm run build         # versie voor hosting (map dist/)
npm run build:single  # alles in één HTML-bestand (map dist-single/)
```
