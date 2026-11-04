"""
Copies and prepares the pixel art PoopyWorld uses from the LPC Revised pack
(https://github.com/ElizaWy/LPC, licensed OGA-BY 3.0 / CC-BY 3.0).

Usage:  python3 tools/build_assets.py /path/to/LPC
Output: src/assets/*.png
"""
import sys, shutil
from pathlib import Path
from PIL import Image
import numpy as np

LPC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)

def copy(src, name):
    shutil.copy(LPC / src, OUT / name)

copy('Terrain/terrain_summer.png', 'terrain.png')
copy('Terrain/trees_summer.png', 'trees.png')
copy('Terrain/plants_summer.png', 'plants.png')
copy('Terrain/flowers.png', 'flowers.png')
copy('Terrain/wildflowers_summer.png', 'wildflowers.png')
copy('Terrain/Rocks, Grasslands.png', 'rocks.png')
copy('Terrain/tilled_soil.png', 'soil.png')
copy('Structure/Fences/Plain Fence A.png', 'fence.png')
copy('Objects/Furniture/Table, Rough Wood.png', 'table.png')
copy('Objects/Furniture/Trough.png', 'trough.png')
copy('Objects/Furniture/Lighting, Outdoors.png', 'lamp.png')
copy('Objects/Furniture/Planter.png', 'planter.png')
copy('Objects/Furniture/Barrel.png', 'barrel.png')
copy('Objects/Furniture/Crate.png', 'crate.png')
copy('Objects/Small Items/Hay & Straw.png', 'hay.png')
copy('Objects/Small Items/Fire, Camp.png', 'campfire.png')
copy('Objects/Small Items/Buckets.png', 'buckets.png')
copy('Objects/Small Items/Baskets A.png', 'baskets.png')
# indoors
copy('Structure/Floor/Wood Floor A.png', 'floor_wood.png')
copy('Structure/Walls/Painted Walls.png', 'walls.png')
copy('Objects/Furniture/Seating/Sofa, Casual A.png', 'sofa.png')
copy('Objects/Furniture/Fireplace.png', 'fireplace.png')
copy('Objects/Furniture/Rugs/Swirling Vine Rug.png', 'rug.png')
copy('Objects/Furniture/Shelf.png', 'shelf.png')
copy('Objects/Furniture/TV, Widescreen.png', 'tv.png')
copy('Objects/Furniture/Countertop.png', 'counter.png')
copy('Objects/Furniture/Sink, Countertop.png', 'sink.png')
copy('Objects/Furniture/Oven, Modern.png', 'oven.png')
copy('Objects/Furniture/Fridge.png', 'fridge.png')
copy('Objects/Furniture/Lighting, Floor.png', 'floorlamp.png')
copy('Objects/Wall Items/Paintings, Landscape.png', 'paintings.png')
copy('Objects/Furniture/Clock, Grandfather.png', 'clock.png')
copy('Structure/Windows/Ornamental Windows A.png', 'window.png')
copy('Objects/Furniture/End Table.png', 'endtable.png')

# --- The house: Brick House A with the slate roof recoloured to warm terracotta ---
a = np.array(Image.open(LPC / 'Structure/Structures/Brick House A.png').convert('RGBA'))
roof_map = {
    (15, 18, 24): (46, 18, 16), (27, 25, 43): (74, 30, 26), (41, 37, 58): (104, 40, 30),
    (52, 48, 67): (138, 54, 38), (72, 65, 82): (172, 72, 48), (75, 75, 96): (186, 86, 56),
    (114, 107, 126): (214, 120, 80),
}
out = a.copy()
h, w, _ = a.shape
for y in range(h):
    for x in range(w):
        roof = (y < 103) if x < 167 else (y < 71)
        if 205 <= x <= 222 and y < 29:
            roof = False  # chimney
        k = tuple(int(v) for v in a[y, x, :3])
        if roof and a[y, x, 3] > 0 and k in roof_map:
            out[y, x, :3] = roof_map[k]
Image.fromarray(out).save(OUT / 'house.png')

# Our own villa: the same house made wider (longer roof, a second window).
strip = out[:, 104:112]
villa = np.concatenate([out[:, :112]] + [strip] * 8 + [out[:, 112:]], axis=1)
villa[104:176, 124:156] = out[104:176, 112:144]
Image.fromarray(villa).save(OUT / 'villa.png')

# Village variants of the same house: other roof colours.
import colorsys
def roof_variant(hue_shift, sat_mul, name):
    v = out.copy()
    for y in range(h):
        for x in range(w):
            roof = (y < 103) if x < 167 else (y < 71)
            if 205 <= x <= 222 and y < 29:
                roof = False
            k = tuple(int(c) for c in a[y, x, :3])
            if roof and a[y, x, 3] > 0 and k in roof_map:
                r, g, b = [c / 255 for c in roof_map[k]]
                hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
                r, g, b = colorsys.hls_to_rgb((hh + hue_shift) % 1, ll, min(1, ss * sat_mul))
                v[y, x, :3] = [int(r * 255), int(g * 255), int(b * 255)]
    Image.fromarray(v).save(OUT / name)
roof_variant(0.58, 0.9, 'house-blue.png')
roof_variant(0.30, 0.7, 'house-green.png')
roof_variant(0.78, 0.8, 'house-purple.png')

# The cottage (Paneled House A) and a blue-roofed version.
cot = np.array(Image.open(LPC / 'Structure/Structures/Paneled House A.png').convert('RGBA'))
Image.fromarray(cot).save(OUT / 'cottage.png')
cb = cot.copy()
for y in range(cot.shape[0]):
    for x in range(cot.shape[1]):
        r, g, b, al = [int(c) for c in cot[y, x]]
        if al == 0 or y > 70:
            continue
        hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if ss > 0.25 and (hh < 0.12 or hh > 0.95):
            r2, g2, b2 = colorsys.hls_to_rgb((hh + 0.56) % 1, ll, ss * 0.8)
            cb[y, x, :3] = [int(r2 * 255), int(g2 * 255), int(b2 * 255)]
Image.fromarray(cb).save(OUT / 'cottage-blue.png')
copy('Structure/Structures/Brick House B.png', 'house-b.png')

# Hollowmere Manor: the original slate-roofed house, much wider, a little darker.
slate = a.copy()
st = slate[:, 104:112]
manor = np.concatenate([slate[:, :112]] + [st] * 16 + [slate[:, 112:]], axis=1)
for x0 in (132, 186):
    manor[104:176, x0:x0 + 32] = slate[104:176, 112:144]
m = manor.astype(float)
m[:, :, :3] *= 0.82
Image.fromarray(m.astype(np.uint8)).save(OUT / 'manor.png')
copy('Objects/Wall Items/Paintings, Portraits.png', 'portraits.png')
copy('Objects/Small Items/Lighting, Table.png', 'candles.png')
copy('Objects/Furniture/Lighting, Floor.png', 'floorlights.png')
copy('Objects/Furniture/Wolf Stone.png', 'seals.png')
copy('Objects/Furniture/Stone Slab.png', 'slab.png')
copy('Objects/Furniture/Desk, Office.png', 'desk.png')
copy('Structure/Misc/Fountain A.png', 'fountain.png')

# (Characters are built by tools/build_characters.py)

print('Assets written to', OUT)
