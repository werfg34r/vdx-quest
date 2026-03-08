#!/usr/bin/env python3
"""Generate pixel art tileset for VDX Quest — Sunnyside World style.
Output: public/assets/tileset.png (256x256 spritesheet, 16x16 tiles in a 16x16 grid)
"""

from PIL import Image

TILE = 16

# Palette — warm, saturated colors inspired by Sunnyside World
C = {
    # Greens (grass)
    'g0': (61, 122, 40),    # darkest grass
    'g1': (77, 155, 50),    # dark grass
    'g2': (90, 175, 62),    # medium grass
    'g3': (110, 196, 78),   # light grass
    'g4': (135, 216, 100),  # highlight grass
    # Greens (tree canopy)
    't0': (26, 61, 16),     # darkest (outline)
    't1': (35, 82, 22),     # very dark
    't2': (48, 110, 30),    # dark
    't3': (65, 140, 42),    # medium
    't4': (85, 170, 58),    # light
    't5': (110, 195, 80),   # highlight
    # Browns (trunk, dirt, wood)
    'b0': (58, 36, 16),     # darkest brown
    'b1': (74, 46, 20),     # dark brown
    'b2': (91, 58, 26),     # medium brown
    'b3': (122, 82, 42),    # light brown
    'b4': (148, 104, 58),   # lighter brown
    'b5': (174, 130, 78),   # warm light brown
    # Path/Dirt
    'd0': (158, 128, 72),   # dark dirt
    'd1': (178, 148, 88),   # medium dirt
    'd2': (196, 164, 108),  # light dirt
    'd3': (212, 180, 124),  # bright dirt
    'd4': (224, 196, 144),  # highlight dirt
    # Water
    'w0': (26, 65, 130),    # deepest
    'w1': (37, 80, 148),    # deep
    'w2': (50, 110, 178),   # medium
    'w3': (70, 140, 208),   # light
    'w4': (100, 170, 228),  # bright
    'w5': (150, 210, 255),  # highlight
    # Sand
    's0': (200, 176, 128),  # dark sand
    's1': (218, 194, 148),  # medium sand
    's2': (232, 210, 168),  # light sand
    's3': (240, 222, 184),  # bright sand
    # Mountain/Rock
    'r0': (85, 85, 90),     # darkest rock
    'r1': (105, 105, 112),  # dark rock
    'r2': (130, 130, 138),  # medium rock
    'r3': (155, 155, 162),  # light rock
    'r4': (180, 180, 186),  # bright rock
    'r5': (215, 215, 225),  # snow
    # Flowers
    'f0': (220, 50, 50),    # red flower
    'f1': (230, 180, 50),   # yellow flower
    'f2': (180, 50, 200),   # purple flower
    'f3': (50, 130, 220),   # blue flower
    'f4': (230, 100, 60),   # orange flower
    'f5': (255, 232, 85),   # flower center
    # Fence
    'fe0': (90, 62, 30),    # dark fence
    'fe1': (110, 80, 42),   # medium fence
    'fe2': (130, 100, 56),  # light fence
    'fe3': (148, 118, 72),  # highlight fence
    # Sign
    'si0': (74, 46, 20),    # dark sign
    'si1': (100, 70, 36),   # medium sign
    'si2': (130, 98, 52),   # light sign
    # Bridge
    'br0': (80, 52, 28),    # dark plank
    'br1': (100, 70, 40),   # medium plank
    'br2': (120, 88, 52),   # light plank
    'br3': (140, 108, 68),  # highlight plank
}

def tile_img():
    return Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))

def solid_fill(img, color):
    for y in range(TILE):
        for x in range(TILE):
            img.putpixel((x, y), color + (255,))

def put(img, x, y, color, alpha=255):
    if 0 <= x < TILE and 0 <= y < TILE:
        img.putpixel((x, y), color + (alpha,))

def fill_rect(img, x, y, w, h, color, alpha=255):
    for dy in range(h):
        for dx in range(w):
            put(img, x + dx, y + dy, color, alpha)

def make_grass(seed=0):
    img = tile_img()
    import random
    r = random.Random(seed)
    # Base color
    bases = [C['g1'], C['g2'], C['g2'], C['g2']]
    base = bases[seed % len(bases)]
    solid_fill(img, base)
    # Variation patches
    for _ in range(3):
        px, py = r.randint(0, 13), r.randint(0, 13)
        pw, ph = r.randint(2, 4), r.randint(2, 4)
        c = r.choice([C['g1'], C['g3']])
        fill_rect(img, px, py, pw, ph, c)
    # Small dark grass blades
    for _ in range(4 + seed % 3):
        bx, by = r.randint(1, 14), r.randint(1, 14)
        put(img, bx, by, C['g0'])
        if r.random() > 0.5:
            put(img, bx, by - 1, C['g0'])
    # Bright highlights
    for _ in range(2):
        hx, hy = r.randint(0, 14), r.randint(0, 14)
        put(img, hx, hy, C['g3'])
        put(img, hx + 1, hy, C['g4'])
    return img

def make_dark_grass(seed=0):
    img = tile_img()
    import random
    r = random.Random(seed + 100)
    solid_fill(img, C['g0'])
    for _ in range(4):
        px, py = r.randint(0, 12), r.randint(0, 12)
        pw, ph = r.randint(2, 5), r.randint(2, 5)
        c = r.choice([(45, 100, 30), C['g1']])
        fill_rect(img, px, py, pw, ph, c)
    for _ in range(3):
        hx, hy = r.randint(0, 14), r.randint(0, 14)
        put(img, hx, hy, C['g1'])
    return img

def make_tall_grass(seed=0):
    img = make_grass(seed + 200)
    import random
    r = random.Random(seed + 200)
    # Grass tufts
    for i in range(4):
        bx = 2 + i * 3 + r.randint(-1, 1)
        bh = r.randint(4, 7)
        for by in range(max(0, 8 - bh), 9):
            put(img, bx, by, C['g0'])
            put(img, bx + 1, by, C['g0'])
        # Light tips
        tip_y = max(0, 8 - bh)
        put(img, bx, tip_y, C['g3'])
        put(img, bx + 1, tip_y, C['g4'])
        put(img, bx, tip_y + 1, C['g2'])
        put(img, bx + 1, tip_y + 1, C['g3'])
    return img

def draw_filled_canopy(img, shape_rows, color_map, ox=0, oy=0):
    """Draw a canopy from shape rows with proper filling."""
    for cy, row in enumerate(shape_rows):
        for cx, ch in enumerate(row):
            if ch != ' ' and ch in color_map:
                put(img, cx + ox, cy + oy, color_map[ch])

def make_tree(seed=0):
    """Pixel art tree — large, lush canopy."""
    img = make_grass(seed + 300)
    import random
    r = random.Random(seed + 300)

    # Trunk
    fill_rect(img, 6, 10, 4, 6, C['b1'])
    fill_rect(img, 6, 10, 2, 6, C['b2'])
    put(img, 9, 11, C['b0']); put(img, 9, 12, C['b0'])

    # Dense, lush canopy — fills most of the tile
    # D=darkest outline, d=dark, M=medium, L=light, B=bright highlight
    canopy = [
        '     DDDDDD     ',
        '   DDdMMMMMdDD  ',
        '  DdMMMMLMMMdD  ',
        ' DdMMMLLLLMMdD  ',
        ' DMMLLLBLLMMdD  ',
        'DdMMLLBBLLMMdD  ',
        'DdMMMLLLLMMMdD  ',
        ' DdMMMMLMMMMdD  ',
        ' DDdMMMMMMdDD   ',
        '  DDdddddDDD    ',
    ]
    color_map = {
        'D': C['t0'],
        'd': C['t1'],
        'M': C['t2'],
        'L': C['t3'],
        'B': C['t5'],
    }

    ox = r.randint(-1, 0)
    draw_filled_canopy(img, canopy, color_map, ox, 0)

    # Extra highlight spots
    put(img, 6 + ox, 3, C['t4']); put(img, 7 + ox, 2, C['t4'])

    return img

def make_tree2(seed=1):
    """Variant tree — wider, rounder canopy."""
    img = make_grass(seed + 400)

    # Trunk
    fill_rect(img, 7, 10, 3, 6, C['b1'])
    fill_rect(img, 7, 10, 1, 6, C['b2'])
    put(img, 9, 11, C['b0'])

    canopy = [
        '    DDDDDDDD    ',
        '  DDdMMMMMMdDD  ',
        ' DdMMMMLLMMMdD  ',
        ' DMMLLLLLLMMdD  ',
        'DdMLLLBBLLLMdD  ',
        'DdMMLLLLLLMMdD  ',
        ' DdMMMMLMMMdDD  ',
        ' DDdMMMMMddDD   ',
        '  DDDddddDDD    ',
        '   DDDDDDD      ',
    ]
    color_map = {
        'D': C['t0'],
        'd': C['t1'],
        'M': C['t2'],
        'L': C['t3'],
        'B': C['t5'],
    }
    draw_filled_canopy(img, canopy, color_map)

    # Highlights
    put(img, 7, 2, C['t4']); put(img, 8, 3, C['t4']); put(img, 6, 4, C['t5'])

    return img

def make_tree3(seed=2):
    """Small/young tree variant."""
    img = make_grass(seed + 500)

    # Thin trunk
    fill_rect(img, 7, 9, 2, 7, C['b1'])
    put(img, 7, 9, C['b2'])

    canopy = [
        '      DDD       ',
        '    DDdMdDD     ',
        '   DdMMLMMdD    ',
        '  DdMLLLLMdD    ',
        '  DMMBLLLMdD    ',
        '  DdMMLLMMdD    ',
        '   DdMMMdDD     ',
        '    DDdDDD      ',
        '     DDD        ',
    ]
    color_map = {
        'D': C['t0'],
        'd': C['t1'],
        'M': C['t2'],
        'L': C['t3'],
        'B': C['t5'],
    }
    draw_filled_canopy(img, canopy, color_map, 0, 1)

    put(img, 7, 3, C['t4']); put(img, 8, 4, C['t5'])

    return img

def make_water(frame=0):
    img = tile_img()
    import math

    # Base water with depth variation
    for y in range(TILE):
        for x in range(TILE):
            # Create depth based on position
            depth = math.sin(x * 0.4) * 0.3 + math.sin(y * 0.5) * 0.3
            if depth > 0.2:
                put(img, x, y, C['w2'])
            elif depth > -0.1:
                put(img, x, y, C['w1'])
            else:
                put(img, x, y, C['w0'])

    # Animated wave highlights (shift with frame)
    shift = frame * 3
    for y in range(TILE):
        wave = math.sin((y + shift) * 0.6) * 3
        wx = int(4 + wave) % TILE
        put(img, wx, y, C['w3'])
        put(img, (wx + 1) % TILE, y, C['w3'])
        if y % 3 == frame % 3:
            put(img, (wx + 6) % TILE, y, C['w4'])

    # Sparkle highlights (animated)
    sparkle_positions = [(3, 2), (8, 5), (12, 3), (5, 10), (10, 12), (2, 7)]
    for i, (sx, sy) in enumerate(sparkle_positions):
        if (frame + i) % 3 == 0:
            put(img, sx, sy, C['w5'])
            put(img, sx + 1, sy, C['w4'])

    # Edge darkening
    for i in range(TILE):
        put(img, i, 0, C['w0'])
        put(img, i, 15, C['w0'])
        put(img, 0, i, C['w0'])
        put(img, 15, i, C['w0'])

    return img

def make_path(seed=0):
    img = tile_img()
    import random
    r = random.Random(seed + 600)

    # Base dirt
    solid_fill(img, C['d1'])

    # Variation
    for _ in range(5):
        px, py = r.randint(0, 13), r.randint(0, 13)
        pw, ph = r.randint(2, 5), r.randint(2, 4)
        c = r.choice([C['d0'], C['d2'], C['d1']])
        fill_rect(img, px, py, pw, ph, c)

    # Pebbles
    for _ in range(3):
        px, py = r.randint(1, 14), r.randint(1, 14)
        put(img, px, py, C['d0'])

    # Highlights
    for _ in range(2):
        hx, hy = r.randint(0, 14), r.randint(0, 2)
        put(img, hx, hy, C['d3'])
        put(img, hx + 1, hy, C['d4'])

    return img

def make_flower(seed=0):
    img = make_grass(seed + 700)
    import random
    r = random.Random(seed + 700)

    flower_colors = [C['f0'], C['f1'], C['f2'], C['f3'], C['f4']]
    center = C['f5']
    stem = (50, 110, 40)

    # 3-4 larger flowers with stems
    count = 3 + (seed % 2)
    for _ in range(count):
        fx, fy = r.randint(2, 11), r.randint(2, 11)
        fc = r.choice(flower_colors)
        fc_light = tuple(min(255, c + 40) for c in fc)

        # Stem
        put(img, fx + 1, fy + 3, stem)
        put(img, fx + 1, fy + 4, stem)

        # 5-pixel cross flower (visible!)
        put(img, fx + 1, fy, fc)      # top
        put(img, fx, fy + 1, fc)      # left
        put(img, fx + 1, fy + 1, center)  # center
        put(img, fx + 2, fy + 1, fc)  # right
        put(img, fx + 1, fy + 2, fc)  # bottom
        # Extra petal pixels for visibility
        put(img, fx, fy, fc_light)
        put(img, fx + 2, fy, fc_light)
        put(img, fx, fy + 2, fc_light)
        put(img, fx + 2, fy + 2, fc_light)

    # Small accent dots
    for _ in range(3):
        sx, sy = r.randint(0, 14), r.randint(0, 14)
        put(img, sx, sy, r.choice(flower_colors))

    return img

def make_sand(seed=0):
    img = tile_img()
    import random
    r = random.Random(seed + 800)

    solid_fill(img, C['s1'])
    for _ in range(4):
        px, py = r.randint(0, 12), r.randint(0, 12)
        pw, ph = r.randint(2, 5), r.randint(2, 4)
        c = r.choice([C['s0'], C['s2']])
        fill_rect(img, px, py, pw, ph, c)

    # Subtle dots
    for _ in range(3):
        dx, dy = r.randint(0, 15), r.randint(0, 15)
        put(img, dx, dy, C['s0'])

    # Bright spots
    put(img, r.randint(0, 14), r.randint(0, 5), C['s3'])

    return img

def make_mountain():
    img = tile_img()

    # Rock base
    solid_fill(img, C['r1'])

    # Mountain triangular shape
    for y in range(TILE):
        half_w = max(0, int((y / 15.0) * 8))
        cx = 8
        for x in range(cx - half_w, cx + half_w):
            if 0 <= x < TILE:
                # Left side (lighter)
                if x < cx:
                    put(img, x, y, C['r2'])
                else:
                    put(img, x, y, C['r0'])

    # Lighter face
    for y in range(3, TILE):
        half_w = max(0, int(((y - 1) / 15.0) * 6))
        for x in range(8 - half_w, 8):
            if 0 <= x < TILE:
                put(img, x, y, C['r3'])

    # Snow cap
    snow_shape = [
        (7, 0), (8, 0),
        (6, 1), (7, 1), (8, 1), (9, 1),
        (6, 2), (7, 2), (8, 2), (9, 2),
        (5, 3), (6, 3), (7, 3), (8, 3), (9, 3), (10, 3),
        (6, 4), (7, 4), (8, 4), (9, 4),
    ]
    for sx, sy in snow_shape:
        put(img, sx, sy, C['r5'])

    # Snow highlight
    put(img, 7, 1, (240, 240, 248))
    put(img, 8, 1, (240, 240, 248))

    # Rock detail
    put(img, 4, 12, C['r0'])
    put(img, 10, 10, C['r0'])
    put(img, 6, 14, C['r0'])

    return img

def make_fence():
    img = make_grass(42)

    # Fence posts
    fill_rect(img, 1, 4, 3, 10, C['fe0'])
    fill_rect(img, 12, 4, 3, 10, C['fe0'])
    fill_rect(img, 1, 4, 2, 10, C['fe1'])
    fill_rect(img, 12, 4, 2, 10, C['fe1'])

    # Post caps
    fill_rect(img, 1, 3, 3, 2, C['fe2'])
    fill_rect(img, 12, 3, 3, 2, C['fe2'])
    put(img, 1, 3, C['fe3'])
    put(img, 12, 3, C['fe3'])

    # Horizontal rails
    fill_rect(img, 0, 6, 16, 2, C['fe1'])
    fill_rect(img, 0, 11, 16, 2, C['fe1'])
    # Rail highlights
    fill_rect(img, 0, 6, 16, 1, C['fe2'])
    fill_rect(img, 0, 11, 16, 1, C['fe2'])

    return img

def make_bridge():
    img = make_water(0)

    # Wooden planks
    fill_rect(img, 1, 0, 14, 16, C['br1'])

    # Individual planks with gaps
    for py in range(0, 16, 4):
        fill_rect(img, 2, py, 12, 3, C['br2'])
        fill_rect(img, 2, py, 12, 1, C['br3'])  # highlight top
        fill_rect(img, 2, py + 3, 12, 1, C['br0'])  # gap

    # Side rails
    fill_rect(img, 0, 0, 2, 16, C['br0'])
    fill_rect(img, 14, 0, 2, 16, C['br0'])
    fill_rect(img, 0, 0, 1, 16, C['b0'])
    fill_rect(img, 15, 0, 1, 16, C['b0'])

    return img

def make_sign():
    img = make_path(42)

    # Post
    fill_rect(img, 7, 7, 2, 9, C['b1'])
    put(img, 7, 7, C['b2'])

    # Sign board
    fill_rect(img, 3, 2, 10, 6, C['si1'])
    # Board edges
    fill_rect(img, 3, 2, 10, 1, C['si0'])
    fill_rect(img, 3, 7, 10, 1, C['si0'])
    fill_rect(img, 3, 2, 1, 6, C['si0'])
    fill_rect(img, 12, 2, 1, 6, C['si0'])
    # Board highlight
    fill_rect(img, 4, 3, 8, 1, C['si2'])
    # Text lines
    fill_rect(img, 5, 4, 6, 1, C['b0'])
    fill_rect(img, 5, 6, 4, 1, C['b0'])

    return img


def make_characters():
    """Generate improved character sprites.
    Layout: 16 columns x 16 rows of 16x16 sprites
    Same layout as original character.png so drawPlayerSprite/drawNPCSprite work unchanged.
    """
    W, H = 272, 256  # 17 cols x 16 rows
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    # Character definitions — (skin, hair, shirt, pants, detail)
    chars = {
        # Player (cols 0-2, rows 0-3 for down/left/right/up, 3 frames each)
        'player': {
            'cols': [0, 1, 2], 'rows': [0, 1, 2, 3],
            'skin': (232, 190, 155), 'hair': (60, 40, 30),
            'shirt': (60, 100, 180), 'pants': (50, 50, 70),
            'boots': (70, 45, 25),
        },
        # Mentor Laurent (cols 3-5, rows 0-3)
        'mentor': {
            'cols': [3, 4, 5], 'rows': [0, 1, 2, 3],
            'skin': (210, 170, 135), 'hair': (180, 170, 155),
            'shirt': (120, 40, 40), 'pants': (60, 55, 50),
            'boots': (55, 35, 20),
        },
        # Char3 (cols 6-8, rows 0-3)
        'char3': {
            'cols': [6, 7, 8], 'rows': [0, 1, 2, 3],
            'skin': (220, 180, 145), 'hair': (140, 80, 40),
            'shirt': (80, 140, 60), 'pants': (70, 60, 50),
            'boots': (60, 40, 22),
        },
        # Warrior (cols 9-11, rows 0-3)
        'warrior': {
            'cols': [9, 10, 11], 'rows': [0, 1, 2, 3],
            'skin': (190, 150, 110), 'hair': (30, 25, 22),
            'shirt': (140, 120, 90), 'pants': (80, 70, 55),
            'boots': (65, 42, 20),
        },
        # Sage (cols 12-14, rows 0-3)
        'sage': {
            'cols': [12, 13, 14], 'rows': [0, 1, 2, 3],
            'skin': (225, 185, 150), 'hair': (200, 200, 210),
            'shirt': (80, 60, 120), 'pants': (60, 50, 80),
            'boots': (50, 35, 55),
        },
        # Villager (cols 0-2, rows 8-11)
        'villager': {
            'cols': [0, 1, 2], 'rows': [8, 9, 10, 11],
            'skin': (232, 195, 160), 'hair': (160, 100, 50),
            'shirt': (50, 130, 50), 'pants': (60, 55, 70),
            'boots': (55, 38, 22),
        },
        # Trader (cols 3-5, rows 8-11)
        'trader': {
            'cols': [3, 4, 5], 'rows': [8, 9, 10, 11],
            'skin': (215, 175, 140), 'hair': (90, 55, 30),
            'shirt': (170, 130, 50), 'pants': (80, 65, 45),
            'boots': (60, 40, 20),
        },
        # Old (cols 6-7, rows 8-11)
        'old': {
            'cols': [6, 7], 'rows': [8, 9, 10, 11],
            'skin': (210, 175, 140), 'hair': (190, 185, 175),
            'shirt': (100, 80, 65), 'pants': (65, 58, 50),
            'boots': (50, 35, 22),
        },
    }

    def draw_char(char_def, frame, direction, col, row):
        """Draw a single 16x16 character sprite."""
        ox = col * 16
        oy = row * 16

        skin = char_def['skin']
        hair = char_def['hair']
        shirt = char_def['shirt']
        pants = char_def['pants']
        boots = char_def['boots']

        # Darker variants
        skin_dark = tuple(max(0, c - 30) for c in skin)
        hair_dark = tuple(max(0, c - 25) for c in hair)
        shirt_dark = tuple(max(0, c - 30) for c in shirt)

        # Outline color
        outline = (30, 25, 20)

        # Walking offset (frame 1 = left step, frame 2 = right step)
        leg_offset = 0
        if frame == 1:
            leg_offset = -1
        elif frame == 2:
            leg_offset = 1

        # Direction determines which way character faces
        # 0=down, 1=left, 2=right, 3=up
        dir_idx = direction

        def p(x, y, c):
            if 0 <= x < 16 and 0 <= y < 16:
                img.putpixel((ox + x, oy + y), c + (255,))

        if dir_idx == 0:  # Facing down
            # Head outline
            for x in range(5, 11):
                p(x, 1, outline)
            p(4, 2, outline); p(11, 2, outline)
            p(4, 3, outline); p(11, 3, outline)
            p(4, 4, outline); p(11, 4, outline)
            for x in range(5, 11):
                p(x, 5, outline)

            # Hair
            for x in range(5, 11):
                p(x, 2, hair)
            p(5, 3, hair); p(10, 3, hair)

            # Face
            for x in range(6, 10):
                p(x, 3, skin)
                p(x, 4, skin)
            p(5, 4, skin); p(10, 4, skin)

            # Eyes
            p(6, 3, (40, 40, 50))
            p(9, 3, (40, 40, 50))

            # Body outline
            p(4, 6, outline); p(11, 6, outline)
            p(3, 7, outline); p(12, 7, outline)
            p(3, 8, outline); p(12, 8, outline)
            p(3, 9, outline); p(12, 9, outline)
            for x in range(4, 12):
                p(x, 10, outline)

            # Shirt
            for x in range(5, 11):
                p(x, 6, shirt)
            for x in range(4, 12):
                p(x, 7, shirt)
                p(x, 8, shirt)
                p(x, 9, shirt)

            # Shirt detail (darker sides)
            p(4, 7, shirt_dark); p(11, 7, shirt_dark)
            p(4, 8, shirt_dark); p(11, 8, shirt_dark)
            p(4, 9, shirt_dark); p(11, 9, shirt_dark)

            # Arms
            p(3, 7, skin); p(12, 7, skin)
            p(3, 8, skin); p(12, 8, skin)
            if frame == 1:
                p(2, 8, skin)
            elif frame == 2:
                p(13, 8, skin)

            # Pants
            for x in range(5, 11):
                p(x, 10, pants)
                p(x, 11, pants)

            # Legs
            p(5 + leg_offset, 12, pants); p(6 + leg_offset, 12, pants)
            p(9 - leg_offset, 12, pants); p(10 - leg_offset, 12, pants)

            # Boots
            p(5 + leg_offset, 13, boots); p(6 + leg_offset, 13, boots)
            p(9 - leg_offset, 13, boots); p(10 - leg_offset, 13, boots)
            p(5 + leg_offset, 14, boots); p(6 + leg_offset, 14, boots)
            p(9 - leg_offset, 14, boots); p(10 - leg_offset, 14, boots)

        elif dir_idx == 3:  # Facing up
            # Head outline
            for x in range(5, 11):
                p(x, 1, outline)
            p(4, 2, outline); p(11, 2, outline)
            p(4, 3, outline); p(11, 3, outline)
            p(4, 4, outline); p(11, 4, outline)
            for x in range(5, 11):
                p(x, 5, outline)

            # Hair (covers whole head from back)
            for x in range(5, 11):
                p(x, 2, hair)
                p(x, 3, hair)
                p(x, 4, hair)

            # Body + shirt
            for x in range(5, 11):
                p(x, 6, shirt)
            for x in range(4, 12):
                p(x, 7, shirt)
                p(x, 8, shirt)
                p(x, 9, shirt)
            p(4, 7, shirt_dark); p(11, 7, shirt_dark)

            # Arms
            p(3, 7, skin); p(12, 7, skin)
            p(3, 8, skin); p(12, 8, skin)

            # Pants + legs + boots
            for x in range(5, 11):
                p(x, 10, pants)
                p(x, 11, pants)
            p(5 + leg_offset, 12, pants); p(6 + leg_offset, 12, pants)
            p(9 - leg_offset, 12, pants); p(10 - leg_offset, 12, pants)
            p(5 + leg_offset, 13, boots); p(6 + leg_offset, 13, boots)
            p(9 - leg_offset, 13, boots); p(10 - leg_offset, 13, boots)
            p(5 + leg_offset, 14, boots); p(6 + leg_offset, 14, boots)
            p(9 - leg_offset, 14, boots); p(10 - leg_offset, 14, boots)

        elif dir_idx == 1:  # Facing left
            # Head
            for x in range(5, 10):
                p(x, 1, outline)
            p(4, 2, outline); p(10, 2, outline)
            p(4, 3, outline); p(10, 3, outline)
            p(4, 4, outline); p(10, 4, outline)
            for x in range(5, 10):
                p(x, 5, outline)

            # Hair (more on left side)
            for x in range(5, 10):
                p(x, 2, hair)
            p(5, 3, hair); p(6, 3, hair)
            p(9, 3, hair)

            # Face (shifted left)
            for x in range(7, 10):
                p(x, 3, skin)
                p(x, 4, skin)
            p(6, 4, skin)

            # Eye (left side visible)
            p(7, 3, (40, 40, 50))

            # Body + shirt
            for x in range(5, 11):
                p(x, 6, shirt)
            for x in range(4, 12):
                p(x, 7, shirt)
                p(x, 8, shirt)
                p(x, 9, shirt)

            # Left arm (visible, in front)
            p(3, 7, skin); p(3, 8, skin)
            if frame == 1:
                p(3, 9, skin)
            elif frame == 2:
                p(3, 6, skin)

            # Pants + boots
            for x in range(5, 11):
                p(x, 10, pants)
                p(x, 11, pants)
            p(5 + leg_offset, 12, pants); p(6 + leg_offset, 12, pants)
            p(9 - leg_offset, 12, pants); p(10 - leg_offset, 12, pants)
            p(5 + leg_offset, 13, boots); p(6 + leg_offset, 13, boots)
            p(9 - leg_offset, 13, boots); p(10 - leg_offset, 13, boots)
            p(5 + leg_offset, 14, boots); p(6 + leg_offset, 14, boots)
            p(9 - leg_offset, 14, boots); p(10 - leg_offset, 14, boots)

        elif dir_idx == 2:  # Facing right (mirror of left)
            # Head
            for x in range(6, 11):
                p(x, 1, outline)
            p(5, 2, outline); p(11, 2, outline)
            p(5, 3, outline); p(11, 3, outline)
            p(5, 4, outline); p(11, 4, outline)
            for x in range(6, 11):
                p(x, 5, outline)

            # Hair
            for x in range(6, 11):
                p(x, 2, hair)
            p(6, 3, hair)
            p(9, 3, hair); p(10, 3, hair)

            # Face (shifted right)
            for x in range(6, 9):
                p(x, 3, skin)
                p(x, 4, skin)
            p(9, 4, skin)

            # Eye
            p(8, 3, (40, 40, 50))

            # Body
            for x in range(5, 11):
                p(x, 6, shirt)
            for x in range(4, 12):
                p(x, 7, shirt)
                p(x, 8, shirt)
                p(x, 9, shirt)

            # Right arm
            p(12, 7, skin); p(12, 8, skin)
            if frame == 1:
                p(12, 9, skin)
            elif frame == 2:
                p(12, 6, skin)

            # Pants + boots
            for x in range(5, 11):
                p(x, 10, pants)
                p(x, 11, pants)
            p(5 + leg_offset, 12, pants); p(6 + leg_offset, 12, pants)
            p(9 - leg_offset, 12, pants); p(10 - leg_offset, 12, pants)
            p(5 + leg_offset, 13, boots); p(6 + leg_offset, 13, boots)
            p(9 - leg_offset, 13, boots); p(10 - leg_offset, 13, boots)
            p(5 + leg_offset, 14, boots); p(6 + leg_offset, 14, boots)
            p(9 - leg_offset, 14, boots); p(10 - leg_offset, 14, boots)

    # Draw all characters
    for name, cdef in chars.items():
        cols = cdef['cols']
        rows = cdef['rows']
        for dir_idx, row in enumerate(rows):
            for frame_idx, col in enumerate(cols):
                draw_char(cdef, frame_idx, dir_idx, col, row)

    return img


def main():
    """Generate the complete tileset and character sprites."""

    # === TILESET ===
    # Layout: 16 columns x 4 rows = 256x64 tileset
    # Row 0: grass variants, dark grass, tall grass, path variants
    # Row 1: tree variants, water frames, sand
    # Row 2: flower variants, fence, bridge, sign, mountain
    # Row 3: (reserved for future tiles)

    COLS = 16
    ROWS_COUNT = 4
    tileset = Image.new('RGBA', (COLS * TILE, ROWS_COUNT * TILE), (0, 0, 0, 0))

    def place(tile_img, col, row):
        tileset.paste(tile_img, (col * TILE, row * TILE))

    # Row 0: Grass (0-3), Dark grass (4-5), Tall grass (6-7), Path (8-10), Sand (11-12)
    for i in range(4):
        place(make_grass(i), i, 0)
    for i in range(2):
        place(make_dark_grass(i), 4 + i, 0)
    for i in range(2):
        place(make_tall_grass(i), 6 + i, 0)
    for i in range(3):
        place(make_path(i), 8 + i, 0)
    for i in range(2):
        place(make_sand(i), 11 + i, 0)

    # Row 1: Trees (0-2), Water frames (3-6)
    place(make_tree(0), 0, 1)
    place(make_tree2(1), 1, 1)
    place(make_tree3(2), 2, 1)
    for i in range(4):
        place(make_water(i), 3 + i, 1)

    # Row 2: Flowers (0-2), Fence (3), Bridge (4), Sign (5), Mountain (6)
    for i in range(3):
        place(make_flower(i), i, 2)
    place(make_fence(), 3, 2)
    place(make_bridge(), 4, 2)
    place(make_sign(), 5, 2)
    place(make_mountain(), 6, 2)

    tileset.save('public/assets/tileset.png')
    print(f'Generated tileset: {COLS * TILE}x{ROWS_COUNT * TILE} ({COLS}x{ROWS_COUNT} tiles)')

    # === CHARACTERS ===
    char_img = make_characters()
    char_img.save('public/assets/characters.png')
    print(f'Generated characters: {char_img.width}x{char_img.height}')


if __name__ == '__main__':
    main()
