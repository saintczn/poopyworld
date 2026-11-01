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
        // Layered grass is painted in irregular clusters rather than evenly scattered noise.
        for (let i=0;i<7;i++) {
          const gx=x+Math.floor(r()*13), gy=y+Math.floor(r()*13);
          const tone=r();
          const col=tone<.34?'#347b32':tone<.7?'#70b94c':tone<.88?'#8bc85b':'#285f2d';
          rect(c,gx,gy,2+Math.floor(r()*3),1,col);
          if(i%2===0) rect(c,gx+1,gy-1,1,2,'#a0d36a');
          if(i%3===0) rect(c,gx,gy+1,1,2,'#285f2d');
        }
        for(let i=0;i<13;i++) {
          const gx=x+Math.floor(r()*16), gy=y+Math.floor(r()*16);
          rect(c,gx,gy,1,1,r()>.55?'#79bd51':'#3d8737');
        }
        // Tiny shadowed tufts and occasional broad leaf blades create readable texture at game scale.
        for(let i=0;i<3;i++) {
          const gx=x+2+Math.floor(r()*12), gy=y+2+Math.floor(r()*12);
          rect(c,gx,gy,1,3,'#285f2d'); rect(c,gx+1,gy+1,1,2,'#8bc85b');
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
        // Uneven packed-earth color clusters and embedded pebbles.
        for(let i=0;i<9;i++) {
          const sx=x+1+Math.floor(r()*13), sy=y+1+Math.floor(r()*13);
          const w=1+Math.floor(r()*4), h=1+Math.floor(r()*2);
          const tone=r();
          rect(c,sx,sy,w,h,tone<.35?'#a98258':tone<.7?'#d9b77f':'#e6c994');
          if(i%3===0) rect(c,sx,sy+h,w,1,'#896342');
        }
        for(let i=0;i<4;i++) {
          const sx=x+Math.floor(r()*15), sy=y+Math.floor(r()*15);
          rect(c,sx,sy,1,1,'#76543a');
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

  texture(scene,'tree',48,64,c=>{
    // Soft oval shadow and a branching, bark-textured trunk.
    rect(c,7,57,34,4,'rgba(24,47,27,0.30)');
    rect(c,20,39,9,20,'#704329'); rect(c,24,40,3,18,'#4e3022');
    rect(c,16,48,5,3,'#805334'); rect(c,28,45,5,3,'#805334');
    rect(c,14,56,21,3,'#4e3022');
    // Overlapping canopy lobes with dark undersides and broken highlights.
    leafCluster(c,24,23,18,18,112); leafCluster(c,12,29,11,12,121);
    leafCluster(c,36,29,11,12,131); leafCluster(c,24,12,12,11,141);
    leafCluster(c,8,22,7,8,151); leafCluster(c,40,23,7,8,161);
    for(const [x,y] of [[11,14],[22,7],[34,12],[39,24],[7,29],[17,32],[29,27],[35,35],[18,18],[27,15]]) {
      rect(c,x,y,2,2,'#91ce61'); rect(c,x+1,y+2,1,1,'#b4df78');
    }
    rect(c,15,23,3,2,'#d4e98a'); rect(c,31,19,3,2,'#d4e98a');
    rect(c,23,34,4,2,'#20592d'); rect(c,37,31,3,2,'#20592d');
  });
  texture(scene,'bush',24,18,c=>{
    leafCluster(c,8,11,7,6,9); leafCluster(c,16,10,7,7,19); leafCluster(c,12,6,7,5,29);
    for(const [x,y,col] of [[5,8,'#e78bc1'],[17,6,'#f3d16e'],[13,12,'#f0a0cb']] as [number,number,string][]) {
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
    for(let row=0;row<10;row++) {
      const inset=(9-row)*10;
      const rx=10+inset, ry=1+row*7, rw=204-inset*2;
      rect(c,rx,ry,rw,8,row%2?'#a63c28':'#bd4b2e');
      rect(c,rx,ry,rw,2,'#e47a4d');
      // Alternating offset shingle seams, each with a dark lower edge.
      for(let sx=rx+((row%2)*7)+5;sx<rx+rw-4;sx+=14) {
        rect(c,sx,ry+2,1,5,'#7b2b21');
        rect(c,sx+1,ry+6,5,1,'#8e3324');
      }
      rect(c,rx+2,ry+3,Math.max(2,rw-4),1,'#cb5938');
    }
    // Heavy carved eaves and a visible ridge cap.
    rect(c,4,67,216,10,'#70291f'); rect(c,6,67,212,2,'#e06a42');
    rect(c,107,0,10,8,'#e47a4d'); rect(c,109,0,6,7,'#f08a59');
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
  // Additional hand-pixeled props: layered silhouettes, highlights and cast shadows.
  texture(scene,'flower-cluster',32,30,c=>{
    rect(c,3,26,26,2,'#285d2d');
    const stem=(x:number,h:number)=>{rect(c,x,25-h,2,h,'#34743a');rect(c,x+1,25-h,1,h-2,'#75a84b');};
    stem(8,12); stem(16,17); stem(24,11);
    const bloom=(x:number,y:number,col:string)=>{
      rect(c,x-3,y-1,7,4,col);rect(c,x-1,y-4,4,8,col);
      rect(c,x-1,y-1,3,3,'#ffe39a');rect(c,x,y-2,1,1,'#fff2bd');
    };
    bloom(9,12,'#e98db3');bloom(17,7,'#f1ce6d');bloom(25,13,'#c4a0ed');
    rect(c,5,22,4,2,'#76b84b');rect(c,19,20,5,2,'#76b84b');
  });
  texture(scene,'bench-pixel',48,28,c=>{
    rect(c,5,23,38,3,'#38271f');rect(c,8,20,4,7,'#633d29');rect(c,36,20,4,7,'#633d29');
    rect(c,4,12,40,8,'#75452d');rect(c,6,13,36,5,'#c1844e');
    for(let x=9;x<42;x+=8){rect(c,x,13,1,5,'#70412b');rect(c,x+1,13,1,1,'#e0a96d');}
    rect(c,3,7,42,6,'#633b29');rect(c,5,8,38,3,'#bd8050');
    rect(c,7,5,34,2,'#e0a66b');rect(c,8,4,32,1,'#f0c18a');
    rect(c,8,19,3,4,'#e2ae70');rect(c,37,19,3,4,'#e2ae70');
  });
  texture(scene,'path-lamp',16,30,c=>{
    rect(c,7,13,3,16,'#563725');rect(c,6,26,5,3,'#a16a3d');
    rect(c,4,5,9,10,'#50352a');rect(c,5,6,7,8,'#f4c96e');
    rect(c,6,7,5,5,'#fff0b3');rect(c,3,4,11,2,'#c28a4f');
    rect(c,5,15,8,2,'#70452e');rect(c,6,2,6,2,'#70452e');
    rect(c,7,0,4,2,'#d5a05c');
  });
  texture(scene,'goat-pixel',36,32,c=>{
    rect(c,5,27,25,3,'#315c2e');
    rect(c,8,13,20,11,'#493b31');rect(c,7,11,21,11,'#f2ead9');
    rect(c,22,7,10,11,'#f2ead9');rect(c,25,9,5,6,'#e6d8c4');
    rect(c,29,12,2,2,'#4b3329');rect(c,23,4,2,6,'#9a7954');rect(c,29,4,2,6,'#9a7954');
    rect(c,30,15,4,2,'#d99b8e');rect(c,12,22,3,7,'#684c38');rect(c,23,22,3,7,'#684c38');
    rect(c,10,13,3,3,'#fffaf0');rect(c,17,12,3,2,'#fffaf0');
    rect(c,7,16,3,4,'#d9c9b4');rect(c,18,20,4,2,'#d9c9b4');
  });
  texture(scene,'planter',20,18,c=>{
    rect(c,3,8,14,8,'#a95839');rect(c,2,7,16,3,'#d58b55');
    rect(c,5,10,10,4,'#87432e');rect(c,6,4,2,5,'#3f843b');rect(c,10,1,2,8,'#4c9843');rect(c,13,5,2,4,'#34753a');
    rect(c,5,2,3,3,'#ed91b7');rect(c,9,0,4,4,'#f3d16e');rect(c,13,3,3,3,'#c49ae8');
  });

}
