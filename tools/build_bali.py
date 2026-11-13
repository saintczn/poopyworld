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
    brasil = blob(262, 54, 42, 28, 9, 0.2)
    a = np.array(img)
    for land in (home, bali, brasil):
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
    coast = (home | bali | brasil)
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
    # Brazil: a sugarloaf bump, palms and a tiny flag
    d.polygon([(278, 52), (284, 38), (290, 52)], fill=hexc('#8a8478')); d.line([(270, 44), (284, 38)], fill=hexc('#3a3a3a'))
    for x, y in [(244, 58), (252, 66), (268, 70), (236, 50)]:
        d.line([(x, y), (x + 1, y - 6)], fill=hexc('#7a5634'))
        for dx, dy in [(-4, -6), (4, -6), (-3, -9), (3, -9)]: d.line([(x + 1, y - 6), (x + 1 + dx, y - 6 + dy // 2 + 2)], fill=hexc('#3c7a30'))
    d.rectangle([255, 40, 266, 47], fill=hexc('#2f9a4a')); d.polygon([(257, 43), (260, 41), (264, 43), (260, 46)], fill=hexc('#f5d000')); d.point((260, 43), fill=hexc('#24418c'))
    d.line([(255, 40), (255, 52)], fill=hexc('#5a3a1c'))
    for i in range(0, 60):
        t = i / 60
        x = 150 + (250 - 150) * t; y = 118 + (58 - 118) * t - 18 * math.sin(t * math.pi)
        if i % 3 == 0: d.point((int(x), int(y)), fill=hexc('#ffffff'))
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
    cx, cy = 20, 158
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

# ================================================================ Brazil (Copacabana)
def calcadao(w=128, h=96):
    """The Copacabana promenade: black and white waves in mosaic stones. Tiles horizontally."""
    img = Image.new('RGBA', (w, h), hexc('#f4f1ea'))
    d = ImageDraw.Draw(img)
    for x in range(w):
        for y in range(h):
            # waves running along x, repeating every 32px across, phase per band
            band = y / 24.0
            wave = math.sin((x / w) * 2 * math.pi * 2) * 5
            v = (y + wave) % 24
            if 6 <= v < 15:
                d.point((x, y), fill=hexc('#2a2a2e'))
    # mosaic stones: little grout lines
    for y in range(0, h, 3):
        off = (y // 3) % 2
        for x in range(off, w, 3): d.point((x, y), fill=hexc('#bdb8ae') if img.getpixel((x, y))[0] > 128 else hexc('#16161a'))
    return img

def facade(seed, wall, trim, w=192, h=208):
    rnd = random.Random(seed)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    W, Hc = hexc(wall), hexc(trim)
    # flat roof with a little parapet
    d.rectangle([4, 10, w - 5, h - 1], fill=W)
    d.rectangle([0, 4, w - 1, 12], fill=Hc)
    d.line([(0, 12), (w - 1, 12)], fill=hexc('#00000040'))
    # shading on the right
    d.rectangle([w - 14, 13, w - 5, h - 1], fill=tuple(max(0, c - 22) for c in W[:3]) + (255,))
    # rows of windows with balconies
    for fy in range(26, h - 60, 46):
        for fx in range(18, w - 30, 44):
            d.rectangle([fx, fy, fx + 22, fy + 28], fill=hexc('#3a5a6a'))
            d.rectangle([fx + 2, fy + 2, fx + 20, fy + 26], fill=hexc('#7fb5c9'))
            d.line([(fx + 11, fy + 2), (fx + 11, fy + 26)], fill=hexc('#3a5a6a'))
            d.polygon([(fx + 4, fy + 26), (fx + 12, fy + 3), (fx + 16, fy + 3), (fx + 8, fy + 26)], fill=hexc('#b5e0ec'))
            # balcony rail
            d.rectangle([fx - 4, fy + 28, fx + 26, fy + 30], fill=Hc)
            for bx in range(fx - 3, fx + 26, 4): d.line([(bx, fy + 30), (bx, fy + 38)], fill=Hc)
            d.rectangle([fx - 4, fy + 38, fx + 26, fy + 40], fill=Hc)
            if rnd.random() < 0.5:   # plants on the balcony
                for k in range(3): d.ellipse([fx + k * 8 - 2, fy + 32, fx + k * 8 + 5, fy + 38], fill=hexc('#3c8a30'))
                d.point((fx + 2, fy + 33), fill=hexc('#e8584a'))
    # ground floor: shop with awning
    gy = h - 52
    d.rectangle([12, gy + 10, w - 20, h - 1], fill=hexc('#4a3a30'))
    d.rectangle([16, gy + 14, w - 24, h - 6], fill=hexc('#7fb5c9'))
    for x in range(12, w - 20, 12):
        d.polygon([(x, gy), (x + 12, gy), (x + 12, gy + 10), (x, gy + 10)], fill=Hc if (x // 12) % 2 else hexc('#ffffff'))
    d.rectangle([w // 2 - 10, gy + 14, w // 2 + 10, h - 1], fill=hexc('#5a4030'))
    return outline(img)

def sugarloaf():
    W, H = 260, 220
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    rnd = random.Random(31)
    # the big rock dome
    pts = []
    for i in range(0, 181, 6):
        a = math.radians(i)
        rx = 92 + rnd.uniform(-2, 2); ry = 190
        pts.append((130 + math.cos(a) * rx * (1 + 0.15 * math.sin(a * 3)), 210 - math.sin(a) ** 0.8 * ry))
    d.polygon(pts, fill=hexc('#8a8478'))
    # light side and streaks of rock
    for x in range(50, 140):
        for y in range(20, 210):
            if img.getpixel((x, y))[3] and (x * 3 + y) % 17 == 0: d.point((x, y), fill=hexc('#a8a294'))
    for x in range(150, 220):
        for y in range(30, 210):
            if img.getpixel((x, y))[3] and (x + y * 2) % 13 == 0: d.point((x, y), fill=hexc('#6c675d'))
    # forest at the foot and on the sides
    for _ in range(120):
        x = rnd.randint(30, 230); y = rnd.randint(150, 214)
        if img.getpixel((min(W - 1, x), min(H - 1, y)))[3]:
            d.ellipse([x - 6, y - 5, x + 6, y + 5], fill=hexc(rnd.choice(['#2f6b2a', '#3c7a30', '#4f9438'])))
    for _ in range(30):
        x = rnd.randint(70, 200); y = rnd.randint(40, 120)
        if img.getpixel((x, y))[3]: d.ellipse([x - 4, y - 3, x + 4, y + 3], fill=hexc('#3c7a30'))
    # cable car station on top
    d.rectangle([118, 16, 142, 28], fill=hexc('#e8e2d0')); d.rectangle([116, 12, 144, 16], fill=hexc('#c0392b'))
    return outline(img)

def kiosk():
    W, H = 128, 112
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    # green and yellow kiosk, round roof
    d.rectangle([14, 46, 113, 104], fill=hexc('#2f8a4a'))
    d.rectangle([20, 52, 107, 80], fill=hexc('#fff3c8'))
    # goods on the counter
    for i, c in enumerate(['#7a3a8a', '#4f8a3a', '#f0c040', '#7a3a8a', '#e8e2d0']):
        x = 26 + i * 16
        d.rectangle([x, 66, x + 9, 79], fill=hexc(c)); d.rectangle([x + 1, 64, x + 8, 66], fill=hexc('#ffffff'))
    # coconuts piled up
    for x, y in [(30, 92), (40, 94), (35, 86), (90, 92), (100, 94)]:
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=hexc('#6a8a2a')); d.point((x - 2, y - 2), fill=hexc('#8ab04a'))
    d.rectangle([14, 80, 113, 84], fill=hexc('#f0c040'))
    # roof
    d.pieslice([0, 6, 127, 70], 180, 360, fill=hexc('#f0c040'))
    for x in range(8, 124, 14): d.polygon([(64, 8), (x, 38), (x + 7, 38)], fill=hexc('#2f8a4a'))
    d.rectangle([0, 36, 127, 46], fill=hexc('#2f8a4a'))
    d.line([(0, 46), (127, 46)], fill=hexc('#1f6a3a'))
    return outline(img)

def acai():
    img = Image.new('RGBA', (72, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([8, 34, 63, 68], fill=hexc('#6a2a7a'))
    d.rectangle([10, 30, 61, 36], fill=hexc('#e8e2d0'))
    for x in (14, 30, 46):
        d.ellipse([x, 22, x + 12, 32], fill=hexc('#4a1a5a')); d.ellipse([x + 3, 22, x + 9, 25], fill=hexc('#f0c040'))
    d.rectangle([33, 4, 36, 30], fill=hexc('#ffffff'))
    d.pieslice([10, 0, 60, 26], 180, 360, fill=hexc('#ff7aa0'))
    d.text((20, 44), 'ACAI', fill=hexc('#fff3c8'))
    return outline(img)

def lifeguard():
    img = Image.new('RGBA', (56, 88), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for x in (8, 44): d.line([(x, 40), (x + (6 if x < 20 else -6), 87)], fill=hexc('#c8c8c8'), width=3)
    d.line([(12, 66), (44, 66)], fill=hexc('#c8c8c8'), width=2)
    d.rectangle([4, 20, 52, 42], fill=hexc('#f4f1ea')); d.rectangle([8, 24, 48, 34], fill=hexc('#7fb5c9'))
    d.polygon([(0, 20), (28, 4), (56, 20)], fill=hexc('#e8584a'))
    d.rectangle([16, 36, 40, 42], fill=hexc('#e8584a'))
    d.text((20, 35), '5', fill=hexc('#ffffff'))
    return outline(img)

def flag_br():
    """Brazilian flag on a pole, 2 frames of 44x60."""
    img = Image.new('RGBA', (88, 60), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (44, 60), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.rectangle([2, 2, 4, 59], fill=hexc('#c8c8c8'))
        for x in range(5, 42):
            wv = int(round(math.sin(x / 6 + fr * 1.6) * 1.5))
            d.line([(x, 4 + wv), (x, 28 + wv)], fill=hexc('#2f9a4a'))
        d.polygon([(8, 16 + 0), (23, 6), (38, 16), (23, 26)], fill=hexc('#f5d000'))
        d.ellipse([16, 9, 30, 23], fill=hexc('#24418c'))
        d.line([(16, 15), (30, 17)], fill=hexc('#ffffff'))
        for x, y in [(19, 19), (25, 20), (22, 12)]: d.point((x, y), fill=hexc('#ffffff'))
        img.alpha_composite(outline(f), (fr * 44, 0))
    return img

def toucan():
    """Perched toucan, 2 frames (head turn) of 24x26."""
    img = Image.new('RGBA', (48, 26), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (24, 26), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([4, 6, 14, 22], fill=hexc('#1a1a1e'))
        d.ellipse([6, 8, 12, 14], fill=hexc('#fff3c8'))
        d.line([(9, 21), (7, 25)], fill=hexc('#1a1a1e'), width=2)
        sgn = 1 if fr == 0 else -1
        bx = 11 if fr == 0 else 7
        d.polygon([(bx, 7), (bx + 12 * sgn, 9), (bx + 10 * sgn, 13), (bx, 12)], fill=hexc('#f08a2a'))
        d.polygon([(bx, 7), (bx + 12 * sgn, 9), (bx + 8 * sgn, 8)], fill=hexc('#f5d000'))
        d.point((bx + 11 * sgn, 10), fill=hexc('#c0392b'))
        d.point((9 - sgn, 9), fill=hexc('#2a6ad0'))
        img.alpha_composite(outline(f), (fr * 24, 0))
    return img

def macaw():
    """Scarlet macaw flying, 2 frames of 40x28."""
    img = Image.new('RGBA', (80, 28), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (40, 28), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([12, 11, 30, 18], fill=hexc('#d8282a'))
        d.ellipse([27, 9, 35, 16], fill=hexc('#d8282a')); d.point((32, 11), fill=hexc('#fff3c8'))
        d.polygon([(34, 12), (38, 14), (34, 16)], fill=hexc('#e8e2d0'))
        d.polygon([(13, 14), (0, 18), (2, 15), (12, 12)], fill=hexc('#2a6ad0'))   # tail
        if fr == 0:
            d.polygon([(18, 12), (12, 0), (26, 3), (25, 12)], fill=hexc('#2a6ad0')); d.polygon([(18, 12), (16, 5), (23, 6), (24, 12)], fill=hexc('#f5d000'))
        else:
            d.polygon([(18, 16), (12, 27), (26, 24), (25, 16)], fill=hexc('#2a6ad0')); d.polygon([(18, 16), (16, 22), (23, 21), (24, 16)], fill=hexc('#f5d000'))
        img.alpha_composite(outline(f), (fr * 40, 0))
    return img

def goal_top():
    """A beach football goal seen from the top-down camera (opening facing down)."""
    img = Image.new('RGBA', (112, 52), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for y in range(4, 34, 4): d.line([(8, y), (103, y)], fill=hexc('#ffffff', 150))
    for x in range(8, 104, 4): d.line([(x, 4), (x, 34)], fill=hexc('#ffffff', 150))
    d.rectangle([4, 30, 8, 51], fill=hexc('#ffffff')); d.rectangle([103, 30, 107, 51], fill=hexc('#ffffff'))
    d.rectangle([4, 26, 107, 31], fill=hexc('#ffffff'))
    return outline(img, hexc('#5a5a5a'))

def ball():
    img = Image.new('RGBA', (14, 14), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([1, 1, 12, 12], fill=hexc('#ffffff'))
    d.polygon([(6, 4), (9, 6), (8, 9), (5, 9), (4, 6)], fill=hexc('#1a1a1a'))
    for x, y in [(2, 5), (10, 3), (11, 9), (3, 11), (7, 12)]: d.point((x, y), fill=hexc('#1a1a1a'))
    return outline(img)

def gondola():
    img = Image.new('RGBA', (20, 18), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.line([(10, 0), (10, 5)], fill=hexc('#3a3a3a'))
    d.rounded_rectangle([2, 5, 17, 17], 3, fill=hexc('#e8e2d0')); d.rectangle([4, 8, 15, 12], fill=hexc('#7fb5c9'))
    d.rectangle([2, 14, 17, 15], fill=hexc('#c0392b'))
    return outline(img)

# ================================================================ Paraty
def pe_de_moleque(w=128, h=128):
    """Paraty's big irregular river stones ("pé-de-moleque"), tileable."""
    rnd = random.Random(41)
    img = Image.new('RGBA', (w, h), hexc('#5a5048'))
    d = ImageDraw.Draw(img)
    cols = ['#9a8e80', '#8a7e70', '#a89c8c', '#7e7468', '#b0a494', '#948a7c']
    # jittered grid of rounded stones, drawn with wrap-around so it tiles
    step = 16
    for gy in range(0, h, step):
        for gx in range(0, w, step):
            cx = gx + rnd.randint(2, 6); cy = gy + rnd.randint(2, 6)
            rw = rnd.randint(9, 13); rh = rnd.randint(8, 12)
            c = hexc(rnd.choice(cols))
            for ox in (-w, 0, w):
                for oy in (-h, 0, h):
                    d.ellipse([cx + ox - 1, cy + oy - 1, cx + ox + rw, cy + oy + rh], fill=c)
                    d.arc([cx + ox - 1, cy + oy - 1, cx + ox + rw, cy + oy + rh], 200, 300, fill=hexc('#c4b8a8'))
                    d.arc([cx + ox - 1, cy + oy - 1, cx + ox + rw, cy + oy + rh], 20, 120, fill=hexc('#4a4038'))
    return img

def colonial(seed, door, w=160, h=156, two=False):
    """A white colonial house of Paraty: thick white walls, coloured door and window frames, terracotta roof."""
    rnd = random.Random(seed)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    D = hexc(door); Dd = tuple(max(0, c - 40) for c in D[:3]) + (255,)
    roof_h = 34
    # roof (seen a bit from the front): curved terracotta tiles
    d.polygon([(0, roof_h), (12, 4), (w - 13, 4), (w - 1, roof_h)], fill=hexc('#b5562e'))
    for x in range(4, w - 2, 6):
        d.line([(x, 6), (x - (x - w / 2) * 0.08, roof_h - 1)], fill=hexc('#8a3c1e'))
    for y in range(8, roof_h, 6): d.line([(6, y), (w - 7, y)], fill=hexc('#c8683a'))
    d.line([(0, roof_h), (w - 1, roof_h)], fill=hexc('#6a2a14'))
    # white wall with a coloured corner trim and plinth
    d.rectangle([4, roof_h + 1, w - 5, h - 1], fill=hexc('#f6f2ea'))
    for _ in range(80):
        d.point((rnd.randint(5, w - 6), rnd.randint(roof_h + 2, h - 2)), fill=hexc('#e6e0d4'))
    d.rectangle([4, roof_h + 1, 9, h - 1], fill=D); d.rectangle([w - 10, roof_h + 1, w - 5, h - 1], fill=D)
    d.rectangle([4, h - 10, w - 5, h - 1], fill=D)
    # cornice
    d.rectangle([2, roof_h + 1, w - 3, roof_h + 4], fill=hexc('#ffffff')); d.line([(2, roof_h + 5), (w - 3, roof_h + 5)], fill=hexc('#d8d0c0'))
    def window(x, y, ww=22, wh=30, balcony=False):
        d.rectangle([x - 3, y - 3, x + ww + 2, y + wh + 2], fill=D)
        d.rectangle([x, y, x + ww - 1, y + wh - 1], fill=Dd)
        # shutters with slats
        for k in (0, ww // 2):
            for yy in range(y + 2, y + wh - 2, 3): d.line([(x + k + 1, yy), (x + k + ww // 2 - 2, yy)], fill=D)
        d.line([(x + ww // 2, y), (x + ww // 2, y + wh - 1)], fill=hexc('#2a2a2a'))
        if balcony:
            d.rectangle([x - 6, y + wh, x + ww + 5, y + wh + 3], fill=hexc('#4a3a30'))
            for bx in range(x - 5, x + ww + 5, 3): d.line([(bx, y + wh - 8), (bx, y + wh)], fill=hexc('#2a2a2a'))
            d.line([(x - 6, y + wh - 8), (x + ww + 5, y + wh - 8)], fill=hexc('#2a2a2a'))
    if two:
        for wx in (22, w // 2 - 11, w - 44): window(wx, roof_h + 12, balcony=True)
        gy = roof_h + 62
    else:
        gy = roof_h + 18
    # ground floor: door in the middle, windows beside
    dx = w // 2 - 14
    d.rectangle([dx - 4, gy - 4, dx + 31, h - 10], fill=D)
    d.rectangle([dx, gy, dx + 27, h - 10], fill=Dd)
    d.line([(dx + 14, gy), (dx + 14, h - 10)], fill=hexc('#2a2a2a'))
    for yy in range(gy + 4, h - 12, 8):
        d.rectangle([dx + 3, yy, dx + 11, yy + 5], outline=D); d.rectangle([dx + 17, yy, dx + 25, yy + 5], outline=D)
    d.arc([dx - 4, gy - 16, dx + 31, gy + 12], 180, 360, fill=D, width=3)
    for wx in (16, w - 40):
        window(wx, gy + 4, 22, 34)
    # a pot of flowers by the door
    for fx in (dx - 12, dx + 38):
        d.rectangle([fx, h - 18, fx + 8, h - 10], fill=hexc('#b5562e'))
        d.ellipse([fx - 3, h - 28, fx + 11, h - 16], fill=hexc('#3c8a30'))
        d.point((fx + 2, h - 25), fill=hexc(rnd.choice(['#ff4f8b', '#f5c400', '#ffffff']))); d.point((fx + 7, h - 22), fill=hexc('#ff4f8b'))
    return outline(img)

def church():
    """Igreja de Santa Rita: white, baroque, with one bell tower and blue-trimmed windows."""
    W, H = 200, 236
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    white, shade, trim = hexc('#fbf8f0'), hexc('#e2dccc'), hexc('#3a6ab0')
    # nave
    d.rectangle([10, 96, 140, H - 1], fill=white)
    d.polygon([(4, 96), (75, 46), (146, 96)], fill=white)
    d.polygon([(10, 96), (75, 54), (140, 96)], outline=shade)
    # baroque curls on the gable
    for x, sgn in ((22, 1), (128, -1)): d.arc([x - 10, 76, x + 10, 96], 180 if sgn > 0 else 270, 270 if sgn > 0 else 360, fill=shade, width=2)
    d.ellipse([67, 66, 83, 82], outline=trim, width=2)
    d.line([(75, 34), (75, 48)], fill=hexc('#6a6a6a')); d.line([(70, 39), (80, 39)], fill=hexc('#6a6a6a'))
    # door and windows with blue frames
    d.rectangle([58, H - 62, 92, H - 1], fill=trim); d.rectangle([62, H - 58, 88, H - 1], fill=hexc('#2a4a80'))
    d.arc([58, H - 76, 92, H - 48], 180, 360, fill=trim, width=3)
    for x in (24, 110):
        d.rectangle([x - 2, 124, x + 17, 160], fill=trim); d.rectangle([x + 1, 127, x + 14, 157], fill=hexc('#2a4a80'))
    # the tower (right)
    d.rectangle([140, 40, 194, H - 1], fill=white)
    d.rectangle([186, 40, 194, H - 1], fill=shade)
    d.rectangle([148, 60, 186, 92], fill=hexc('#3a3a3a'))
    d.arc([148, 50, 186, 76], 180, 360, fill=white, width=4)
    d.ellipse([160, 70, 174, 86], fill=hexc('#c9a040'))
    d.polygon([(136, 40), (167, 6), (198, 40)], fill=hexc('#b5562e'))
    d.line([(167, 0), (167, 8)], fill=hexc('#6a6a6a')); d.line([(163, 3), (171, 3)], fill=hexc('#6a6a6a'))
    for y in (110, 150, 190): d.line([(140, y), (194, y)], fill=shade)
    d.rectangle([152, 120, 180, 140], fill=trim); d.rectangle([155, 123, 177, 137], fill=hexc('#2a4a80'))
    # plinth
    d.rectangle([4, H - 8, 196, H - 1], fill=hexc('#c4bfb2'))
    return outline(img)

def serra(w=512, h=176):
    """Green mountains of the Serra do Mar, tileable sideways."""
    rnd = random.Random(55)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for layer, (col, base, amp) in enumerate([('#5f8f6a', 60, 40), ('#3f7a46', 100, 36), ('#2f6a36', 136, 26)]):
        pts = [(0, h)]
        for x in range(0, w + 1, 4):
            y = base - amp * (0.5 + 0.5 * math.sin(x / w * math.pi * 2 * (2 + layer) + layer)) - 10 * math.sin(x / w * math.pi * 2 * 7 + layer * 2)
            pts.append((x, y))
        pts.append((w, h))
        d.polygon(pts, fill=hexc(col))
        for _ in range(500):
            x = rnd.randint(0, w - 1); y = rnd.randint(int(base - amp), h - 1)
            if img.getpixel((x, y))[:3] == hexc(col)[:3]:
                d.ellipse([x - 3, y - 2, x + 3, y + 2], fill=hexc(['#4f8a5a', '#2f6a3a', '#3f7a40'][layer]))
    return img

def waterfall():
    """Cachoeira do Tobogã: a long sloping rock where the water slides down. 2 frames."""
    W, H = 160, 288
    img = Image.new('RGBA', (W * 2, H), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        rnd = random.Random(8)
        # forest on both sides
        for _ in range(140):
            x = rnd.choice([rnd.randint(0, 36), rnd.randint(124, 159)]); y = rnd.randint(0, H - 60)
            d.ellipse([x - 9, y - 7, x + 9, y + 7], fill=hexc(rnd.choice(['#2f6b2a', '#3c7a30', '#4f9438'])))
        # the smooth dark rock slab
        d.polygon([(40, 0), (120, 0), (128, H - 56), (32, H - 56)], fill=hexc('#5a5650'))
        d.polygon([(46, 0), (70, 0), (60, H - 56), (40, H - 56)], fill=hexc('#6c675f'))
        # water sheet with moving streaks
        d.polygon([(56, 0), (104, 0), (110, H - 56), (50, H - 56)], fill=hexc('#7fc0d8', 210))
        for k in range(26):
            y = (k * 11 + fr * 6) % (H - 60)
            x = 60 + (k * 17) % 40
            d.line([(x, y), (x + 1, y + 8)], fill=hexc('#e8f8ff', 230))
        # the pool at the bottom
        d.ellipse([16, H - 70, 144, H - 2], fill=hexc('#3f9ab8'))
        d.ellipse([28, H - 64, 132, H - 12], fill=hexc('#5ab0c8'))
        for k in range(10):
            x = 50 + (k * 13 + fr * 5) % 60
            d.arc([x - 6, H - 58, x + 6, H - 50], 0, 180, fill=hexc('#ffffff'))
        f = outline(f)
        img.alpha_composite(f, (fr * W, 0))
    return img

def escuna(hull, stripe):
    """A Paraty schooner, side view from a bit above: colourful hull, two masts, awning."""
    W, H = 136, 84
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    # masts and rigging
    for x in (46, 92):
        d.line([(x, 2), (x, 52)], fill=hexc('#6b4226'), width=2)
    d.line([(46, 4), (8, 54)], fill=hexc('#3a3a3a')); d.line([(92, 4), (130, 54)], fill=hexc('#3a3a3a'))
    for x in range(10, 128, 18): d.point((x, 14), fill=hexc(rnd_flag(x)))
    d.line([(8, 14), (128, 14)], fill=hexc('#3a3a3a'))
    # awning over the deck
    d.rectangle([30, 34, 108, 40], fill=hexc('#f4f1ea'))
    for x in range(30, 108, 8): d.rectangle([x, 34, x + 3, 40], fill=hexc(stripe))
    d.line([(34, 40), (34, 54)], fill=hexc('#6b4226')); d.line([(104, 40), (104, 54)], fill=hexc('#6b4226'))
    # hull
    d.polygon([(2, 50), (134, 50), (124, 74), (14, 74)], fill=hexc(hull))
    d.rectangle([6, 50, 130, 54], fill=hexc('#ffffff'))
    d.line([(14, 64), (124, 64)], fill=hexc(stripe), width=3)
    d.polygon([(124, 50), (134, 44), (134, 50)], fill=hexc(hull))
    for x in (40, 60, 80, 100): d.ellipse([x, 56, x + 5, 61], fill=hexc('#2a2a2a'))
    return outline(img)

def rnd_flag(x):
    return ['#e8584a', '#f5c400', '#2f8a4a', '#3a6ab0', '#ffffff'][(x // 18) % 5]

def canoe():
    img = Image.new('RGBA', (72, 20), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.polygon([(2, 8), (70, 8), (62, 18), (10, 18)], fill=hexc('#2f8a8a'))
    d.rectangle([4, 7, 68, 9], fill=hexc('#f5c400'))
    d.line([(20, 12), (52, 12)], fill=hexc('#e8584a'))
    d.line([(46, 2), (58, 16)], fill=hexc('#8a6440'), width=2)
    return outline(img)

def hummingbird():
    """Beija-flor, hovering, 2 frames of 16x12."""
    img = Image.new('RGBA', (32, 12), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (16, 12), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([4, 4, 11, 9], fill=hexc('#2fa88a')); d.ellipse([9, 3, 13, 7], fill=hexc('#2f8ad0'))
        d.line([(13, 5), (16, 6)], fill=hexc('#1a1a1a'))
        d.line([(1, 7), (4, 7)], fill=hexc('#1f6a5a'))
        if fr == 0: d.polygon([(6, 5), (3, 0), (9, 2)], fill=hexc('#bfe8e0', 200))
        else: d.polygon([(6, 7), (3, 11), (9, 10)], fill=hexc('#bfe8e0', 200))
        d.point((7, 7), fill=hexc('#e8584a'))
        img.alpha_composite(f, (fr * 16, 0))
    return img

def doces():
    """A sweets stall: cocada and paçoca."""
    img = Image.new('RGBA', (72, 68), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([6, 34, 65, 66], fill=hexc('#8a5a34')); d.rectangle([4, 30, 67, 36], fill=hexc('#b07a48'))
    for i, c in enumerate(['#f4ecd8', '#c88a50', '#f4ecd8', '#e8b060', '#ffffff', '#c88a50']):
        x = 8 + i * 9; d.rectangle([x, 26, x + 6, 31], fill=hexc(c))
    d.rectangle([8, 2, 11, 30], fill=hexc('#6b4226')); d.rectangle([60, 2, 63, 30], fill=hexc('#6b4226'))
    for x in range(4, 68, 8): d.polygon([(x, 2), (x + 8, 2), (x + 8, 12), (x, 12)], fill=hexc('#2f8a4a' if (x // 8) % 2 else '#f5c400'))
    d.line([(4, 12), (67, 12)], fill=hexc('#1f6a3a'))
    return outline(img)

# ================================================================ more Rio
def footvolley():
    img = Image.new('RGBA', (136, 52), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for x in (4, 130): d.rectangle([x, 4, x + 2, 51], fill=hexc('#d8d8d8'))
    d.rectangle([6, 6, 130, 24], fill=hexc('#ffffff', 60))
    for x in range(6, 130, 5): d.line([(x, 6), (x, 24)], fill=hexc('#ffffff', 170))
    for y in range(6, 25, 5): d.line([(6, y), (130, y)], fill=hexc('#ffffff', 170))
    d.rectangle([6, 4, 130, 6], fill=hexc('#ffffff'))
    return outline(img, hexc('#6a6a6a'))

def canga(c1, c2):
    img = Image.new('RGBA', (52, 28), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([2, 2, 49, 25], fill=hexc(c1))
    for x in range(2, 50, 8): d.rectangle([x, 2, x + 3, 25], fill=hexc(c2))
    for x in range(2, 50, 3): d.point((x, 26), fill=hexc(c1)); d.point((x, 1), fill=hexc(c1))
    return img

def sandcastle():
    img = Image.new('RGBA', (40, 34), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    s, sd = hexc('#e6c488'), hexc('#c8a468')
    d.rectangle([4, 16, 35, 32], fill=s)
    for x in (4, 16, 28):
        d.rectangle([x, 8, x + 7, 18], fill=s)
        for k in range(0, 8, 3): d.rectangle([x + k, 5, x + k + 1, 8], fill=s)
    d.rectangle([17, 24, 22, 32], fill=sd)
    d.line([(20, 0), (20, 8)], fill=hexc('#6a6a6a')); d.polygon([(20, 0), (26, 2), (20, 4)], fill=hexc('#e8584a'))
    d.line([(4, 32), (35, 32)], fill=sd)
    return outline(img, hexc('#a88448'))

def seagull():
    img = Image.new('RGBA', (40, 14), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (20, 14), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([7, 6, 13, 9], fill=hexc('#ffffff'))
        d.point((14, 7), fill=hexc('#f5c400'))
        if fr == 0: d.line([(2, 2), (7, 7), (10, 6), (13, 7), (18, 2)], fill=hexc('#4a4a4a'), width=1)
        else: d.line([(2, 9), (7, 7), (10, 6), (13, 7), (18, 9)], fill=hexc('#4a4a4a'), width=1)
        img.alpha_composite(f, (fr * 20, 0))
    return img

def streetlamp():
    img = Image.new('RGBA', (20, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([9, 12, 10, 71], fill=hexc('#3a3a42'))
    d.rectangle([6, 66, 13, 71], fill=hexc('#3a3a42'))
    d.line([(10, 12), (16, 6)], fill=hexc('#3a3a42'))
    d.ellipse([12, 3, 19, 10], fill=hexc('#fff2c0'))
    return outline(img)

def globe_cart():
    """The Biscoito Globo / Mate vendor's barrels."""
    img = Image.new('RGBA', (30, 30), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([2, 10, 13, 28], fill=hexc('#c0c4c8')); d.ellipse([2, 6, 13, 13], fill=hexc('#d8dce0'))
    d.text((4, 16), 'M', fill=hexc('#2f8a4a'))
    d.rectangle([16, 4, 28, 28], fill=hexc('#f4f1ea'))
    for y in range(6, 28, 5): d.ellipse([18, y, 26, y + 3], fill=hexc('#e8c070'))
    d.line([(16, 4), (28, 4)], fill=hexc('#2f6ab0'), width=2)
    return outline(img)

# ================================================================ PUCK party games
def strawberry():
    """An angry strawberry, 2 frames of 30x32 (hop)."""
    img = Image.new('RGBA', (60, 32), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (30, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        y0 = 6 if fr == 0 else 4
        d.polygon([(4, y0 + 6), (26, y0 + 6), (24, y0 + 16), (15, y0 + 26), (6, y0 + 16)], fill=hexc('#d8282a'))
        d.ellipse([3, y0 + 2, 27, y0 + 18], fill=hexc('#e8383a'))
        d.ellipse([6, y0 + 4, 14, y0 + 10], fill=hexc('#f86a6a'))
        for x, y in [(8, 14), (14, 12), (20, 14), (11, 19), (17, 19), (14, 24), (23, 18), (6, 18)]:
            d.point((x, y + y0 - 4), fill=hexc('#ffe27a'))
        # leaves
        for dx in (-7, -3, 1, 5):
            d.polygon([(15, y0 + 3), (15 + dx, y0 - 3), (15 + dx + 3, y0 + 2)], fill=hexc('#3c8a30'))
        # angry face
        d.line([(9, y0 + 9), (13, y0 + 11)], fill=hexc('#1a1a1a')); d.line([(21, y0 + 9), (17, y0 + 11)], fill=hexc('#1a1a1a'))
        d.point((11, y0 + 12), fill=hexc('#ffffff')); d.point((19, y0 + 12), fill=hexc('#ffffff'))
        d.arc([11, y0 + 15, 19, y0 + 21], 200, 340, fill=hexc('#1a1a1a'))
        # feet
        fx = 2 if fr == 0 else -2
        d.line([(10 + fx, y0 + 24), (9 + fx, 31)], fill=hexc('#2a1a1a')); d.line([(20 - fx, y0 + 24), (21 - fx, 31)], fill=hexc('#2a1a1a'))
        img.alpha_composite(outline(f), (fr * 30, 0))
    return img

def mms():
    """M&M-style candies in 6 colours, 12x10 each."""
    img = Image.new('RGBA', (72, 10), (0, 0, 0, 0))
    for i, c in enumerate(['#e8282a', '#f5c400', '#2f8a4a', '#2f6ab0', '#f08a2a', '#6a3a2a']):
        f = Image.new('RGBA', (12, 10), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([1, 1, 10, 8], fill=hexc(c)); d.ellipse([2, 2, 6, 4], fill=(255, 255, 255, 110))
        d.text((3, -1), 'm', fill=hexc('#ffffff'))
        img.alpha_composite(outline(f), (i * 12, 0))
    return img

def pen(colour):
    """A small fenced pen corner, 112x88, open on one side (drawn open at the bottom)."""
    img = Image.new('RGBA', (112, 88), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([4, 4, 107, 83], fill=hexc(colour, 70))
    for x in range(2, 110, 12): d.rectangle([x, 0, x + 4, 12], fill=hexc('#8a6440'))
    for y in range(2, 86, 12):
        d.rectangle([0, y, 4, y + 8], fill=hexc('#8a6440')); d.rectangle([107, y, 111, y + 8], fill=hexc('#8a6440'))
    d.rectangle([0, 3, 111, 5], fill=hexc('#6b4226'))
    return img

# ================================================================ Hollowmere, chapter 2
def mirror_stand():
    """A tall mirror on a pivot, 2 frames: '/' and '\\' (seen from the front-top). 32x44."""
    img = Image.new('RGBA', (64, 44), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (32, 44), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([6, 36, 26, 43], fill=hexc('#3a3030'))
        d.rectangle([14, 26, 17, 38], fill=hexc('#6b5a40'))
        if fr == 0: pts = [(4, 26), (12, 30), (28, 6), (20, 2)]
        else: pts = [(28, 26), (20, 30), (4, 6), (12, 2)]
        d.polygon(pts, fill=hexc('#c9a040'))
        inner = [(p[0] + (2 if p[0] < 16 else -2), p[1] + (1 if p[1] < 16 else -1)) for p in pts]
        d.polygon(inner, fill=hexc('#b8d8e8'))
        d.line([inner[0], inner[2]], fill=hexc('#ffffff', 200))
        img.alpha_composite(outline(f), (fr * 32, 0))
    return img

def moon_door():
    """A stone door with a carved moon, 2 frames: dull and glowing. 64x80."""
    img = Image.new('RGBA', (128, 80), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (64, 80), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.rectangle([2, 6, 61, 79], fill=hexc('#4a4450'))
        d.pieslice([2, 0, 61, 24], 180, 360, fill=hexc('#4a4450'))
        for y in range(12, 80, 12): d.line([(4, y), (59, y)], fill=hexc('#3a3440'))
        for y in range(12, 80, 24): d.line([(32, y), (32, y + 12)], fill=hexc('#3a3440'))
        c = '#e8f0ff' if fr else '#6a6470'
        d.ellipse([18, 24, 46, 52], fill=hexc(c))
        d.ellipse([26, 22, 50, 48], fill=hexc('#4a4450'))
        if fr:
            for x, y in [(14, 20), (50, 56), (12, 50), (52, 28)]: d.point((x, y), fill=hexc('#ffffff'))
        img.alpha_composite(outline(f), (fr * 64, 0))
    return img

def brazier():
    """A stone fire bowl with a flame, 2 frames of 28x40."""
    img = Image.new('RGBA', (56, 40), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (28, 40), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.rectangle([11, 24, 16, 38], fill=hexc('#5a5450')); d.rectangle([7, 36, 20, 39], fill=hexc('#4a4440'))
        d.pieslice([2, 14, 25, 32], 0, 180, fill=hexc('#6a6460'))
        d.rectangle([2, 20, 25, 23], fill=hexc('#7a7470'))
        sw = 2 if fr else -2
        d.polygon([(6, 21), (10 + sw, 6), (14, 13), (18 - sw, 2), (22, 21)], fill=hexc('#ff8a2a'))
        d.polygon([(9, 21), (12 + sw, 11), (15, 15), (17 - sw, 8), (19, 21)], fill=hexc('#ffe27a'))
        img.alpha_composite(outline(f), (fr * 28, 0))
    return img

def trapdoor():
    """A wooden trapdoor, 2 frames: closed and open (dark stairs). 48x36."""
    img = Image.new('RGBA', (96, 36), (0, 0, 0, 0))
    for fr in range(2):
        f = Image.new('RGBA', (48, 36), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        if fr == 0:
            d.rectangle([2, 4, 45, 33], fill=hexc('#7a5230'))
            for x in range(2, 46, 9): d.line([(x, 4), (x, 33)], fill=hexc('#5a3820'))
            d.rectangle([2, 10, 45, 12], fill=hexc('#3a3030')); d.rectangle([2, 26, 45, 28], fill=hexc('#3a3030'))
            d.ellipse([19, 15, 28, 23], outline=hexc('#8a8a8a'), width=2)
        else:
            d.rectangle([2, 4, 45, 33], fill=hexc('#120c10'))
            for k, y in enumerate(range(8, 33, 6)): d.rectangle([4 + k, y, 43 - k, y + 2], fill=hexc('#4a4450'))
            d.rectangle([2, 0, 45, 4], fill=hexc('#7a5230'))
        img.alpha_composite(outline(f), (fr * 48, 0))
    return img

def owl_seal():
    img = Image.new('RGBA', (40, 40), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([1, 1, 38, 38], fill=hexc('#a8b0c8')); d.ellipse([4, 4, 35, 35], fill=hexc('#c8d0e8'))
    d.arc([6, 3, 22, 19], 90, 270, fill=hexc('#e8f0ff'), width=3)   # half moon
    d.ellipse([13, 14, 27, 32], fill=hexc('#6a7090'))
    d.polygon([(13, 16), (15, 10), (18, 15)], fill=hexc('#6a7090')); d.polygon([(27, 16), (25, 10), (22, 15)], fill=hexc('#6a7090'))
    d.ellipse([15, 16, 19, 20], fill=hexc('#e8f0ff')); d.ellipse([21, 16, 25, 20], fill=hexc('#e8f0ff'))
    d.point((17, 18), fill=hexc('#1a1a1a')); d.point((23, 18), fill=hexc('#1a1a1a'))
    d.polygon([(19, 21), (21, 21), (20, 23)], fill=hexc('#e8c040'))
    return outline(img, hexc('#3a3a50'))

def star_rug():
    img = Image.new('RGBA', (96, 60), hexc('#2a3a7a')); d = ImageDraw.Draw(img)
    d.rectangle([3, 3, 92, 56], outline=hexc('#c9a040'), width=2)
    for x, y in [(20, 16), (48, 30), (74, 18), (30, 44), (66, 44), (14, 34), (84, 36)]:
        d.polygon([(x, y - 4), (x + 1, y - 1), (x + 4, y), (x + 1, y + 1), (x, y + 4), (x - 1, y + 1), (x - 4, y), (x - 1, y - 1)], fill=hexc('#e8d080'))
    for x in range(0, 96, 3): d.point((x, 0), fill=hexc('#c9a040')); d.point((x, 59), fill=hexc('#c9a040'))
    return img

def cobweb():
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for a in range(0, 91, 18):
        d.line([(0, 0), (int(31 * math.cos(math.radians(a))), int(31 * math.sin(math.radians(a))))], fill=(220, 220, 230, 140))
    for r in (8, 15, 22, 29): d.arc([-r, -r, r, r], 0, 90, fill=(220, 220, 230, 120))
    return img

# ================================================================ PUCK prizes
def plush_turtle():
    img = Image.new('RGBA', (26, 20), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([18, 6, 25, 13], fill=hexc('#9ad87a')); d.point((22, 8), fill=hexc('#1a1a1a')); d.point((23, 11), fill=hexc('#e8708a'))
    for x, y in [(4, 15), (16, 15), (6, 3), (15, 3)]: d.ellipse([x - 3, y - 2, x + 3, y + 3], fill=hexc('#9ad87a'))
    d.ellipse([2, 3, 20, 18], fill=hexc('#4f9a5a')); d.ellipse([5, 5, 17, 15], fill=hexc('#6ab870'))
    for cx, cy in [(11, 7), (8, 11), (14, 11)]: d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=hexc('#3f7a4a'))
    return outline(img)

def plush_goat():
    img = Image.new('RGBA', (24, 24), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([3, 9, 20, 22], fill=hexc('#f4f1ea'))
    for x in (5, 9, 14, 18): d.rectangle([x, 19, x + 1, 23], fill=hexc('#d8d0c0'))
    d.ellipse([12, 2, 22, 12], fill=hexc('#fffaf0'))
    d.line([(14, 3), (12, 0)], fill=hexc('#c8a878')); d.line([(19, 3), (21, 0)], fill=hexc('#c8a878'))
    d.point((15, 7), fill=hexc('#1a1a1a')); d.point((19, 7), fill=hexc('#1a1a1a'))
    d.point((17, 10), fill=hexc('#e8708a'))
    d.rectangle([2, 12, 4, 14], fill=hexc('#ff6a8a'))   # a little bow
    return outline(img)

def dartboard():
    img = Image.new('RGBA', (28, 30), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.polygon([(2, 6), (25, 6), (23, 17), (14, 28), (4, 17)], fill=hexc('#d8282a'))
    d.ellipse([1, 2, 26, 20], fill=hexc('#e8383a'))
    for r, c in ((9, '#ffffff'), (6, '#d8282a'), (3, '#ffffff'), (1, '#1a1a1a')):
        d.ellipse([13 - r, 11 - r, 13 + r, 11 + r], fill=hexc(c))
    for dx in (-6, -2, 2, 6): d.polygon([(13, 3), (13 + dx, -1), (13 + dx + 2, 3)], fill=hexc('#3c8a30'))
    d.line([(17, 9), (24, 4)], fill=hexc('#6b4226')); d.polygon([(23, 3), (26, 2), (25, 5)], fill=hexc('#2f6ab0'))
    return outline(img)

def trophy():
    img = Image.new('RGBA', (22, 30), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([5, 24, 16, 29], fill=hexc('#4a3020')); d.rectangle([9, 17, 12, 24], fill=hexc('#c9a040'))
    d.ellipse([3, 1, 18, 17], fill=hexc('#e8c040')); d.ellipse([5, 3, 11, 8], fill=hexc('#fff0a0'))
    for x, y in [(7, 10), (12, 6), (14, 12), (9, 13)]: d.point((x, y), fill=hexc('#a87820'))
    d.rectangle([6, 25, 15, 26], fill=hexc('#c9a040'))
    return outline(img)

# ================================================================ holidays
def xmas_tree():
    W, H = 64, 96
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([26, 78, 37, 92], fill=hexc('#6b4226'))
    d.rectangle([18, 86, 45, 95], fill=hexc('#c0392b')); d.line([(18, 88), (45, 88)], fill=hexc('#e8c040'))
    for i, (y0, y1, hw) in enumerate([(52, 82, 30), (30, 62, 24), (12, 40, 17)]):
        d.polygon([(32, y0 - (y1 - y0) + 6), (32 - hw, y1), (32 + hw, y1)], fill=hexc('#2f6b2a'))
        d.polygon([(32, y0 - (y1 - y0) + 8), (32 - hw + 6, y1 - 2), (32, y1 - 2)], fill=hexc('#3c8a36'))
        for x in range(32 - hw + 3, 32 + hw - 2, 5): d.point((x, y1 - 1), fill=hexc('#1f4a1e'))
    # garland and baubles
    for y, a in ((34, 1), (56, -1), (76, 1)):
        for k in range(-18, 19, 2): d.point((32 + k, y + (k * a) // 6), fill=hexc('#e8c040'))
    for x, y, c in [(24, 46, '#e8282a'), (40, 40, '#2f6ab0'), (20, 68, '#e8c040'), (44, 70, '#e8282a'), (32, 58, '#ffffff'), (30, 28, '#e8282a'), (14, 80, '#2f6ab0'), (50, 80, '#e8c040')]:
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=hexc(c)); d.point((x - 1, y - 1), fill=hexc('#ffffff'))
    # star
    d.polygon([(32, 0), (34, 5), (39, 5), (35, 8), (37, 13), (32, 10), (27, 13), (29, 8), (25, 5), (30, 5)], fill=hexc('#ffe27a'))
    return outline(img)

def present(c1, c2, w=20, h=16):
    img = Image.new('RGBA', (w + 2, h + 6), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([1, 5, w, h + 4], fill=hexc(c1))
    d.rectangle([w // 2 - 1, 5, w // 2 + 1, h + 4], fill=hexc(c2)); d.rectangle([1, 9, w, 10], fill=hexc(c2))
    d.ellipse([w // 2 - 6, 0, w // 2, 6], outline=hexc(c2), width=2); d.ellipse([w // 2, 0, w // 2 + 6, 6], outline=hexc(c2), width=2)
    return outline(img)

def shoe():
    img = Image.new('RGBA', (26, 22), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.polygon([(2, 20), (2, 10), (8, 8), (14, 12), (24, 15), (24, 20)], fill=hexc('#6b4226'))
    d.polygon([(2, 10), (8, 8), (9, 12), (3, 13)], fill=hexc('#8c5a36'))
    d.line([(2, 20), (24, 20)], fill=hexc('#3a2010'))
    d.line([(6, 9), (8, 0)], fill=hexc('#f08a2a'), width=3); d.line([(8, 0), (10, 2)], fill=hexc('#3c8a30'), width=2)   # a carrot for the horse
    return outline(img)

def choco_letter():
    img = Image.new('RGBA', (30, 34), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([1, 1, 28, 32], fill=hexc('#e8e2d0')); d.rectangle([3, 3, 26, 30], fill=hexc('#6a3a1a'))
    d.rectangle([3, 3, 26, 5], fill=hexc('#8a5a2a'))
    return outline(img)

def cake():
    img = Image.new('RGBA', (36, 34), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([1, 26, 34, 33], fill=hexc('#f4f1ea'))
    d.rectangle([4, 14, 31, 28], fill=hexc('#f8c8d8')); d.ellipse([4, 24, 31, 31], fill=hexc('#f8c8d8')); d.ellipse([4, 10, 31, 18], fill=hexc('#fff0f4'))
    for x in range(5, 31, 4): d.ellipse([x, 16, x + 3, 20], fill=hexc('#fff0f4'))
    for x, c in [(9, '#e8282a'), (17, '#2f6ab0'), (25, '#2f8a4a')]:
        d.rectangle([x, 4, x + 1, 12], fill=hexc(c)); d.ellipse([x - 1, 0, x + 2, 4], fill=hexc('#ffb030'))
    for x, y in [(8, 22), (14, 24), (22, 21), (27, 24)]: d.point((x, y), fill=hexc('#e8282a'))
    return outline(img)

def balloons():
    img = Image.new('RGBA', (48, 44), (0, 0, 0, 0))
    for i, (c, x) in enumerate([('#e8282a', 0), ('#f5c400', 16), ('#2f8ad0', 32)]):
        f = Image.new('RGBA', (16, 44), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        d.ellipse([2, 0, 13, 14], fill=hexc(c)); d.ellipse([4, 2, 7, 6], fill=(255, 255, 255, 140))
        d.polygon([(7, 14), (9, 14), (8, 16)], fill=hexc(c))
        for y in range(16, 44, 2): d.point((8 + ((y // 4) % 2), y), fill=hexc('#6a6a6a'))
        img.alpha_composite(outline(f), (x, 0))
    return img

def heart():
    img = Image.new('RGBA', (11, 10), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 5, 5], fill=hexc('#ff4f7a')); d.ellipse([5, 0, 10, 5], fill=hexc('#ff4f7a'))
    d.polygon([(0, 3), (10, 3), (5, 9)], fill=hexc('#ff4f7a')); d.point((2, 1), fill=hexc('#ffc0d0'))
    return img

def roses():
    img = Image.new('RGBA', (22, 34), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.polygon([(5, 20), (17, 20), (15, 33), (7, 33)], fill=hexc('#b8e0f0'))
    for x, y in [(6, 6), (11, 3), (16, 7), (9, 11), (14, 12)]:
        d.line([(x, y + 3), (11, 22)], fill=hexc('#3c8a30'))
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=hexc('#d8283a')); d.point((x - 1, y - 1), fill=hexc('#ff6a7a'))
    return outline(img)

def pepernoot():
    img = Image.new('RGBA', (8, 7), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 7, 6], fill=hexc('#b8742a')); d.ellipse([1, 1, 4, 3], fill=hexc('#d8944a'))
    return outline(img)

# ================================================================ Hollowmere, chapters 3 and 4
def gramophone():
    img = Image.new('RGBA', (40, 52), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([6, 30, 33, 50], fill=hexc('#6b4226')); d.line([(6, 30), (33, 30)], fill=hexc('#8c5a36'))
    d.rectangle([9, 33, 30, 47], outline=hexc('#4a2c18'))
    d.ellipse([8, 25, 31, 33], fill=hexc('#1a1a1a')); d.ellipse([17, 27, 22, 31], fill=hexc('#c0392b'))
    d.line([(26, 28), (24, 14)], fill=hexc('#c9a040'), width=2)
    d.polygon([(24, 14), (8, 0), (2, 6), (4, 16), (16, 18)], fill=hexc('#c9a040'))
    d.polygon([(8, 3), (4, 8), (6, 14), (14, 15)], fill=hexc('#e8c060'))
    d.ellipse([3, 2, 12, 16], fill=hexc('#3a2a10'))
    return outline(img)

def record(col):
    img = Image.new('RGBA', (18, 18), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 17, 17], fill=hexc('#1a1a1e'))
    for r in (7, 5): d.ellipse([9 - r, 9 - r, 8 + r, 8 + r], outline=hexc('#3a3a40'))
    d.ellipse([6, 6, 11, 11], fill=hexc(col)); d.point((8, 8), fill=hexc('#1a1a1e'))
    d.arc([2, 2, 15, 15], 200, 250, fill=hexc('#6a6a74'))
    return img

def gear(r, teeth, col='#a8843a'):
    n = r * 2 + 8
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    c = n / 2
    pts = []
    for i in range(teeth * 2):
        a = i / (teeth * 2) * math.pi * 2
        rr = r + 4 if i % 2 == 0 else r
        for da in (-0.5, 0.5):
            aa = a + da * math.pi / (teeth * 2)
            pts.append((c + math.cos(aa) * rr, c + math.sin(aa) * rr))
    d.polygon(pts, fill=hexc(col))
    d.ellipse([c - r + 6, c - r + 6, c + r - 6, c + r - 6], fill=hexc('#8a6a2a'))
    for k in range(4):
        a = k * math.pi / 2
        d.line([(c, c), (c + math.cos(a) * (r - 6), c + math.sin(a) * (r - 6))], fill=hexc(col), width=4)
    d.ellipse([c - 5, c - 5, c + 5, c + 5], fill=hexc('#4a3a1a'))
    return outline(img)

def clockface():
    n = 176
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    c = n / 2
    d.ellipse([0, 0, n - 1, n - 1], fill=hexc('#4a3a2a'))
    d.ellipse([6, 6, n - 7, n - 7], fill=hexc('#e8dcc0'))
    d.ellipse([12, 12, n - 13, n - 13], outline=hexc('#8a7a5a'), width=2)
    for i in range(60):
        a = i / 60 * math.pi * 2 - math.pi / 2
        r0 = 70 if i % 5 else 62
        d.line([(c + math.cos(a) * r0, c + math.sin(a) * r0), (c + math.cos(a) * 76, c + math.sin(a) * 76)], fill=hexc('#3a2a1a'), width=1 if i % 5 else 3)
    romans = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for i, rn in enumerate(romans):
        a = i / 12 * math.pi * 2 - math.pi / 2
        x, y = c + math.cos(a) * 50, c + math.sin(a) * 50
        w = len(rn) * 4
        d.text((x - w / 2, y - 5), rn, fill=hexc('#3a2a1a'))
    return outline(img)

def ladder():
    img = Image.new('RGBA', (28, 80), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for x in (3, 22): d.rectangle([x, 0, x + 3, 79], fill=hexc('#8a6440'))
    for y in range(6, 80, 10): d.rectangle([3, y, 25, y + 2], fill=hexc('#a8844c'))
    return outline(img)

def well():
    img = Image.new('RGBA', (64, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([4, 40, 59, 70], fill=hexc('#6c675f'))
    d.ellipse([10, 44, 53, 62], fill=hexc('#0c0a0e'))
    for a in range(0, 360, 30):
        x = 32 + math.cos(math.radians(a)) * 26; y = 55 + math.sin(math.radians(a)) * 13
        d.ellipse([x - 5, y - 4, x + 5, y + 4], fill=hexc('#8e8a80')); d.arc([x - 5, y - 4, x + 5, y + 4], 200, 330, fill=hexc('#aaa69a'))
    for x in (8, 54): d.rectangle([x, 8, x + 3, 50], fill=hexc('#6b4226'))
    d.polygon([(2, 12), (32, 0), (62, 12), (56, 16), (8, 16)], fill=hexc('#5a3820'))
    d.line([(10, 22), (54, 22)], fill=hexc('#8a6440'), width=3)
    d.line([(32, 22), (32, 42)], fill=hexc('#c8b890'))
    d.rectangle([28, 40, 36, 48], fill=hexc('#8a6440'))
    return outline(img)

def hooded():
    """A member of the Lantaarnkring: long dark robe and hood, carrying a lantern. 4 rows x 4 frames, 48x48."""
    FW = 48
    img = Image.new('RGBA', (FW * 4, FW * 4), (0, 0, 0, 0))
    robe, robe_l, robe_d = hexc('#2a2436'), hexc('#3e3650'), hexc('#18141e')
    for row, facing in enumerate(['down', 'up', 'left', 'right']):
        for fr in range(4):
            f = Image.new('RGBA', (FW, FW), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
            step = [0, 1, 0, -1][fr]; bob = 0 if fr % 2 == 0 else -1
            cx = 24
            # robe: a long bell shape, hem swinging
            d.polygon([(cx - 9, 14 + bob), (cx + 9, 14 + bob), (cx + 13 + step, 46), (cx - 13 + step, 46)], fill=robe)
            d.polygon([(cx - 6, 16 + bob), (cx, 16 + bob), (cx - 2 + step, 45), (cx - 10 + step, 45)], fill=robe_l)
            d.line([(cx - 13 + step, 46), (cx + 13 + step, 46)], fill=robe_d)
            # hood
            d.ellipse([cx - 9, 2 + bob, cx + 9, 20 + bob], fill=robe)
            d.polygon([(cx - 9, 10 + bob), (cx, -1 + bob), (cx + 9, 10 + bob)], fill=robe)
            if facing == 'down':
                d.ellipse([cx - 5, 8 + bob, cx + 5, 18 + bob], fill=hexc('#0a080c'))
                d.point((cx - 2, 12 + bob), fill=hexc('#ffd27a')); d.point((cx + 2, 12 + bob), fill=hexc('#ffd27a'))
            elif facing in ('left', 'right'):
                sgn = -1 if facing == 'left' else 1
                d.ellipse([cx + sgn * 2 - 4, 8 + bob, cx + sgn * 2 + 4, 18 + bob], fill=hexc('#0a080c'))
                d.point((cx + sgn * 4, 12 + bob), fill=hexc('#ffd27a'))
            # the lantern in one hand
            lx = cx + (12 if facing != 'left' else -12)
            if facing != 'up':
                d.line([(lx, 24 + bob), (lx, 28 + bob)], fill=hexc('#3a3a3a'))
                d.rectangle([lx - 3, 28 + bob, lx + 3, 35 + bob], fill=hexc('#c9a040'))
                d.rectangle([lx - 2, 29 + bob, lx + 2, 34 + bob], fill=hexc('#ffe27a'))
            # a gold lantern symbol on the chest
            if facing == 'down': d.rectangle([cx - 1, 24 + bob, cx + 1, 27 + bob], fill=hexc('#c9a040'))
            img.alpha_composite(outline(f, hexc('#08060a')), (fr * FW, row * FW))
    return img

def dais():
    img = Image.new('RGBA', (120, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([2, 26, 117, 70], fill=hexc('#4a4450'))
    d.ellipse([6, 18, 113, 60], fill=hexc('#6a6470'))
    d.ellipse([12, 22, 107, 54], outline=hexc('#8a8490'), width=2)
    for x, y in [(30, 38), (60, 28), (90, 38), (60, 48)]:
        d.ellipse([x - 9, y - 6, x + 9, y + 6], fill=hexc('#2a2430'))
    for k in range(8):
        a = k / 8 * math.pi * 2
        d.point((60 + math.cos(a) * 44, 38 + math.sin(a) * 15), fill=hexc('#c9a040'))
    return outline(img)

def seal(kind):
    img = Image.new('RGBA', (40, 40), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    base, ring = ('#e8a060', '#f8c890') if kind == 'cat' else ('#8ac0a0', '#b8e0c8')
    d.ellipse([1, 1, 38, 38], fill=hexc(base)); d.ellipse([4, 4, 35, 35], fill=hexc(ring))
    if kind == 'cat':
        # a sun behind a black cat
        for k in range(8):
            a = k / 8 * math.pi * 2
            d.line([(20 + math.cos(a) * 9, 14 + math.sin(a) * 9), (20 + math.cos(a) * 14, 14 + math.sin(a) * 14)], fill=hexc('#f5c400'), width=2)
        d.ellipse([13, 7, 27, 21], fill=hexc('#f5c400'))
        d.ellipse([12, 18, 28, 33], fill=hexc('#1e1c22'))
        d.ellipse([14, 13, 26, 24], fill=hexc('#1e1c22'))
        d.polygon([(14, 16), (14, 9), (18, 14)], fill=hexc('#1e1c22')); d.polygon([(26, 16), (26, 9), (22, 14)], fill=hexc('#1e1c22'))
        d.point((17, 18), fill=hexc('#c8e04a')); d.point((23, 18), fill=hexc('#c8e04a'))
        d.line([(28, 30), (32, 26), (31, 22)], fill=hexc('#1e1c22'), width=2)
    else:
        # a stag under a comet
        d.line([(8, 8), (16, 12)], fill=hexc('#ffffff'), width=2); d.ellipse([15, 10, 20, 15], fill=hexc('#ffffff'))
        d.ellipse([13, 20, 29, 30], fill=hexc('#6a4a2a'))
        d.ellipse([22, 13, 30, 22], fill=hexc('#6a4a2a'))
        for x, y in [(23, 13), (29, 13)]:
            d.line([(x, y), (x - 2, y - 6)], fill=hexc('#4a3218')); d.line([(x - 1, y - 3), (x + 2, y - 7)], fill=hexc('#4a3218'))
        for x in (15, 19, 24, 27): d.line([(x, 29), (x, 34)], fill=hexc('#4a3218'))
        d.point((27, 17), fill=hexc('#1a1a1a'))
    return outline(img, hexc('#3a3040'))

def dust_sheet():
    img = Image.new('RGBA', (56, 44), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.polygon([(6, 43), (2, 18), (10, 4), (46, 2), (54, 16), (50, 43)], fill=hexc('#d8d4cc'))
    for x in (14, 26, 38): d.line([(x, 6), (x - 2, 42)], fill=hexc('#b8b4ac'))
    d.polygon([(10, 4), (46, 2), (40, 10), (16, 12)], fill=hexc('#e8e4dc'))
    return outline(img, hexc('#5a5650'))

def round_window():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse([0, 0, 63, 63], fill=hexc('#4a3a2a')); d.ellipse([5, 5, 58, 58], fill=hexc('#1a2440'))
    d.ellipse([34, 12, 46, 24], fill=hexc('#f0f0e0')); d.ellipse([38, 12, 48, 22], fill=hexc('#1a2440'))
    for x, y in [(14, 20), (22, 40), (44, 44), (18, 30), (50, 34)]: d.point((x, y), fill=hexc('#ffffff'))
    d.line([(32, 5), (32, 58)], fill=hexc('#4a3a2a'), width=3); d.line([(5, 32), (58, 32)], fill=hexc('#4a3a2a'), width=3)
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
    save(calcadao(), 'br-calcadao.png')
    save(facade(1, '#f2c14e', '#ffffff'), 'br-facade-a.png')
    save(facade(2, '#7fc8d8', '#ffffff'), 'br-facade-b.png')
    save(facade(3, '#f0a0b0', '#ffffff'), 'br-facade-c.png')
    save(facade(4, '#f4f1ea', '#2f8a4a'), 'br-facade-d.png')
    save(facade(5, '#a8d870', '#ffffff'), 'br-facade-e.png')
    save(sugarloaf(), 'br-sugarloaf.png')
    save(kiosk(), 'br-kiosk.png')
    save(acai(), 'br-acai.png')
    save(lifeguard(), 'br-posto.png')
    save(flag_br(), 'br-flag.png')
    save(toucan(), 'br-toucan.png')
    save(macaw(), 'br-macaw.png')
    save(goal_top(), 'br-goal.png')
    save(ball(), 'br-ball.png')
    save(gondola(), 'br-gondola.png')
    save(pe_de_moleque(), 'br-stones.png')
    save(colonial(1, '#2f6ab0'), 'br-casa-blue.png')
    save(colonial(2, '#f5b400'), 'br-casa-yellow.png')
    save(colonial(3, '#2f8a4a', two=True), 'br-sobrado-green.png')
    save(colonial(4, '#c0392b', two=True), 'br-sobrado-red.png')
    save(colonial(5, '#8a4ab0'), 'br-casa-purple.png')
    save(colonial(6, '#2fa8a8', two=True), 'br-sobrado-teal.png')
    save(church(), 'br-church.png')
    save(serra(), 'br-serra.png')
    save(waterfall(), 'br-waterfall.png')
    save(escuna('#e8584a', '#f5c400'), 'br-escuna-a.png')
    save(escuna('#2f6ab0', '#ffffff'), 'br-escuna-b.png')
    save(escuna('#f5c400', '#2f8a4a'), 'br-escuna-c.png')
    save(canoe(), 'br-canoe.png')
    save(hummingbird(), 'br-hummingbird.png')
    save(doces(), 'br-doces.png')
    save(footvolley(), 'br-footvolley.png')
    save(canga('#e8584a', '#f5c400'), 'br-canga-a.png')
    save(canga('#2f8ad0', '#ffffff'), 'br-canga-b.png')
    save(canga('#2f8a4a', '#f5c400'), 'br-canga-c.png')
    save(sandcastle(), 'br-sandcastle.png')
    save(seagull(), 'br-seagull.png')
    save(streetlamp(), 'br-lamp.png')
    save(globe_cart(), 'br-globe.png')
    save(strawberry(), 'bali-strawberry.png')
    save(mirror_stand(), 'hm-mirror.png')
    save(moon_door(), 'hm-moondoor.png')
    save(brazier(), 'hm-brazier.png')
    save(trapdoor(), 'hm-trapdoor.png')
    save(owl_seal(), 'hm-seal-owl.png')
    save(star_rug(), 'hm-rug.png')
    save(cobweb(), 'hm-cobweb.png')
    save(plush_turtle(), 'bali-prize-turtle.png')
    save(plush_goat(), 'bali-prize-goat.png')
    save(dartboard(), 'bali-prize-dart.png')
    save(trophy(), 'bali-prize-trophy.png')
    save(xmas_tree(), 'hm-xmas-tree.png')
    save(present('#e8282a', '#f5c400'), 'hm-present-a.png')
    save(present('#2f6ab0', '#ffffff', 16, 12), 'hm-present-b.png')
    save(present('#2f8a4a', '#e8282a', 14, 18), 'hm-present-c.png')
    save(shoe(), 'hm-shoe.png')
    save(choco_letter(), 'hm-choco.png')
    save(cake(), 'hm-cake.png')
    save(balloons(), 'hm-balloons.png')
    save(heart(), 'hm-heart.png')
    save(roses(), 'hm-roses.png')
    save(pepernoot(), 'hm-pepernoot.png')
    save(gramophone(), 'hm-gramophone.png')
    save(record('#c0392b'), 'hm-record-a.png')
    save(record('#2f6ab0'), 'hm-record-b.png')
    save(record('#e8c040'), 'hm-record-c.png')
    save(gear(40, 12), 'hm-gear-big.png')
    save(gear(22, 8, '#b8944a'), 'hm-gear-small.png')
    save(clockface(), 'hm-clockface.png')
    save(ladder(), 'hm-ladder.png')
    save(well(), 'hm-well.png')
    save(hooded(), 'hooded.png')
    save(dais(), 'hm-dais.png')
    save(seal('cat'), 'hm-seal-cat.png')
    save(seal('stag'), 'hm-seal-stag.png')
    save(dust_sheet(), 'hm-dustsheet.png')
    save(round_window(), 'hm-roundwindow.png')
    save(mms(), 'bali-mms.png')
    for k, im in snow_assets().items(): save(im, k + '.png')
