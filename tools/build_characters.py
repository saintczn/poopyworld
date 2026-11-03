"""
Builds the character-creator layers from LPC Revised.
Each layer = one PNG (Walk 512x256 + Idle 192x256 side by side = 704x256) in its
neutral base colours, plus palettes.json that maps base colours to every named colour.

Usage: python3 tools/build_characters.py /path/to/LPC
"""
import sys, json
from pathlib import Path
from PIL import Image
import numpy as np

LPC = Path(sys.argv[1]) / 'Characters'
OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets' / 'chars'
OUT.mkdir(parents=True, exist_ok=True)
for f in OUT.glob('*.png'):
    f.unlink()

def rgb(a):
    return tuple(int(v) for v in a)

def pal_map(base_png, var_png):
    a = np.array(Image.open(base_png).convert('RGBA'))
    b = np.array(Image.open(var_png).convert('RGBA'))
    m = {}
    mask = a[:, :, 3] > 0
    for x, y in zip(a[mask][:, :3], b[mask][:, :3]):
        m[rgb(x)] = rgb(y)
    return m

def hexs(c):
    return '%02x%02x%02x' % c

def palettes(folder, base_name='Walk.png', only=None):
    base = folder / base_name
    out = {}
    for d in sorted(p for p in folder.iterdir() if p.is_dir() and not p.name.startswith('_')):
        if only and d.name not in only:
            continue
        v = d / base_name
        if v.exists():
            m = pal_map(base, v)
            out[d.name] = {hexs(k): hexs(val) for k, val in m.items() if k != val}
    return out

HAIR_COLOURS = ['Raven', 'Black', 'Charcoal', 'Chestnut', 'Brown', 'Ash Brown', 'Red', 'Ruby', 'Orange', 'Blonde',
                'Platinum', 'White', 'Gray', 'Pink', 'Purple', 'Violet', 'Blue', 'Teal', 'Green']
SKINS = ['Porcelain', 'Ivory', 'Peach', 'Tan', 'Honey', 'Bronze', 'Tawny', 'Brown', 'Coffee']
CLOTH = ['White', 'Linen', 'Gray', 'Charcoal', 'Black', 'Red', 'Wine', 'Coral', 'Pink', 'Orange', 'Mustard', 'Lemon',
         'Mint', 'Green', 'Forest', 'Sky', 'Cerulean', 'Denim', 'Navy', 'Lavender', 'Purple', 'Tan', 'Brown', 'Leather']

pal = {
    'hair': palettes(LPC / 'Hair/Short 05 - Natural', only=HAIR_COLOURS),
    'skin': palettes(LPC / 'Body/Body 01 - Feminine, Thin', only=SKINS),
    'eyes': palettes(LPC / 'Head/Head Overlay - Eyes'),
    'cloth': palettes(LPC / 'Clothing/Feminine, Thin/Torso/Shirt 04 - T-shirt', only=CLOTH),
    'shoes': palettes(LPC / 'Clothing/Feminine, Thin/Feet/Shoes 01 - Shoes', only=CLOTH),
}
# Heads share the body's skin ramp but have a few extra shades; merge them in.
head_skin = palettes(LPC / 'Head/Head 01 - Feminine', only=SKINS)
for name, m in head_skin.items():
    for k, v in m.items():
        pal['skin'][name].setdefault(k, v)
pal['order'] = {'hair': HAIR_COLOURS, 'skin': SKINS, 'cloth': CLOTH}

def sheet(folder, out_name, recolour=None):
    walk = Image.open(folder / 'Walk.png').convert('RGBA')
    idle = Image.open(folder / 'Idle.png').convert('RGBA')
    img = Image.new('RGBA', (704, 256), (0, 0, 0, 0))
    img.paste(walk, (0, 0))
    img.paste(idle, (512, 0))
    if recolour:
        a = np.array(img)
        for src, dst in recolour.items():
            m = np.all(a[:, :, :3] == src, axis=2) & (a[:, :, 3] > 0)
            a[m, :3] = dst
        img = Image.fromarray(a)
    img.save(OUT / f'{out_name}.png', optimize=True)

layers = {
    'body-f': 'Body/Body 01 - Feminine, Thin', 'body-m': 'Body/Body 02 - Masculine, Thin',
    'head-f': 'Head/Head 01 - Feminine', 'head-m': 'Head/Head 02 - Masculine',
    'eyes': 'Head/Head Overlay - Eyes',
    'brows-thin': 'Hair/Eyebrows 01 - Thin Eyebrows', 'brows-thick': 'Hair/Eyebrows 02 - Thick Eyebrows',
    'beard-trimmed': 'Hair/Facial Hair 06 - Trimmed Beard', 'beard-full': 'Hair/Facial Hair 07 - Medium Beard',
    'beard-mustache': 'Hair/Facial Hair 01 - Walrus Mustache',
}
hair = {
    'buzzcut': 'Short 01 - Buzzcut', 'parted': 'Short 02 - Parted', 'short-curly': 'Short 03 - Curly',
    'cowlick': 'Short 04 - Cowlick', 'natural': 'Short 05 - Natural', 'flattop': 'Short 07 - Flat Top',
    'flattop-fade': 'Short 08 - Flat Top, Fade', 'page': 'Medium 01 - Page', 'curly': 'Medium 02 - Curly',
    'idol': 'Medium 03 - Idol', 'bun': 'Medium 04 - Bangs & Bun', 'cornrows': 'Medium 05 - Cornrows',
    'dreads': 'Medium 06 - Dreadlocks', 'bob-side': 'Medium 07 - Bob, Side Part', 'bob-bangs': 'Medium 08 - Bob, Bangs',
    'twists': 'Medium 09 - Twists', 'twists-fade': 'Medium 10 - Twists, Fade',
}
for k, v in hair.items():
    layers[f'hair-{k}'] = f'Hair/{v}'
for g, gk in [('Feminine, Thin', 'f'), ('Masculine, Thin', 'm')]:
    for k, v in {
        'shirt-longsleeve': 'Torso/Shirt 01 - Longsleeve Shirt', 'shirt-tee': 'Torso/Shirt 04 - T-shirt',
        'shirt-vneck': 'Torso/Shirt 05 - V-neck T-shirt', 'shirt-scoop': 'Torso/Shirt 06 - Scoop T-shirt',
        'shirt-buttoned': 'Torso/Shirt 08 - Buttoned T-shirt', 'shirt-polo': 'Torso/Shirt 09 - Polo',
        'legs-pants': 'Legs/Pants 03 - Pants', 'legs-cuffed': 'Legs/Pants 04 - Cuffed Pants',
        'legs-overalls': 'Legs/Pants 05 - Overalls', 'legs-shorts': 'Legs/Shorts 01 - Shorts',
        'legs-leggings': 'Legs/Pants 02 - Leggings', 'feet-shoes': 'Feet/Shoes 01 - Shoes', 'feet-boots': 'Feet/Shoes 02 - Boots',
    }.items():
        layers[f'{k}-{gk}'] = f'Clothing/{g}/{v}'

for name, rel in layers.items():
    sheet(LPC / rel, name)

# Long hair that hangs behind the body: only coloured versions exist, so turn Ash Brown back into the base colours.
ash = pal['hair']['Ash Brown']
inverse = {tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)): tuple(int(k[i:i + 2], 16) for i in (0, 2, 4)) for k, v in ash.items()}
for k in ['page', 'curly']:
    sheet(LPC / f'Hair/{hair[k]}/_Behind/Ash Brown', f'hairback-{k}', recolour=inverse)

(OUT.parent / 'palettes.json').write_text(json.dumps(pal, separators=(',', ':')))
total = sum(f.stat().st_size for f in OUT.glob('*.png'))
print(f'{len(list(OUT.glob("*.png")))} layers, {total // 1024} KB, palettes: ' +
      ', '.join(f'{k}={len(v)}' for k, v in pal.items() if k != 'order'))
