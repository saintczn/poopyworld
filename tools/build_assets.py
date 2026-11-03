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

# (Characters are built by tools/build_characters.py)

print('Assets written to', OUT)
