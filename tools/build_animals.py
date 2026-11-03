"""
Animals from the LPC farm animal sets (CC-BY 3.0 / GPL 2.0+):
- "LPC Goat" by bluecarrot16, based on "LPC Style Farm Animals" by Daniel Eddeland (daneeklu)
- chickens from "LPC Style Farm Animals" by Daniel Eddeland (daneeklu)
Makes three goat coats (white, brown, black) by recolouring the fur.

Usage: python3 tools/build_animals.py /path/to/folder/with/goat-sheet.png
"""
import sys, shutil
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets'

FUR = [(239, 233, 231), (219, 210, 202), (183, 179, 178), (130, 124, 124)]
COATS = {
    'white': None,
    'brown': [(205, 150, 100), (184, 128, 82), (150, 98, 62), (106, 68, 42)],
    'black': [(104, 98, 102), (86, 80, 84), (66, 62, 66), (44, 40, 44)],
}

goat = np.array(Image.open(SRC / 'goat-sheet.png').convert('RGBA'))
goat[1000:, 500:] = 0  # one stray pixel in the corner
rgb = goat[:, :, :3].astype(int)
mx, mn = rgb.max(axis=2), rgb.min(axis=2)
is_fur = (goat[:, :, 3] > 0) & (mx >= 110) & ((mx - mn) < 30)
dist = np.stack([np.abs(rgb - np.array(c)).sum(axis=2) for c in FUR], axis=2)
nearest = dist.argmin(axis=2)
for name, ramp in COATS.items():
    out = goat.copy()
    if ramp:
        for i, col in enumerate(ramp):
            m = is_fur & (nearest == i)
            out[m, :3] = col
    Image.fromarray(out).save(OUT / f'goat-{name}.png', optimize=True)

shutil.copy(SRC / 'chicken_walk.png', OUT / 'chicken-walk.png')
shutil.copy(SRC / 'chicken_eat.png', OUT / 'chicken-eat.png')
print('animals written')
