"""
Hand-made pixel art for Bali, drawn by code in the LPC style (dark outline, 3-4 tone shading,
light from the top left). Also builds the world map.

Usage:  python3 tools/build_bali.py /path/to/LPC
Output: src/assets/bali-*.png, src/assets/worldmap.png
"""
import sys, math, random
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

LPC = Path(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets'

def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

OUTLINE = hexc('#2a1a14')

def outline(img, colour=OUTLINE):
    """Adds a 1px dark outline around everything that is not transparent."""
    a = np.array(img)
    alpha = a[:, :, 3] > 0
    grow = np.zeros_like(alpha)
    grow[1:, :] |= alpha[:-1, :]; grow[:-1, :] |= alpha[1:, :]
    grow[:, 1:] |= alpha[:, :-1]; grow[:, :-1] |= alpha[:, 1:]
    edge = grow & ~alpha
    a[edge] = colour
    return Image.fromarray(a)

def noise_fill(d, box, colours, rnd, density=1.0):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if rnd.random() < density:
                d.point((x, y), fill=rnd.choice(colours))

# ---------------------------------------------------------------- palm tree
def palm(seed, h=118, lean=14):
    rnd = random.Random(seed)
    W, H = 120, h + 40
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base_x, base_y = W // 2, H - 2
    top_y = H - h
    # trunk: a gentle curve, made of rings
    pts = []
    for i in range(h - 18):
        t = i / (h - 18)
        x = base_x + lean * (t ** 1.6) * (1 if seed % 2 else -1)
        pts.append((x, base_y - i))
    for i, (x, y) in enumerate(pts):
        t = i / len(pts)
        w = 6 - int(2 * t)
        ring = (i % 6) in (0, 1)
        dark, mid, light = ('#5a3c24', '#7a5634', '#9c7448') if not ring else ('#4a301c', '#654428', '#81603c')
        xi = int(round(x))
        d.line([(xi - w, y), (xi + w, y)], fill=hexc(mid))
        d.line([(xi - w, y), (xi - w + 2, y)], fill=hexc(light))
        d.line([(xi + w - 2, y), (xi + w, y)], fill=hexc(dark))
    crown = (int(round(pts[-1][0])), pts[-1][1])
    # coconuts
    for dx, dy in [(-4, 4), (3, 5), (0, 8)]:
        cx, cy = crown[0] + dx, crown[1] + dy
        d.ellipse([cx - 4, cy - 4, cx + 3, cy + 3], fill=hexc('#6b4a26'))
        d.point((cx - 2, cy - 2), fill=hexc('#a77c45'))
    # fronds: tapered leaves with serrated edges, drawn back to front
    angles = [200, 160, 235, 125, 265, 95, 310, 50, 345, 15]
    for k, ang in enumerate(angles):
        a = math.radians(ang + rnd.uniform(-8, 8))
        length = rnd.uniform(40, 52)
        droop = rnd.uniform(0.9, 1.4)
        back = k < 4
        cols = ('#2c5e26', '#3c7a30', '#4f9438') if back else ('#33702b', '#4f9a3a', '#7cc450')
        spine = []
        for s in range(int(length)):
            t = s / length
            x = crown[0] + math.cos(a) * s
            y = crown[1] - 4 + math.sin(a) * s * 0.55 - 12 * math.sin(t * math.pi * 0.9) + droop * 22 * t * t
            spine.append((x, y))
        for s, (x, y) in enumerate(spine):
            t = s / len(spine)
            width = 7 * math.sin(min(1, t * 1.3) * math.pi * 0.95) + 1
            nx, ny = -math.sin(a), math.cos(a) * 0.6
            # leaflets
            for side in (-1, 1):
                L = width + rnd.uniform(-1, 1.5)
                ex, ey = x + side * nx * L, y + side * abs(ny) * L * 0.4 + L * 0.55
                col = cols[2] if side < 0 else cols[1]
                d.line([(x, y), (ex, ey)], fill=hexc(col))
                if s % 3 == 0: d.point((int(ex), int(ey)), fill=hexc(cols[0]))
        for x, y in spine:
            d.point((int(x), int(y)), fill=hexc(cols[0]))
    img = outline(img)
    return img

# ---------------------------------------------------------------- thatch roof helper
def thatch(d, poly, rnd, top=('#c99a52', '#b5853f', '#9a6c2e', '#7b5322'), streak_len=6):
    """Fills a polygon with an alang-alang thatch texture (vertical straw streaks)."""
    mask = Image.new('L', d.im.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    m = np.array(mask) > 0
    ys, xs = np.nonzero(m)
    y0, y1 = ys.min(), ys.max()
    for y, x in zip(ys, xs):
        t = (y - y0) / max(1, y1 - y0)
        base = 0 if t < 0.25 else 1 if t < 0.6 else 2
        v = (x * 7 + (y // streak_len) * 13 + rnd.randint(0, 2)) % 9
        idx = base + (1 if v < 3 else 0)
        if v == 8: idx = max(0, base - 1)
        d.point((int(x), int(y)), fill=hexc(top[min(3, idx)]))

def fringe(d, x0, x1, y, rnd, cols=('#9a6c2e', '#7b5322', '#c99a52')):
    """The ragged straw edge under a thatch roof."""
    for x in range(x0, x1):
        L = rnd.randint(2, 5)
        d.line([(x, y), (x, y + L)], fill=hexc(cols[0] if x % 3 else cols[1]))
        if rnd.random() < 0.3: d.point((x, y), fill=hexc(cols[2]))

# ---------------------------------------------------------------- warung
def warung():
    rnd = random.Random(7)
    W, H = 208, 176
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # back wall of woven bamboo
    d.rectangle([20, 70, 187, 140], fill=hexc('#d9b77a'))
    for y in range(70, 141):
        for x in range(20, 188):
            if (x // 4 + y // 4) % 2 == 0 and (x + y) % 4 == 0: d.point((x, y), fill=hexc('#b8935a'))
            elif (x // 4 + y // 4) % 2 == 1 and (x - y) % 4 == 0: d.point((x, y), fill=hexc('#c4a066'))
    # shelf with bottles and jars on the back wall
    d.rectangle([40, 96, 120, 99], fill=hexc('#7a5230'))
    for i, c in enumerate(['#e8c040', '#c0392b', '#6ab04c', '#f0e6d0', '#e67e22', '#c0392b']):
        x = 44 + i * 12
        d.rectangle([x, 84, x + 5, 95], fill=hexc(c)); d.rectangle([x + 1, 81, x + 4, 83], fill=hexc('#3a2a20'))
        d.point((x + 1, 86), fill=hexc('#ffffff', 180))
    # fryer at the back right, steaming
    d.rectangle([140, 104, 176, 128], fill=hexc('#9aa3ad')); d.rectangle([140, 104, 176, 107], fill=hexc('#c9d0d6'))
    d.rectangle([146, 108, 170, 112], fill=hexc('#d79a3a'))
    # menu board
    d.rectangle([130, 76, 182, 98], fill=hexc('#2e3b33')); d.rectangle([130, 76, 182, 77], fill=hexc('#7a5230'))
    for i in range(4):
        d.line([(134, 81 + i * 4), (134 + rnd.randint(22, 42), 81 + i * 4)], fill=hexc('#e9e3d0'))
    # posts
    for x in (16, 100, 186):
        d.rectangle([x, 62, x + 5, 150], fill=hexc('#a8844c'))
        d.line([(x, 62), (x, 150)], fill=hexc('#d0ac6c'))
        d.line([(x + 5, 62), (x + 5, 150)], fill=hexc('#7a5a30'))
        for y in range(70, 150, 14): d.line([(x, y), (x + 5, y)], fill=hexc('#6a4c26'))
    # counter (front) with plank face
    d.rectangle([10, 128, 197, 134], fill=hexc('#b07a48'))
    d.line([(10, 128), (197, 128)], fill=hexc('#d39c64'))
    d.rectangle([12, 135, 195, 166], fill=hexc('#8a5a34'))
    for y in range(140, 166, 7): d.line([(12, y), (195, y)], fill=hexc('#6e4628'))
    for x in range(12, 196, 23): d.line([(x, 135), (x, 166)], fill=hexc('#6e4628'))
    d.line([(12, 135), (195, 135)], fill=hexc('#5a3820'))
    # bitterballen on plates on the counter
    for px in (38, 70, 120):
        d.ellipse([px - 10, 122, px + 10, 129], fill=hexc('#f4f1ea')); d.ellipse([px - 8, 123, px + 8, 128], fill=hexc('#ddd8cc'))
        for bx, by in [(-4, 121), (1, 120), (5, 122), (-1, 123)]:
            d.ellipse([px + bx - 3, by - 3, px + bx + 2, by + 2], fill=hexc('#9a5a22'))
            d.point((px + bx - 1, by - 2), fill=hexc('#d08a42'))
        d.ellipse([px + 6, 124, px + 9, 127], fill=hexc('#e8c030'))  # mustard
    # roof: big hipped thatch, overhanging
    roof = [(0, 72), (24, 8), (184, 8), (208, 72)]
    thatch(d, roof, rnd)
    d.polygon([(24, 8), (184, 8), (176, 2), (32, 2)], fill=hexc('#7b5322'))
    fringe(d, 0, 208, 70, rnd)
    # ridge line
    d.line([(32, 2), (176, 2)], fill=hexc('#5a3a18'))
    img = outline(img)
    return img

# ---------------------------------------------------------------- Casa Umalas
def casa():
    rnd = random.Random(11)
    W, H = 336, 232
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    wall, wall_l, wall_d = hexc('#efe6d6'), hexc('#fbf6ec'), hexc('#d6c9b2')
    teak, teak_l, teak_d = hexc('#6b4226'), hexc('#8c5a36'), hexc('#4a2c18')
    stone, stone_d = hexc('#8e8a80'), hexc('#6c685f')
    # stone plinth
    d.rectangle([14, 196, 322, 222], fill=stone)
    for y in range(198, 222, 6):
        off = 0 if (y // 6) % 2 else 9
        for x in range(14 + off, 322, 18): d.line([(x, y), (x, y + 5)], fill=stone_d)
        d.line([(14, y), (322, y)], fill=stone_d)
    # steps in the middle
    for i in range(3):
        d.rectangle([140 - i * 6, 210 + i * 5, 196 + i * 6, 214 + i * 5], fill=hexc('#a7a296'))
        d.line([(140 - i * 6, 210 + i * 5), (196 + i * 6, 210 + i * 5)], fill=hexc('#c4bfb2'))
    # walls
    d.rectangle([24, 104, 312, 197], fill=wall)
    d.line([(24, 104), (24, 197)], fill=wall_l)
    for _ in range(260):
        x, y = rnd.randint(25, 311), rnd.randint(105, 196)
        d.point((x, y), fill=wall_d if rnd.random() < 0.5 else wall_l)
    # teak columns and beam
    d.rectangle([24, 100, 312, 106], fill=teak)
    d.line([(24, 100), (312, 100)], fill=teak_l)
    for x in (24, 112, 216, 304):
        d.rectangle([x, 104, x + 8, 197], fill=teak)
        d.line([(x, 104), (x, 197)], fill=teak_l); d.line([(x + 8, 104), (x + 8, 197)], fill=teak_d)
    # big glass doors in the middle (slightly open), blue reflections
    gx0, gx1 = 128, 208
    d.rectangle([gx0, 116, gx1, 196], fill=teak_d)
    for i, x in enumerate(range(gx0 + 3, gx1, 20)):
        d.rectangle([x, 119, x + 16, 196], fill=hexc('#7fb5c9'))
        d.polygon([(x + 2, 196), (x + 10, 119), (x + 14, 119), (x + 6, 196)], fill=hexc('#b5e0ec'))
        d.line([(x, 119), (x + 16, 119)], fill=teak)
    d.rectangle([gx0 + 30, 140, gx0 + 50, 196], fill=hexc('#3a2a20'))  # open door: dark inside
    d.rectangle([gx0 + 32, 150, gx0 + 48, 196], fill=hexc('#5a4030'))
    # side windows with teak shutters
    for wx in (48, 248):
        d.rectangle([wx, 122, wx + 40, 170], fill=teak_d)
        d.rectangle([wx + 3, 125, wx + 37, 167], fill=hexc('#7fb5c9'))
        d.polygon([(wx + 6, 167), (wx + 20, 125), (wx + 26, 125), (wx + 12, 167)], fill=hexc('#b5e0ec'))
        d.line([(wx + 20, 125), (wx + 20, 167)], fill=teak)
        for side, sx in ((-1, wx - 12), (1, wx + 41)):
            d.rectangle([sx, 120, sx + 10, 172], fill=teak)
            for y in range(123, 171, 4): d.line([(sx + 1, y), (sx + 9, y)], fill=teak_l)
    # carved wooden name plate
    d.rectangle([140, 104, 196, 114], fill=hexc('#c99a52'))
    # lower roof (wide, gentle) in dark thatch
    lower = [(0, 108), (36, 60), (300, 60), (336, 108)]
    thatch(d, lower, rnd, top=('#a87a3c', '#8f6530', '#755024', '#5c3d1a'))
    fringe(d, 0, 336, 106, rnd, cols=('#755024', '#5c3d1a', '#a87a3c'))
    # upper roof: steep joglo peak
    upper = [(70, 64), (128, 4), (208, 4), (266, 64)]
    thatch(d, upper, rnd, top=('#c99a52', '#b5853f', '#9a6c2e', '#7b5322'))
    fringe(d, 72, 264, 62, rnd)
    d.rectangle([124, 0, 212, 4], fill=hexc('#4a2c18'))
    d.rectangle([164, -2, 172, 0], fill=hexc('#4a2c18'))
    img = outline(img)
    return img

# ---------------------------------------------------------------- candi bentar (split gate)
def gate():
    W, H = 144, 128
    half = Image.new('RGBA', (56, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(half)
    rnd = random.Random(3)
    tiers = [(0, 96, 56, 128), (4, 70, 54, 96), (8, 48, 52, 70), (12, 30, 50, 48), (16, 16, 48, 30), (22, 6, 46, 16), (28, 0, 42, 6)]
    for x0, y0, x1, y1 in tiers:
        d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=hexc('#7d7466'))
        d.rectangle([x0, y0, x1 - 1, y0 + 1], fill=hexc('#a39a88'))
        d.rectangle([x1 - 4, y0, x1 - 1, y1 - 1], fill=hexc('#5c5449'))  # inner face is the cut side: flat and dark
        d.line([(x0, y1 - 1), (x1 - 1, y1 - 1)], fill=hexc('#4c463d'))
        for _ in range((x1 - x0) * (y1 - y0) // 14):
            px, py = rnd.randint(x0, x1 - 5), rnd.randint(y0 + 2, y1 - 2)
            d.point((px, py), fill=hexc('#6b6356' if rnd.random() < 0.6 else '#8f8676'))
        # carved band and moss
        if y1 - y0 > 14:
            for x in range(x0 + 2, x1 - 5, 4): d.point((x, y0 + 5), fill=hexc('#4c463d')); d.point((x + 1, y0 + 6), fill=hexc('#4c463d'))
        for x in range(x0, x1 - 4):
            if rnd.random() < 0.25: d.point((x, y0 + 1), fill=hexc('#5e7d3a'))
    # red-and-white? no: a little offering niche
    d.rectangle([20, 104, 32, 116], fill=hexc('#3e3830'))
    d.rectangle([22, 112, 30, 115], fill=hexc('#e8c040')); d.point((24, 111), fill=hexc('#e84a8a')); d.point((27, 111), fill=hexc('#ffffff'))
    half = outline(half)
    img = Image.new('RGBA', (W, H + 2), (0, 0, 0, 0))
    img.alpha_composite(half, (0, 1))
    img.alpha_composite(half.transpose(Image.FLIP_LEFT_RIGHT), (W - 56, 1))
    return img

# ---------------------------------------------------------------- small props
def jukung():
    W, H = 104, 46
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # outrigger poles and floats
    for x in (30, 70):
        d.line([(x, 14), (x - 4, 40)], fill=hexc('#a8844c'))
        d.line([(x, 14), (x + 4, 6)], fill=hexc('#a8844c'))
    d.rectangle([10, 39, 94, 42], fill=hexc('#d0ac6c')); d.rectangle([14, 4, 90, 6], fill=hexc('#d0ac6c'))
    # hull with curled ends
    hull = [(4, 18), (16, 26), (88, 26), (100, 18), (96, 30), (84, 34), (20, 34), (8, 30)]
    d.polygon(hull, fill=hexc('#f4f1ea'))
    d.line([(16, 26), (88, 26)], fill=hexc('#ffffff'))
    d.rectangle([18, 29, 86, 31], fill=hexc('#2f7fc1'))
    d.rectangle([18, 32, 86, 33], fill=hexc('#e8c040'))
    d.line([(14, 27), (24, 27)], fill=hexc('#d13b3b'))
    # eye on the bow
    d.ellipse([88, 22, 93, 27], fill=hexc('#ffffff')); d.point((91, 24), fill=hexc('#1a1a1a'))
    return outline(img)

def sunbed():
    W, H = 52, 26
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([2, 12, 49, 20], fill=hexc('#8c5a36'))
    for x in (4, 46): d.rectangle([x, 20, x + 2, 24], fill=hexc('#6b4226'))
    d.rectangle([4, 11, 34, 16], fill=hexc('#f4f1ea')); d.rectangle([34, 4, 48, 15], fill=hexc('#f4f1ea'))
    d.line([(4, 11), (34, 11)], fill=hexc('#ffffff'))
    for x in range(6, 34, 6): d.line([(x, 12), (x, 15)], fill=hexc('#7fb5c9'))
    d.rectangle([40, 6, 46, 9], fill=hexc('#e8c040'))  # towel
    return outline(img)

def parasol():
    W, H = 60, 66
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([29, 18, 30, 64], fill=hexc('#d0ac6c'))
    cols = ['#ffffff', '#e8584a']
    for i in range(6):
        x0 = 2 + i * 9
        d.polygon([(30, 2), (x0, 22), (x0 + 9, 22)], fill=hexc(cols[i % 2]))
    d.line([(2, 22), (57, 22)], fill=hexc('#b8443a'))
    for x in range(2, 58, 9): d.arc([x, 18, x + 9, 26], 0, 180, fill=hexc('#b8443a'))
    return outline(img)

def canang():
    img = Image.new('RGBA', (16, 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([2, 5, 13, 10], fill=hexc('#7cb342'))
    d.rectangle([3, 3, 12, 6], fill=hexc('#a5d36a'))
    for x, c in [(4, '#ff4f8b'), (6, '#ffffff'), (8, '#f5c400'), (10, '#ff7a2a'), (7, '#8e44ad')]:
        d.point((x, 3), fill=hexc(c)); d.point((x, 4), fill=hexc(c))
    d.line([(11, 0), (11, 3)], fill=hexc('#c8c8c8', 160))  # incense
    return outline(img)

def surfboard(c1, c2):
    img = Image.new('RGBA', (14, 44), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([1, 0, 12, 43], fill=hexc(c1))
    d.line([(6, 2), (6, 40)], fill=hexc(c2)); d.line([(7, 2), (7, 40)], fill=hexc(c2))
    return outline(img)

def torch():
    img = Image.new('RGBA', (12, 52), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([5, 14, 6, 51], fill=hexc('#a8844c'))
    for y in range(18, 50, 6): d.line([(4, y), (7, y)], fill=hexc('#6a4c26'))
    d.rectangle([3, 10, 8, 16], fill=hexc('#6a4c26'))
    d.ellipse([3, 1, 8, 11], fill=hexc('#ff9a2a')); d.ellipse([4, 4, 7, 10], fill=hexc('#ffe27a'))
    return outline(img)

def frangipani():
    rnd = random.Random(5)
    img = Image.new('RGBA', (56, 52), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.line([(28, 51), (28, 30)], fill=hexc('#7a6a5a')); d.line([(28, 34), (18, 22)], fill=hexc('#7a6a5a')); d.line([(28, 32), (39, 20)], fill=hexc('#7a6a5a'))
    for cx, cy in [(17, 18), (39, 16), (28, 12)]:
        d.ellipse([cx - 12, cy - 9, cx + 12, cy + 9], fill=hexc('#3f7f32'))
        d.ellipse([cx - 9, cy - 8, cx + 7, cy + 3], fill=hexc('#5aa040'))
    for _ in range(9):
        x, y = rnd.randint(8, 48), rnd.randint(6, 24)
        for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]: d.point((x + dx, y + dy), fill=hexc('#fffaf0'))
        d.point((x, y), fill=hexc('#f5c400'))
    return outline(img)

# ---------------------------------------------------------------- world map (320x180, shown at 2x)
def worldmap():
    W, H = 320, 180
    rnd = random.Random(21)
    sea = np.zeros((H, W, 4), np.uint8); sea[:] = hexc('#6fb3c8')
    img = Image.fromarray(sea)
    d = ImageDraw.Draw(img)
    # waves
    for _ in range(90):
        x, y = rnd.randint(4, W - 10), rnd.randint(4, H - 6)
        d.line([(x, y), (x + 2, y - 1), (x + 4, y)], fill=hexc('#9ad0de'))

    def blob(cx, cy, rx, ry, seed, wobble=0.22):
        r2 = random.Random(seed)
        ph = [r2.uniform(0, 6.28) for _ in range(4)]
        yy, xx = np.mgrid[0:H, 0:W]
        ang = np.arctan2((yy - cy) / ry, (xx - cx) / rx)
        rad = 1 + wobble * (np.sin(ang * 3 + ph[0]) * 0.5 + np.sin(ang * 5 + ph[1]) * 0.3 + np.sin(ang * 9 + ph[2]) * 0.2)
        return (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) ** 0.5 < rad

    home = blob(104, 88, 92, 70, 1) | blob(60, 140, 40, 30, 2) | blob(170, 60, 40, 34, 3)
    bali = blob(258, 132, 40, 22, 4, 0.18)
    a = np.array(img)
    for land in (home, bali):
        # shore: sand ring, then grass
        grow = land.copy()
        for _ in range(2):
            g2 = grow.copy(); g2[1:] |= grow[:-1]; g2[:-1] |= grow[1:]; g2[:, 1:] |= grow[:, :-1]; g2[:, :-1] |= grow[:, 1:]; grow = g2
        a[grow & ~land] = hexc('#e9d39a')
        a[land] = hexc('#7fb65a')
        # texture
        ys, xs = np.nonzero(land)
        for y, x in zip(ys, xs):
            v = (x * 31 + y * 17) % 23
            if v == 0: a[y, x] = hexc('#6aa24a')
            elif v == 7: a[y, x] = hexc('#93c66a')
    # outline the coast
    coast = (home | bali)
    sandring = np.all(a == hexc('#e9d39a'), axis=2)
    allland = coast | sandring
    edge = np.zeros_like(allland)
    edge[1:] |= allland[:-1] & ~allland[1:]; edge[:-1] |= allland[1:] & ~allland[:-1]
    edge[:, 1:] |= allland[:, :-1] & ~allland[:, 1:]; edge[:, :-1] |= allland[:, 1:] & ~allland[:, :-1]
    a[edge] = hexc('#3f7f94')
    img = Image.fromarray(a)
    d = ImageDraw.Draw(img)
    # dark forest around Hollowmere (east)
    for _ in range(40):
        x, y = rnd.randint(160, 205), rnd.randint(34, 80)
        if home[y, x]:
            d.polygon([(x, y - 5), (x - 3, y + 1), (x + 3, y + 1)], fill=hexc('#2f4a3a')); d.point((x, y + 2), fill=hexc('#3a2a20'))
    # trees around home
    for _ in range(70):
        x, y = rnd.randint(14, 150), rnd.randint(20, 165)
        if home[y, x] and not (60 < x < 140 and 40 < y < 120):
            d.ellipse([x - 3, y - 3, x + 3, y + 2], fill=hexc('#4f8f3a')); d.point((x - 1, y - 2), fill=hexc('#7cc450')); d.point((x, y + 3), fill=hexc('#5a3c24'))
    # palms on Bali
    for x, y in [(236, 128), (248, 122), (281, 130), (270, 140), (230, 138)]:
        d.line([(x, y), (x + 1, y - 6)], fill=hexc('#7a5634'))
        for dx, dy in [(-4, -6), (4, -6), (-3, -9), (3, -9), (0, -10)]: d.line([(x + 1, y - 6), (x + 1 + dx, y - 6 + dy // 2 + 2)], fill=hexc('#3c7a30'))
    # flight route (dotted)
    for i in range(0, 60):
        t = i / 60
        x = 150 + (240 - 150) * t; y = 120 + (128 - 120) * t - 26 * math.sin(t * math.pi)
        if i % 3 == 0: d.point((int(x), int(y)), fill=hexc('#ffffff'))
    # roads between home places (dotted)
    for (x0, y0), (x1, y1) in [((88, 46), (96, 92)), ((96, 92), (164, 64)), ((96, 92), (128, 118))]:
        n = int(math.hypot(x1 - x0, y1 - y0) / 2)
        for i in range(n):
            if i % 2 == 0: d.point((int(x0 + (x1 - x0) * i / n), int(y0 + (y1 - y0) * i / n)), fill=hexc('#a0703a'))
    # compass rose
    cx, cy = 296, 26
    d.polygon([(cx, cy - 12), (cx - 3, cy), (cx + 3, cy)], fill=hexc('#c0392b'))
    d.polygon([(cx, cy + 12), (cx - 3, cy), (cx + 3, cy)], fill=hexc('#f4f1ea'))
    d.polygon([(cx - 12, cy), (cx, cy - 3), (cx, cy + 3)], fill=hexc('#f4f1ea'))
    d.polygon([(cx + 12, cy), (cx, cy - 3), (cx, cy + 3)], fill=hexc('#f4f1ea'))
    # parchment frame
    fr = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fr)
    fd.rectangle([0, 0, W - 1, H - 1], outline=hexc('#5a3a1c'), width=3)
    fd.rectangle([3, 3, W - 4, H - 4], outline=hexc('#c9a46a'), width=2)
    fd.rectangle([5, 5, W - 6, H - 6], outline=hexc('#7a5230'), width=1)
    img.alpha_composite(fr)
    return img

def pier(length=192):
    W = 56
    img = Image.new('RGBA', (W, length), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(0, length, 8):
        c = '#a8784a' if (y // 8) % 2 else '#b88a58'
        d.rectangle([4, y, W - 5, y + 7], fill=hexc(c))
        d.line([(4, y), (W - 5, y)], fill=hexc('#d0a46c'))
        d.line([(4, y + 7), (W - 5, y + 7)], fill=hexc('#7a5230'))
        d.point((10, y + 3), fill=hexc('#5a3820')); d.point((W - 11, y + 3), fill=hexc('#5a3820'))
    for y in range(12, length, 48):
        for x in (0, W - 5):
            d.rectangle([x, y, x + 4, y + 14], fill=hexc('#6b4226')); d.line([(x, y), (x + 4, y)], fill=hexc('#8c5a36'))
    return outline(img)

def big_pool(pool, tw, th):
    T = 32
    img = Image.new('RGBA', (tw * T, th * T), (0, 0, 0, 0))
    for y in range(th):
        for x in range(tw):
            cx = 0 if x == 0 else 2 if x == tw - 1 else 1
            cy = 0 if y == 0 else 2 if y == th - 1 else 1
            img.alpha_composite(pool.crop((cx * T, cy * T, cx * T + T, cy * T + T)), (x * T, y * T))
    # a stone deck around it
    out = Image.new('RGBA', (tw * T + 16, th * T + 16), hexc('#d8cfbd'))
    d = ImageDraw.Draw(out)
    for x in range(0, out.width, 16): d.line([(x, 0), (x, out.height)], fill=hexc('#c4bba8'))
    for y in range(0, out.height, 16): d.line([(0, y), (out.width, y)], fill=hexc('#c4bba8'))
    out.alpha_composite(img, (8, 8))
    return outline(out)

def busstop():
    img = Image.new('RGBA', (26, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([12, 18, 13, 63], fill=hexc('#9aa3ad'))
    d.rectangle([1, 1, 24, 22], fill=hexc('#2f6fb5')); d.rectangle([3, 3, 22, 20], fill=hexc('#3f86c4'))
    # little white plane
    d.line([(6, 12), (19, 12)], fill=hexc('#ffffff')); d.line([(6, 11), (19, 11)], fill=hexc('#ffffff'))
    d.polygon([(11, 11), (14, 5), (16, 5), (15, 11)], fill=hexc('#ffffff'))
    d.polygon([(11, 12), (14, 18), (16, 18), (15, 12)], fill=hexc('#ffffff'))
    d.line([(6, 9), (6, 14)], fill=hexc('#ffffff'))
    return outline(img)

def plane():
    img = Image.new('RGBA', (28, 22), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([2, 9, 26, 13], fill=hexc('#f4f1ea'))
    d.polygon([(10, 10), (16, 0), (19, 0), (16, 10)], fill=hexc('#d8dde2'))
    d.polygon([(10, 12), (16, 21), (19, 21), (16, 12)], fill=hexc('#d8dde2'))
    d.polygon([(2, 10), (4, 4), (6, 4), (6, 10)], fill=hexc('#e8584a'))
    for x in range(10, 24, 3): d.point((x, 10), fill=hexc('#3f86c4'))
    d.point((24, 10), fill=hexc('#3f86c4'))
    return outline(img)

def basket():
    img = Image.new('RGBA', (20, 14), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([2, 4, 15, 12], fill=hexc('#b8c0c8'))
    for x in range(3, 15, 2): d.line([(x, 4), (x, 12)], fill=hexc('#8a939c'))
    for y in range(5, 12, 2): d.line([(2, y), (15, y)], fill=hexc('#8a939c'))
    d.rectangle([15, 6, 19, 7], fill=hexc('#2a2a2a'))
    return outline(img)


# ---------------------------------------------------------------- Casa Umalas inside
def bed():
    W, H = 120, 132
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    teak, teak_l, teak_d = hexc('#6b4226'), hexc('#8c5a36'), hexc('#4a2c18')
    # headboard (carved)
    d.rectangle([8, 30, 111, 56], fill=teak)
    d.line([(8, 30), (111, 30)], fill=teak_l)
    for x in range(16, 106, 12): d.ellipse([x, 38, x + 7, 46], outline=teak_d)
    # mattress and sheets
    d.rectangle([12, 54, 107, 118], fill=hexc('#f4f1ea'))
    d.rectangle([12, 54, 107, 57], fill=hexc('#ffffff'))
    for x in (22, 64):
        d.rounded_rectangle([x, 60, x + 34, 74], 4, fill=hexc('#ffffff')); d.line([(x + 2, 72), (x + 32, 72)], fill=hexc('#d9d3c6'))
    d.rectangle([12, 84, 107, 118], fill=hexc('#e9dcc4'))
    d.line([(12, 84), (107, 84)], fill=hexc('#fffaf0'))
    for x in range(16, 106, 8): d.point((x, 100), fill=hexc('#c9a46a')); d.point((x + 4, 108), fill=hexc('#c9a46a'))
    # frangipani flowers on the bed
    for cx, cy in [(52, 90), (60, 94)]:
        for dx, dy in [(0, -2), (2, 0), (0, 2), (-2, 0)]: d.point((cx + dx, cy + dy), fill=hexc('#ffffff'))
        d.point((cx, cy), fill=hexc('#f5c400'))
    d.rectangle([10, 118, 109, 124], fill=teak); d.line([(10, 124), (109, 124)], fill=teak_d)
    # four posts
    for x in (6, 108):
        d.rectangle([x, 2, x + 5, 128], fill=teak); d.line([(x, 2), (x, 128)], fill=teak_l)
    d.rectangle([4, 0, 115, 4], fill=teak)
    # the mosquito net: see-through white
    net = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    nd = ImageDraw.Draw(net)
    nd.polygon([(6, 4), (114, 4), (118, 126), (2, 126)], fill=(255, 255, 255, 58))
    for x in range(8, 114, 9): nd.line([(x, 5), (x - 3 if x < 60 else x + 3, 125)], fill=(255, 255, 255, 90))
    nd.line([(2, 126), (118, 126)], fill=(255, 255, 255, 140))
    # tied back at the front corners
    nd.polygon([(2, 60), (14, 70), (2, 126)], fill=(255, 255, 255, 120))
    nd.polygon([(118, 60), (106, 70), (118, 126)], fill=(255, 255, 255, 120))
    img = outline(img)
    img.alpha_composite(net)
    return img

def daybed():
    W, H = 104, 56
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rattan, rattan_l, rattan_d = hexc('#c99a52'), hexc('#e0b874'), hexc('#9a6c2e')
    d.rectangle([2, 4, 101, 30], fill=rattan)
    for y in range(6, 30, 3):
        for x in range(4, 100, 4): d.point((x + (y // 3) % 2 * 2, y), fill=rattan_d)
    d.line([(2, 4), (101, 4)], fill=rattan_l)
    d.rectangle([2, 26, 101, 46], fill=rattan); d.line([(2, 46), (101, 46)], fill=rattan_d)
    for x in (4, 96): d.rectangle([x, 46, x + 3, 53], fill=rattan_d)
    # cushions: ocean blue and white
    d.rounded_rectangle([8, 22, 95, 38], 3, fill=hexc('#f4f1ea'))
    for x, c in [(12, '#2f7fc1'), (40, '#e8c040'), (70, '#2f7fc1')]:
        d.rounded_rectangle([x, 10, x + 20, 26], 3, fill=hexc(c)); d.line([(x + 3, 13), (x + 17, 13)], fill=hexc('#ffffff', 120))
    return outline(img)

def ikat_rug():
    W, H = 144, 88
    img = Image.new('RGBA', (W, H), hexc('#a8432f'))
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, W - 5, H - 5], outline=hexc('#f1d9a6'), width=2)
    d.rectangle([9, 9, W - 10, H - 10], outline=hexc('#2c3e5a'), width=2)
    for cx in range(24, W - 10, 24):
        for cy in (30, 58):
            d.polygon([(cx, cy - 10), (cx + 9, cy), (cx, cy + 10), (cx - 9, cy)], fill=hexc('#f1d9a6'))
            d.polygon([(cx, cy - 5), (cx + 4, cy), (cx, cy + 5), (cx - 4, cy)], fill=hexc('#2c3e5a'))
    for x in range(0, W, 3):
        d.line([(x, 0), (x, 2)], fill=hexc('#f1d9a6')); d.line([(x, H - 3), (x, H - 1)], fill=hexc('#f1d9a6'))
    return img

def frog():
    img = Image.new('RGBA', (30, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    st, st_l, st_d = hexc('#8e8a80'), hexc('#aaa69a'), hexc('#6c685f')
    d.ellipse([3, 10, 26, 27], fill=st)
    d.ellipse([6, 4, 23, 18], fill=st)
    d.ellipse([5, 2, 12, 9], fill=st_l); d.ellipse([17, 2, 24, 9], fill=st_l)
    d.point((8, 5), fill=hexc('#2a2a2a')); d.point((20, 5), fill=hexc('#2a2a2a'))
    d.line([(10, 14), (19, 14)], fill=st_d)
    d.ellipse([10, 18, 19, 26], fill=st_l)
    # little umbrella (they always have one)
    d.line([(24, 2), (24, 14)], fill=hexc('#6b4226'))
    d.pieslice([16, -6, 32, 8], 180, 360, fill=hexc('#e8584a'))
    for x in range(18, 31, 2): d.point((x, 0), fill=hexc('#f5c400'))
    for _ in range(20):
        x, y = random.randint(5, 24), random.randint(10, 25)
        d.point((x, y), fill=hexc('#5e7d3a'))
    return outline(img)

def view():
    """The big open doors at the back of the villa: garden, pool, palms and the sea."""
    W, H = 160, 72
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = (int(140 + 90 * t), int(200 + 30 * t), int(235 - 10 * t), 255)
        d.line([(0, y), (W, y)], fill=c)
    d.rectangle([0, 30, W, 40], fill=hexc('#3f9ab8'))
    d.line([(0, 30), (W, 30)], fill=hexc('#9ad0de'))
    d.rectangle([0, 40, W, H], fill=hexc('#5aa040'))
    d.rectangle([30, 46, 120, 60], fill=hexc('#7fd0e8')); d.rectangle([30, 46, 120, 47], fill=hexc('#d8cfbd'))
    for px in (14, 140, 100):
        d.line([(px, 44), (px + 3, 12)], fill=hexc('#7a5634'))
        for dx in (-12, -6, 6, 12): d.line([(px + 3, 12), (px + 3 + dx, 18 + abs(dx) // 3)], fill=hexc('#3c7a30'))
    d.ellipse([118, 6, 130, 18], fill=hexc('#fff2a0'))
    # door frames
    frame = hexc('#4a2c18')
    d.rectangle([0, 0, W - 1, H - 1], outline=frame, width=3)
    for x in (40, 80, 120): d.rectangle([x - 1, 0, x + 1, H], fill=frame)
    for x in range(3, W - 3, 40): d.line([(x + 6, 4), (x + 18, 40)], fill=(255, 255, 255, 70))
    return img

def gecko():
    img = Image.new('RGBA', (40, 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for f, legs in ((0, [(5, 2), (5, 9), (12, 1), (12, 10)]), (20, [(6, 1), (6, 10), (11, 2), (11, 9)])):
        d.line([(f + 1, 6), (f + 16, 6)], fill=hexc('#7a9a4a'))
        d.line([(f + 3, 5), (f + 14, 5)], fill=hexc('#93b45a'))
        d.ellipse([f + 13, 3, f + 19, 8], fill=hexc('#93b45a'))
        d.point((f + 17, 4), fill=hexc('#1a1a1a'))
        for lx, ly in legs: d.line([(f + lx, 6), (f + lx + (1 if ly < 6 else 1), ly)], fill=hexc('#7a9a4a'))
        for x in range(f + 4, f + 13, 3): d.point((x, 5), fill=hexc('#c8a050'))
    return img

def mosquito():
    img = Image.new('RGBA', (16, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for f in (0, 8):
        d.line([(f + 2, 5), (f + 6, 5)], fill=hexc('#2a2a2a'))
        d.point((f + 1, 6), fill=hexc('#2a2a2a'))
        wy = 2 if f == 0 else 4
        d.line([(f + 3, wy), (f + 5, wy)], fill=(220, 230, 240, 200))
    return img

def monkey():
    """A long-tailed macaque, 4 frames of 28x28: walk 1, walk 2, sit, jump."""
    img = Image.new('RGBA', (112, 28), (0, 0, 0, 0))
    fur, fur_l, fur_d, face = hexc('#8a7a5c'), hexc('#a8987a'), hexc('#6a5a40'), hexc('#d8b49a')
    for i in range(4):
        f = Image.new('RGBA', (28, 28), (0, 0, 0, 0))
        d = ImageDraw.Draw(f)
        sit = i == 2; jump = i == 3
        by = 12 if not jump else 8
        # tail
        d.line([(6, by + 6), (2, by - 2), (4, by - 8)], fill=fur_d, width=2)
        # body
        if sit: d.ellipse([7, by - 2, 20, by + 12], fill=fur)
        else: d.ellipse([6, by + 1, 22, by + 10], fill=fur)
        d.ellipse([8, by + 2, 18, by + 6], fill=fur_l)
        # legs
        if not sit:
            a, b = ((0, 2) if i == 0 else (2, 0)) if not jump else (3, 3)
            for x, off in ((8, a), (11, b), (17, b), (20, a)):
                d.line([(x, by + 8), (x - (2 if jump else 0), by + 12 + off - (3 if jump else 0))], fill=fur_d, width=2)
        else:
            d.line([(9, by + 11), (12, by + 13)], fill=fur_d, width=2); d.line([(18, by + 11), (15, by + 13)], fill=fur_d, width=2)
        # head
        hx, hy = (19, by - 4) if not sit else (13, by - 7)
        d.ellipse([hx - 1, hy - 1, hx + 9, hy + 8], fill=fur)
        d.ellipse([hx + 1, hy + 2, hx + 8, hy + 8], fill=face)
        d.point((hx + 3, hy + 3), fill=hexc('#1a1a1a')); d.point((hx + 6, hy + 3), fill=hexc('#1a1a1a'))
        d.point((hx + 4, hy + 6), fill=hexc('#8a4a3a'))
        d.point((hx - 1, hy + 2), fill=face); d.point((hx + 9, hy + 2), fill=face)
        # sunglasses on its head (stolen)
        d.line([(hx, hy), (hx + 8, hy)], fill=hexc('#1a1a1a')); d.rectangle([hx + 1, hy - 1, hx + 3, hy + 1], fill=hexc('#1a1a1a')); d.rectangle([hx + 5, hy - 1, hx + 7, hy + 1], fill=hexc('#1a1a1a'))
        img.alpha_composite(outline(f), (i * 28, 0))
    return img

def coconut():
    img = Image.new('RGBA', (12, 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([1, 1, 10, 10], fill=hexc('#6a8a2a')); d.ellipse([2, 2, 6, 6], fill=hexc('#8ab04a'))
    d.point((7, 7), fill=hexc('#4a6a1a'))
    return outline(img)

def surf_assets():
    out = {}
    # board seen from the side
    b = Image.new('RGBA', (52, 8), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
    d.ellipse([0, 1, 51, 7], fill=hexc('#f5c400')); d.line([(4, 4), (47, 4)], fill=hexc('#e8584a'))
    out['surf-board'] = outline(b)
    # rock sticking out of the water
    r = Image.new('RGBA', (34, 24), (0, 0, 0, 0)); d = ImageDraw.Draw(r)
    d.polygon([(2, 23), (8, 8), (16, 2), (26, 6), (32, 23)], fill=hexc('#6c685f'))
    d.polygon([(8, 8), (16, 2), (20, 4), (12, 14)], fill=hexc('#8e8a80'))
    d.line([(4, 22), (30, 22)], fill=hexc('#ffffff'))
    out['surf-rock'] = outline(r)
    # jellyfish, 2 frames
    j = Image.new('RGBA', (32, 18), (0, 0, 0, 0)); d = ImageDraw.Draw(j)
    for f, sq in ((0, 0), (16, 2)):
        d.pieslice([f + 1 + sq // 2, 1, f + 14 - sq // 2, 14], 180, 360, fill=hexc('#e89ad8', 230))
        d.pieslice([f + 4, 3, f + 9, 9], 180, 360, fill=hexc('#ffd0f0', 230))
        for x in range(f + 3, f + 13, 3): d.line([(x, 8), (x + (1 if sq else -1), 16)], fill=hexc('#e89ad8', 200))
    out['surf-jelly'] = j
    # shell: a scallop fan
    s = Image.new('RGBA', (14, 13), (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    pts = [(7, 12)] + [(7 + 7 * math.cos(math.radians(a)), 7 - 7 * math.sin(math.radians(a))) for a in range(0, 181, 15)]
    d.polygon(pts, fill=hexc('#fbe3ef'))
    for a in range(15, 180, 30):
        d.line([(7, 12), (7 + 6 * math.cos(math.radians(a)), 7 - 6 * math.sin(math.radians(a)))], fill=hexc('#e39abb'))
    d.rectangle([5, 10, 9, 12], fill=hexc('#e39abb'))
    out['surf-shell'] = outline(s)
    return out

# ---------------------------------------------------------------- turtles and dolphins
def sea_turtle():
    """Top-down sea turtle, 2 frames of 36x32 (flippers forward / back)."""
    img = Image.new('RGBA', (72, 32), (0, 0, 0, 0))
    shell, shell_l, shell_d, skin = hexc('#6b7a3a'), hexc('#8a9a4a'), hexc('#4a5a2a'), hexc('#9aa878')
    for i in range(2):
        f = Image.new('RGBA', (36, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        a = 0 if i == 0 else 4
        # flippers
        d.polygon([(10, 12 - a), (2, 4 - a), (6, 14 - a)], fill=skin); d.polygon([(26, 12 - a), (34, 4 - a), (30, 14 - a)], fill=skin)
        d.polygon([(11, 22 + a), (5, 28 + a), (13, 25)], fill=skin); d.polygon([(25, 22 + a), (31, 28 + a), (23, 25)], fill=skin)
        # head
        d.ellipse([14, 1, 22, 9], fill=skin); d.point((15, 4), fill=hexc('#1a1a1a')); d.point((21, 4), fill=hexc('#1a1a1a'))
        # shell with plates
        d.ellipse([8, 7, 28, 29], fill=shell)
        d.ellipse([11, 9, 25, 26], fill=shell_l)
        for cx, cy in [(18, 12), (14, 17), (22, 17), (18, 22)]:
            d.polygon([(cx, cy - 3), (cx + 3, cy), (cx, cy + 3), (cx - 3, cy)], fill=shell_d)
        d.line([(18, 26), (18, 30)], fill=skin)
        img.alpha_composite(outline(f), (i * 36, 0))
    return img

def baby_turtle():
    img = Image.new('RGBA', (28, 14), (0, 0, 0, 0))
    for i in range(2):
        f = Image.new('RGBA', (14, 14), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        a = i
        d.point((3, 4 - a), fill=hexc('#5a5a4a')); d.point((10, 4 - a), fill=hexc('#5a5a4a'))
        d.point((3, 10 + a), fill=hexc('#5a5a4a')); d.point((10, 10 + a), fill=hexc('#5a5a4a'))
        d.ellipse([5, 1, 8, 4], fill=hexc('#6a6a58'))
        d.ellipse([3, 4, 10, 12], fill=hexc('#4a4a3a')); d.point((6, 7), fill=hexc('#6a6a58'))
        img.alpha_composite(outline(f), (i * 14, 0))
    return img

def turtle_side():
    """Swimming turtle seen from the side (for surfing), 2 frames of 40x22."""
    img = Image.new('RGBA', (80, 22), (0, 0, 0, 0))
    for i in range(2):
        f = Image.new('RGBA', (40, 22), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([30, 7, 39, 14], fill=hexc('#9aa878')); d.point((36, 9), fill=hexc('#1a1a1a'))
        fl = [(22, 14), (30, 21 if i else 17), (18, 16)]
        d.polygon(fl, fill=hexc('#8a9868'))
        d.polygon([(6, 13), (0, 19 if i else 15), (10, 15)], fill=hexc('#8a9868'))
        d.pieslice([4, 2, 32, 26], 180, 360, fill=hexc('#6b7a3a'))
        d.rectangle([5, 13, 31, 15], fill=hexc('#c8c09a'))
        for x in (11, 18, 25): d.polygon([(x, 6), (x + 3, 9), (x, 12), (x - 3, 9)], fill=hexc('#4a5a2a'))
        img.alpha_composite(outline(f), (i * 40, 0))
    return img

def dolphin():
    """Dolphin jumping, side view, 48x26."""
    img = Image.new('RGBA', (48, 26), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    body, light = hexc('#6f8fa8'), hexc('#c8d8e4')
    d.polygon([(2, 16), (10, 9), (24, 6), (38, 8), (46, 12), (38, 14), (24, 17), (10, 18)], fill=body)
    d.polygon([(10, 17), (24, 16), (38, 13), (24, 18)], fill=light)
    d.polygon([(22, 7), (26, 0), (30, 7)], fill=body)               # dorsal fin
    d.polygon([(2, 16), (0, 10), (6, 14)], fill=body); d.polygon([(2, 16), (0, 22), (6, 18)], fill=body)  # tail
    d.polygon([(26, 16), (24, 22), (30, 16)], fill=body)            # flipper
    d.point((38, 10), fill=hexc('#1a1a1a'))
    d.line([(40, 12), (45, 12)], fill=hexc('#4f6f88'))
    return outline(img)

def hatchery():
    """A little turtle nursery on the beach: bamboo fence around a sand bed, with a sign."""
    W, H = 104, 72
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([6, 26, 97, 66], fill=hexc('#e6b878'))
    for _ in range(14):
        x, y = random.randint(12, 90), random.randint(32, 60)
        d.ellipse([x, y, x + 5, y + 4], fill=hexc('#f4ecd8')); d.point((x + 1, y + 1), fill=hexc('#ffffff'))
    for x in (30, 54, 78):
        d.line([(x, 28), (x, 64)], fill=hexc('#c8945a'))
    for x in range(4, 100, 6):
        d.rectangle([x, 22, x + 2, 34], fill=hexc('#c8a060')); d.rectangle([x, 60, x + 2, 70], fill=hexc('#c8a060'))
    d.rectangle([4, 24, 99, 25], fill=hexc('#8a6a3a')); d.rectangle([4, 62, 99, 63], fill=hexc('#8a6a3a'))
    for y in range(24, 70, 6):
        d.rectangle([2, y, 4, y + 3], fill=hexc('#c8a060')); d.rectangle([99, y, 101, y + 3], fill=hexc('#c8a060'))
    # sign with a turtle on it
    d.rectangle([40, 0, 64, 16], fill=hexc('#2f7fc1')); d.rectangle([51, 16, 53, 24], fill=hexc('#6b4226'))
    d.ellipse([46, 4, 58, 13], fill=hexc('#8ad06a')); d.ellipse([56, 6, 61, 11], fill=hexc('#8ad06a'))
    for x, y in [(46, 4), (56, 4), (46, 12), (56, 12)]: d.point((x, y), fill=hexc('#8ad06a'))
    return outline(img)

# ---------------------------------------------------------------- Buurman Mol
def mole():
    """Neighbour Mole: 4 rows (down, up, left, right) x 4 walk frames of 48x48. Feet at y = 46."""
    FW = 48
    img = Image.new('RGBA', (FW * 4, FW * 4), (0, 0, 0, 0))
    fur, fur_l, fur_d = hexc('#4a3f3a'), hexc('#655852'), hexc('#2f2724')
    pink, pink_d = hexc('#f2a6b4'), hexc('#d07a8c')
    vest, vest_d = hexc('#4f8a3a'), hexc('#3a6a2a')
    glass = hexc('#d8c070')
    for row, facing in enumerate(['down', 'up', 'left', 'right']):
        for fr in range(4):
            f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
            step = [0, 1, 0, -1][fr]
            bob = 0 if fr % 2 == 0 else -1
            cx = 24
            # feet
            if facing in ('down', 'up'):
                d.ellipse([cx - 10, 42 - max(0, step) * 2, cx - 3, 46 - max(0, step) * 2], fill=pink)
                d.ellipse([cx + 3, 42 - max(0, -step) * 2, cx + 10, 46 - max(0, -step) * 2], fill=pink)
            else:
                d.ellipse([cx - 6 + step * 4, 42, cx + 1 + step * 4, 46], fill=pink)
                d.ellipse([cx - 1 - step * 4, 42, cx + 6 - step * 4, 46], fill=pink_d)
            y0 = 12 + bob
            # body (a round velvet bean)
            d.ellipse([cx - 13, y0, cx + 13, 44 + bob], fill=fur)
            d.ellipse([cx - 11, y0 + 2, cx + 7, 40 + bob], fill=fur_l if facing != 'up' else fur)
            if facing == 'down':
                d.ellipse([cx - 7, y0 + 14, cx + 7, 40 + bob], fill=hexc('#7a6a62'))
                # vest
                d.polygon([(cx - 12, y0 + 16), (cx - 3, y0 + 16), (cx - 2, 38 + bob), (cx - 11, 36 + bob)], fill=vest)
                d.polygon([(cx + 12, y0 + 16), (cx + 3, y0 + 16), (cx + 2, 38 + bob), (cx + 11, 36 + bob)], fill=vest)
                for by in (y0 + 20, y0 + 25): d.point((cx - 4, by), fill=hexc('#e8c040'))
                # snout + nose
                d.ellipse([cx - 4, y0 + 8, cx + 4, y0 + 15], fill=pink)
                d.ellipse([cx - 2, y0 + 12, cx + 2, y0 + 16], fill=pink_d)
                # glasses
                for gx in (cx - 7, cx + 2):
                    d.ellipse([gx, y0 + 4, gx + 5, y0 + 9], outline=glass); d.point((gx + 2, y0 + 6), fill=hexc('#1a1a1a'))
                d.line([(cx - 2, y0 + 6), (cx + 2, y0 + 6)], fill=glass)
                # big pink digging paws, swinging
                d.ellipse([cx - 19, y0 + 16 + step * 2, cx - 11, y0 + 24 + step * 2], fill=pink)
                d.ellipse([cx + 11, y0 + 16 - step * 2, cx + 19, y0 + 24 - step * 2], fill=pink)
                for k in range(3):
                    d.point((cx - 18 + k * 3, y0 + 24 + step * 2), fill=hexc('#fff0e0')); d.point((cx + 12 + k * 3, y0 + 24 - step * 2), fill=hexc('#fff0e0'))
            elif facing == 'up':
                d.ellipse([cx - 9, y0 + 2, cx + 9, y0 + 14], fill=fur_l)
                d.polygon([(cx - 12, y0 + 16), (cx + 12, y0 + 16), (cx + 11, 36 + bob), (cx - 11, 36 + bob)], fill=vest_d)
                d.line([(cx, y0 + 17), (cx, 35 + bob)], fill=vest)
                d.ellipse([cx - 1, 40 + bob, cx + 2, 44 + bob], fill=pink)  # tiny tail
                d.ellipse([cx - 19, y0 + 16 - step * 2, cx - 11, y0 + 24 - step * 2], fill=pink)
                d.ellipse([cx + 11, y0 + 16 + step * 2, cx + 19, y0 + 24 + step * 2], fill=pink)
            else:
                sgn = -1 if facing == 'left' else 1
                d.polygon([(cx - 8 * sgn, y0 + 16), (cx + 10 * sgn, y0 + 16), (cx + 11 * sgn, 36 + bob), (cx - 9 * sgn, 36 + bob)], fill=vest)
                # snout sticking out
                sx = cx + 12 * sgn
                d.ellipse([min(sx, sx + 9 * sgn), y0 + 8, max(sx, sx + 9 * sgn), y0 + 14], fill=pink)
                d.ellipse([min(sx + 7 * sgn, sx + 11 * sgn), y0 + 9, max(sx + 7 * sgn, sx + 11 * sgn), y0 + 13], fill=pink_d)
                gx = cx + 5 * sgn
                d.ellipse([gx - 3, y0 + 4, gx + 3, y0 + 9], outline=glass); d.point((gx + sgn, y0 + 6), fill=hexc('#1a1a1a'))
                d.line([(gx - 3 * sgn, y0 + 6), (cx - 6 * sgn, y0 + 5)], fill=glass)
                d.ellipse([cx + 2 * sgn - 4 + step * 3, y0 + 18, cx + 2 * sgn + 4 + step * 3, y0 + 26], fill=pink)
            img.alpha_composite(outline(f), (fr * FW, row * FW))
    return img

# ---------------------------------------------------------------- Simba, the black cat
def cat():
    """4 rows (down, up, left, right) x 4 walk frames of 32x32, plus a 5th row: sit, pounce-up, dive, pop-out."""
    FW = 32
    img = Image.new('RGBA', (FW * 4, FW * 5), (0, 0, 0, 0))
    blk, blk_l, blk_d = hexc('#1e1c22'), hexc('#38343e'), hexc('#121016')
    eye = hexc('#c8e04a'); nose = hexc('#d07a8c')
    def side(d, sgn, fr, pose='walk'):
        cx = 16
        step = [0, 1, 0, -1][fr] if pose == 'walk' else 0
        by = 20 if pose != 'jump' else 14
        # tail curling up behind
        tx = cx - 9 * sgn
        d.line([(tx, by), (tx - 3 * sgn, by - 6), (tx - 1 * sgn, by - 11)], fill=blk, width=2)
        # legs
        for lx, off in ((cx - 6 * sgn, step), (cx + 5 * sgn, -step)):
            if pose == 'jump':
                d.line([(lx, by + 4), (lx - 4 * sgn, by + 8)], fill=blk, width=2)
            else:
                d.line([(lx, by + 4), (lx + off * sgn, 29)], fill=blk, width=2)
        d.ellipse([cx - 9, by - 3, cx + 9, by + 6], fill=blk)
        d.line([(cx - 6, by - 2), (cx + 4, by - 2)], fill=blk_l)
        hx = cx + 9 * sgn
        d.ellipse([hx - 5, by - 9, hx + 5, by + 1], fill=blk)
        d.polygon([(hx - 4, by - 7), (hx - 3, by - 13), (hx, by - 8)], fill=blk)
        d.polygon([(hx + 4, by - 7), (hx + 3, by - 13), (hx, by - 8)], fill=blk)
        d.point((hx + 2 * sgn, by - 5), fill=eye); d.point((hx + 2 * sgn, by - 4), fill=eye)
        d.point((hx + 5 * sgn, by - 3), fill=nose)
    for row, facing in enumerate(['down', 'up', 'left', 'right']):
        for fr in range(4):
            f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
            step = [0, 1, 0, -1][fr]
            if facing in ('left', 'right'):
                side(d, -1 if facing == 'left' else 1, fr)
            else:
                cx = 16
                d.ellipse([cx - 7, 14, cx + 7, 29], fill=blk)                      # body
                for lx, off in ((cx - 4, step), (cx + 4, -step)):
                    d.line([(lx, 24), (lx, 29 - max(0, off))], fill=blk_d, width=2)
                if facing == 'down':
                    d.line([(cx + 7, 26), (cx + 11, 22), (cx + 10, 16)], fill=blk, width=2)   # tail to the side
                    d.ellipse([cx - 7, 4, cx + 7, 16], fill=blk)                       # head
                    d.polygon([(cx - 7, 8), (cx - 6, 1), (cx - 2, 5)], fill=blk); d.polygon([(cx + 7, 8), (cx + 6, 1), (cx + 2, 5)], fill=blk)
                    d.point((cx - 5, 3), fill=nose); d.point((cx + 5, 3), fill=nose)
                    for ex in (cx - 4, cx + 3):
                        d.rectangle([ex, 8, ex + 1, 10], fill=eye); d.point((ex, 9), fill=blk_d)
                    d.point((cx, 12), fill=nose)
                    d.line([(cx - 10, 11), (cx - 6, 12)], fill=blk_l); d.line([(cx + 10, 11), (cx + 6, 12)], fill=blk_l)
                else:
                    d.ellipse([cx - 7, 4, cx + 7, 16], fill=blk)
                    d.polygon([(cx - 7, 8), (cx - 6, 1), (cx - 2, 5)], fill=blk); d.polygon([(cx + 7, 8), (cx + 6, 1), (cx + 2, 5)], fill=blk)
                    d.line([(cx, 26), (cx + 2 * step, 31)], fill=blk, width=2)
                    d.line([(cx - 3, 6), (cx + 3, 6)], fill=blk_l)
            img.alpha_composite(outline(f, hexc('#000000')), (fr * FW, row * FW))
    # row 5: sit (front), jump (side, right), dive (only tail + bum sticking out of snow), pop out (head + snow)
    poses = []
    f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
    cx = 16
    d.ellipse([cx - 8, 13, cx + 8, 30], fill=blk); d.line([(cx + 8, 28), (cx + 12, 26), (cx + 13, 21)], fill=blk, width=2)
    d.ellipse([cx - 7, 4, cx + 7, 16], fill=blk)
    d.polygon([(cx - 7, 8), (cx - 6, 1), (cx - 2, 5)], fill=blk); d.polygon([(cx + 7, 8), (cx + 6, 1), (cx + 2, 5)], fill=blk)
    for ex in (cx - 4, cx + 3): d.rectangle([ex, 8, ex + 1, 10], fill=eye)
    d.point((cx, 12), fill=nose)
    poses.append(f)
    f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); side(ImageDraw.Draw(f), 1, 0, 'jump'); poses.append(f)
    f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
    d.ellipse([10, 18, 22, 28], fill=blk); d.line([(16, 19), (18, 12), (15, 7)], fill=blk, width=2)
    d.line([(12, 26), (10, 30)], fill=blk, width=2); d.line([(20, 26), (22, 30)], fill=blk, width=2)
    poses.append(f)
    f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
    d.ellipse([cx - 7, 14, cx + 7, 26], fill=blk)
    d.polygon([(cx - 7, 18), (cx - 6, 11), (cx - 2, 15)], fill=blk); d.polygon([(cx + 7, 18), (cx + 6, 11), (cx + 2, 15)], fill=blk)
    for ex in (cx - 4, cx + 3): d.rectangle([ex, 18, ex + 1, 20], fill=eye)
    for x in range(cx - 6, cx + 7, 3): d.point((x, 14 + (x % 2)), fill=hexc('#ffffff'))
    d.ellipse([cx - 3, 12, cx + 3, 15], fill=hexc('#f4f8ff'))
    poses.append(f)
    for i, p in enumerate(poses): img.alpha_composite(outline(p, hexc('#000000')), (i * FW, 4 * FW))
    return img

def snow_assets():
    out = {}
    # a snow pile
    p = Image.new('RGBA', (48, 24), (0, 0, 0, 0)); d = ImageDraw.Draw(p)
    d.ellipse([0, 6, 47, 30], fill=hexc('#e6eef8')); d.ellipse([4, 4, 36, 24], fill=hexc('#f6faff')); d.ellipse([20, 2, 44, 22], fill=hexc('#ffffff'))
    d.arc([0, 6, 47, 30], 200, 340, fill=hexc('#b8c8dc'))
    out['snow-pile'] = outline(p, hexc('#8aa0bc'))
    # snowman in 3 stages (one more ball each time)
    for n in (1, 2, 3):
        sm = Image.new('RGBA', (32, 52), (0, 0, 0, 0)); d = ImageDraw.Draw(sm)
        d.ellipse([3, 30, 28, 51], fill=hexc('#f6faff'))
        if n >= 2: d.ellipse([7, 16, 24, 33], fill=hexc('#ffffff'))
        if n >= 3:
            d.ellipse([10, 4, 21, 17], fill=hexc('#ffffff'))
            d.point((13, 9), fill=hexc('#1a1a1a')); d.point((18, 9), fill=hexc('#1a1a1a'))
            d.polygon([(15, 11), (16, 12), (22, 12)], fill=hexc('#f08a2a'))
            d.rectangle([9, 15, 22, 17], fill=hexc('#c0392b')); d.rectangle([19, 17, 21, 23], fill=hexc('#c0392b'))
            d.rectangle([10, 0, 21, 4], fill=hexc('#2a2a2a')); d.rectangle([8, 4, 23, 5], fill=hexc('#2a2a2a'))
            for y in (21, 26): d.point((15, y), fill=hexc('#2a2a2a'))
        out[f'snowman-{n}'] = outline(sm, hexc('#8aa0bc'))
    # snow globe for the house
    g = Image.new('RGBA', (24, 28), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    d.rectangle([3, 21, 20, 27], fill=hexc('#6b4226')); d.line([(3, 21), (20, 21)], fill=hexc('#8c5a36'))
    d.ellipse([1, 1, 22, 23], fill=hexc('#bfe0f4')); d.ellipse([3, 14, 20, 23], fill=hexc('#ffffff'))
    d.ellipse([9, 11, 14, 16], fill=hexc('#1e1c22')); d.polygon([(9, 12), (9, 9), (11, 11)], fill=hexc('#1e1c22')); d.polygon([(14, 12), (14, 9), (12, 11)], fill=hexc('#1e1c22'))
    for x, y in [(6, 6), (15, 4), (18, 10), (8, 3), (12, 7)]: d.point((x, y), fill=hexc('#ffffff'))
    d.arc([3, 3, 12, 12], 180, 260, fill=hexc('#ffffff'))
    out['snowglobe'] = outline(g)
    return out

def kots():
    """A historic puddle and its memorial plaque."""
    img = Image.new('RGBA', (64, 40), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    rnd = random.Random(13)
    # the puddle
    d.ellipse([4, 22, 44, 38], fill=hexc('#c8c25a', 230))
    d.ellipse([10, 20, 30, 33], fill=hexc('#d6d06a', 230))
    d.ellipse([26, 26, 40, 36], fill=hexc('#b8b24a', 230))
    for _ in range(14):
        x, y = rnd.randint(8, 40), rnd.randint(23, 35)
        d.rectangle([x, y, x + 1, y + 1], fill=hexc(rnd.choice(['#e8a040', '#8a9a3a', '#f0e090', '#c87830'])))
    d.point((14, 24), fill=hexc('#ffffff')); d.point((15, 24), fill=hexc('#ffffff'))
    # plaque on a post
    d.rectangle([49, 18, 51, 39], fill=hexc('#6b4226'))
    d.rectangle([42, 4, 61, 19], fill=hexc('#c9a040')); d.rectangle([44, 6, 59, 17], fill=hexc('#e0bc5a'))
    for y in (9, 12, 15): d.line([(46, y), (57, y)], fill=hexc('#8a6a20'))
    return outline(img)

def save(img, name):
    img.save(OUT / name)
    print('wrote', name, img.size)

if __name__ == '__main__':
    save(palm(1), 'bali-palm-a.png')
    save(palm(2, h=96, lean=10), 'bali-palm-b.png')
    save(palm(5, h=132, lean=18), 'bali-palm-c.png')
    save(warung(), 'bali-warung.png')
    save(casa(), 'bali-casa.png')
    save(gate(), 'bali-gate.png')
    save(jukung(), 'bali-jukung.png')
    save(sunbed(), 'bali-sunbed.png')
    save(parasol(), 'bali-parasol.png')
    save(canang(), 'bali-canang.png')
    save(surfboard('#f5c400', '#e8584a'), 'bali-surf-a.png')
    save(surfboard('#7fd0e8', '#ffffff'), 'bali-surf-b.png')
    save(torch(), 'bali-torch.png')
    save(frangipani(), 'bali-frangipani.png')
    save(worldmap(), 'worldmap.png')
    if LPC:
        import shutil
        shutil.copy(LPC / 'Objects/Furniture/Seating/Bar Stools.png', OUT / 'barstools.png')
        print('copied bar stools')
        save(big_pool(Image.open(LPC / 'Structure/Misc/Pool A.png').convert('RGBA'), 5, 3), 'bali-pool.png')
    save(pier(), 'bali-pier.png')
    save(busstop(), 'busstop.png')
    save(plane(), 'plane.png')
    save(basket(), 'bali-basket.png')
    save(bed(), 'bali-bed.png')
    save(daybed(), 'bali-daybed.png')
    save(ikat_rug(), 'bali-rug.png')
    save(frog(), 'bali-frog.png')
    save(view(), 'bali-view.png')
    save(gecko(), 'bali-gecko.png')
    save(mosquito(), 'bali-mosquito.png')
    save(monkey(), 'bali-monkey.png')
    save(coconut(), 'bali-coconut.png')
    for k, im in surf_assets().items(): save(im, 'bali-' + k + '.png')
    save(sea_turtle(), 'bali-turtle.png')
    save(baby_turtle(), 'bali-turtle-baby.png')
    save(turtle_side(), 'bali-turtle-side.png')
    save(dolphin(), 'bali-dolphin.png')
    save(hatchery(), 'bali-hatchery.png')
    save(mole(), 'mole.png')
    save(cat(), 'cat.png')
    save(kots(), 'bali-kots.png')
    for k, im in snow_assets().items(): save(im, k + '.png')
