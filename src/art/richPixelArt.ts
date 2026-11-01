import Phaser from 'phaser';
import { TILE } from '../config';
import { Ground, MAP_WIDTH, MAP_HEIGHT, groundAreas, groundExceptions } from '../content/villaGarden';

type Ctx = CanvasRenderingContext2D;
const palette = {
  grass: '#4f9b3d', grassLight: '#70b94c', grassDark: '#347b32', grassDeep: '#285f2d',
  path: '#bd9866', pathLight: '#dfbd86', pathDark: '#896342', stone: '#d5b17c',
  water: '#398fc0', waterLight: '#72c6dc', waterDark: '#246c9c',
  wood: '#98532e', woodLight: '#c17a42', woodDark: '#63351f',
  roof: '#a83e26', roofLight: '#d45b35', roofDark: '#70291f',
  wall: '#d8a06a', wallLight: '#f0c18a', wallDark: '#75412e',
  timber: '#382b29', glass: '#8bc6e4', glassLight: '#d8f0f8', glassDark: '#416e91',
  leaf: '#347d35', leafLight: '#69b849', leafDark: '#20592d',
};

function rand(seed: number) {
  let n = seed >>> 0;
  return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
}
function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function texture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, w, h);
  if (!t) throw new Error('Pixel-art texture kon niet worden aangemaakt: ' + key);
  const c = t.getContext(); c.imageSmoothingEnabled = false; draw(c); t.refresh();
}
function leafCluster(c: Ctx, x: number, y: number, rx: number, ry: number, seed: number) {
  const r = rand(seed);
  for (let py = -ry; py <= ry; py++) for (let px = -rx; px <= rx; px++) {
    const d = (px * px) / (rx * rx) + (py * py) / (ry * ry);
    if (d > 1) continue;
    let col = palette.leaf;
    if (py + px < -ry * .35) col = palette.leafLight;
    if (py > ry * .48 || d > .84) col = palette.leafDark;
    if (r() < .09) col = palette.leafLight;
    rect(c, x + px, y + py, 1, 1, col);
  }
}

/** Replaces the blocky prototype textures with a consistent, warm, hand-pixeled garden set. */
export function buildRichPixelArt(scene: Phaser.Scene) {
  const grid: Ground[][] = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(Ground.Grass));
  for (const a of groundAreas) for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) grid[y][x] = a.type;
  for (const e of groundExceptions) grid[e.y][e.x] = e.type;
  const at = (x: number, y: number) => x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT ? Ground.Grass : grid[y][x];

  texture(scene, 'ground', MAP_WIDTH * TILE, MAP_HEIGHT * TILE, c => {
    const r = rand(481);
    for (let ty = 0; ty < MAP_HEIGHT; ty++) for (let tx = 0; tx < MAP_WIDTH; tx++) {
      const x = tx * TILE, y = ty * TILE, type = grid[ty][tx];
      if (type === Ground.Grass || type === Ground.Flowers) {
        rect(c,x,y,TILE,TILE,palette.grass);
        for (let i=0;i<18;i++) {
          const gx=x+Math.floor(r()*16), gy=y+Math.floor(r()*16);
          rect(c,gx,gy,1,1,r()>.48?palette.grassLight:palette.grassDark);
          if (i%5===0) rect(c,gx+1,gy,1,2,palette.grassDeep);
        }
        if (type === Ground.Flowers) for(let i=0;i<11;i++) {
          const fx=x+2+Math.floor(r()*12), fy=y+2+Math.floor(r()*12);
          const colors=['#e78bc1','#f6d46d','#f2e9d6','#b78de2'];
          const col=colors[Math.floor(r()*colors.length)];
          rect(c,fx,fy+2,1,3,palette.leafDark);
          rect(c,fx-1,fy,3,2,col); rect(c,fx,fy-1,1,4,col); rect(c,fx,fy,1,1,'#ffe49a');
        }
      } else if (type === Ground.Path) {
        rect(c,x,y,16,16,palette.path);
        for(let i=0;i<5;i++) {
          const sx=x+1+Math.floor(r()*11), sy=y+1+Math.floor(r()*11);
          rect(c,sx,sy,3+Math.floor(r()*3),2,palette.pathLight);
          rect(c,sx,sy+2,3,1,palette.pathDark);
        }
        if(at(tx,ty-1)!==Ground.Path) rect(c,x,y,16,2,palette.pathDark);
        if(at(tx,ty+1)!==Ground.Path) rect(c,x,y+14,16,2,palette.pathDark);
        if(at(tx-1,ty)!==Ground.Path) rect(c,x,y,2,16,palette.pathDark);
        if(at(tx+1,ty)!==Ground.Path) rect(c,x+14,y,2,16,palette.pathDark);
      } else if (type === Ground.Water) {
        rect(c,x,y,16,16,palette.water);
        for(let i=0;i<8;i++) {
          const wx=x+Math.floor(r()*15), wy=y+Math.floor(r()*15);
          rect(c,wx,wy,2+Math.floor(r()*4),1,i%2?palette.waterLight:palette.waterDark);
        }
        if(at(tx,ty-1)!==Ground.Water) rect(c,x,y,16,3,palette.waterDark);
        if(at(tx,ty+1)!==Ground.Water) rect(c,x,y+14,16,2,palette.waterDark);
        if(at(tx-1,ty)!==Ground.Water) rect(c,x,y,2,16,palette.waterDark);
        if(at(tx+1,ty)!==Ground.Water) rect(c,x+14,y,2,16,palette.waterDark);
      } else {
        rect(c,x,y,16,16,'#805638');
        for(let row=2;row<16;row+=4) {
          rect(c,x+1,y+row,14,1,'#633e2a');
          rect(c,x+3,y+row-1,1,2,'#a8784c');
          rect(c,x+8,y+row+1,1,2,'#9b6b43');
        }
      }
    }
  });

  texture(scene,'tree',40,56,c=>{
    rect(c,18,34,7,19,'#704329'); rect(c,22,35,3,17,'#4e3022');
    rect(c,13,49,17,4,'#4e3022');
    leafCluster(c,20,18,15,15,12); leafCluster(c,10,24,9,10,21);
    leafCluster(c,30,25,9,10,31); leafCluster(c,20,10,10,9,41);
    for(const [x,y] of [[12,13],[25,8],[31,21],[8,25],[21,28],[28,15]]) {
      rect(c,x,y,2,2,'#91ce61'); rect(c,x+1,y+2,1,1,'#b4df78');
    }
    rect(c,16,20,2,1,'#d4e98a'); rect(c,29,28,2,1,'#d4e98a');
  });
  texture(scene,'bush',24,18,c=>{
    leafCluster(c,8,11,7,6,9); leafCluster(c,16,10,7,7,19); leafCluster(c,12,6,7,5,29);
    for(const [x,y,col] of [[5,8,'#e78bc1'],[17,6,'#f3d16e'],[13,12,'#f0a0cb']]) {
      rect(c,x,y,2,2,col); rect(c,x+1,y-1,1,1,'#fff0c6');
    }
  });
  texture(scene,'fence-h',16,16,c=>{
    rect(c,0,5,16,3,'#c68b53'); rect(c,0,8,16,1,'#70452b');
    rect(c,0,11,16,3,'#b87945'); rect(c,0,14,16,1,'#70452b');
    for(const x of [2,11]) { rect(c,x,2,3,14,'#9c6037'); rect(c,x,2,3,2,'#e0aa6d'); rect(c,x+2,4,1,11,'#70452b'); }
    rect(c,5,6,2,1,'#e4b77e'); rect(c,13,12,2,1,'#e4b77e');
  });
  texture(scene,'fence-v',16,16,c=>{
    rect(c,6,0,4,16,'#b87945'); rect(c,6,0,2,16,'#e0aa6d'); rect(c,10,0,1,16,'#70452b');
    rect(c,4,3,8,3,'#c68b53'); rect(c,4,11,8,3,'#c68b53');
  });

  // A warm timber-framed cottage with a steep terracotta roof and a deep wooden porch.
  texture(scene,'villa',224,144,c=>{
    rect(c,4,132,216,10,'#33251f');
    // upper wall and dark timber frame
    rect(c,25,26,174,49,'#3a302d'); rect(c,31,31,162,44,'#b96d45');
    for(let x=35;x<192;x+=12) rect(c,x,32,2,42,'#70402e');
    for(let y=38;y<72;y+=10) rect(c,31,y,162,2,'#8e4d35');
    // roof slopes, layered shingle rows
    for(let row=0;row<8;row++) {
      const inset=row*10;
      rect(c,10+inset,4+row*8,204-inset*2,9,row%2?'#a63c28':'#bd4b2e');
      rect(c,10+inset,4+row*8,204-inset*2,2,'#dc6840');
      for(let sx=15+inset;sx<209-inset;sx+=15) rect(c,sx,7+row*8,2,5,'#873021');
    }
    rect(c,5,68,214,8,'#70291f'); rect(c,7,68,210,2,'#e06a42');
    // ground floor walls
    rect(c,15,76,194,60,'#54352c'); rect(c,20,80,184,53,'#d69b65');
    for(let x=24;x<200;x+=8) rect(c,x,81,1,51,'#c18154');
    // windows, dark frames, bright glass, crossbars and flower boxes
    const window=(x:number,y:number,w:number,h:number)=>{
      rect(c,x-3,y-3,w+6,h+6,'#372826'); rect(c,x-1,y-1,w+2,h+2,'#8e4b31');
      rect(c,x,y,w,h,'#78b6d8'); rect(c,x+2,y+2,w-4,3,'#d6eff7');
      rect(c,x+Math.floor(w/2)-1,y,2,h,'#49332c'); rect(c,x,y+Math.floor(h/2),w,2,'#49332c');
      rect(c,x+1,y+h-3,w-2,2,'#416f91');
      rect(c,x-4,y+h+3,w+8,3,'#70402b'); rect(c,x-3,y+h+1,w+6,2,'#d78a51');
    };
    window(35,91,39,27); window(150,91,39,27);
    // upper windows
    window(57,42,29,22); window(130,42,29,22);
    // front door and porch
    rect(c,91,82,43,54,'#3a2925'); rect(c,96,86,33,50,'#a65336');
    rect(c,100,91,25,39,'#c17a4b');
    for(let y=94;y<130;y+=8) rect(c,101,y,23,1,'#81432e');
    rect(c,103,91,19,15,'#7fb8d6'); rect(c,105,93,7,4,'#d9f0f7');
    rect(c,121,111,3,3,'#f5d27b');
    // porch planks and steps
    rect(c,9,133,206,4,'#6c402a'); rect(c,13,125,198,8,'#a7663e');
    for(let x=16;x<210;x+=13) rect(c,x,126,1,7,'#75452e');
    rect(c,10,124,204,2,'#d18a51');
    // gable accents and chimney
    rect(c,188,3,12,23,'#873322'); rect(c,186,1,16,4,'#d36b43');
    rect(c,24,27,4,47,'#332725'); rect(c,196,27,4,47,'#332725');
  });
}
