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
