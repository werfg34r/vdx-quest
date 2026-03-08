#!/usr/bin/env python3
"""Integrate Sunnyside World assets into VDX Quest — v3 (improved houses + visuals).
Extracts tiles, characters from the Sunnyside World asset pack.
"""

from PIL import Image
import os

TILE = 16
ASSETS = '/tmp/sunnyside/Sunnyside_World_Assets'
BUILDINGS = '/tmp/archive/SUNNYSIDE_WORLD_BUILDINGS_V0.01/SUNNYSIDE_WORLD_BUILDINGS_V0.01.png'
OUT = 'public/assets'


def crop_tile(img, col, row, size=16):
    return img.crop((col * size, row * size, (col + 1) * size, (row + 1) * size))


def fit_in_tile(sprite, pad_bottom=1):
    """Fit a sprite into a 16x16 tile, centered horizontally, bottom-aligned."""
    result = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    sw, sh = sprite.size
    scale = min(16 / sw, (16 - pad_bottom) / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    scaled = sprite.resize((nw, nh), Image.NEAREST)
    x = (16 - nw) // 2
    y = 16 - nh - pad_bottom
    result.paste(scaled, (x, y), scaled)
    return result


def fit_in_tile_centered(sprite):
    """Fit a sprite into 16x16 centered both ways."""
    result = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    sw, sh = sprite.size
    scale = min(14 / sw, 14 / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    scaled = sprite.resize((nw, nh), Image.NEAREST)
    x = (16 - nw) // 2
    y = (16 - nh) // 2
    result.paste(scaled, (x, y), scaled)
    return result


def composite_house(bld):
    """Build a 3x4 tile (48x64) house from the buildings pack.
    Takes the roof (rows 0-2) and wall (rows 4-7) sections from cols 2-4,
    skipping the empty arch row (row 3).
    """
    roof = bld.crop((2 * 16, 0 * 16, 5 * 16, 3 * 16))   # 48x48
    wall = bld.crop((2 * 16, 4 * 16, 5 * 16, 8 * 16))   # 48x64
    roof_s = roof.resize((48, 32), Image.NEAREST)          # 2 tile rows
    wall_s = wall.resize((48, 32), Image.NEAREST)          # 2 tile rows
    house = Image.new('RGBA', (48, 64), (0, 0, 0, 0))
    house.paste(roof_s, (0, 0), roof_s)
    house.paste(wall_s, (0, 32), wall_s)
    return house


def recolor_house(house, color='orange'):
    """Create a color variant of the blue house."""
    result = house.copy()
    data = list(result.getdata())
    new_data = []
    for px in data:
        r, g, b, a = px
        if a > 20:
            if color == 'orange':
                # Blue/cyan → orange/warm
                if b > r + 30 and b > 100:
                    nr = min(255, b + 20)
                    ng = min(255, max(0, int(g * 0.65)))
                    nb = max(0, int(r * 0.3))
                    new_data.append((nr, ng, nb, a))
                elif g > r + 30 and g > b + 30 and g > 120:
                    nr = min(255, int(g * 0.9))
                    ng = max(0, int(g * 0.5))
                    nb = max(0, int(b * 0.3))
                    new_data.append((nr, ng, nb, a))
                else:
                    new_data.append(px)
            elif color == 'green':
                # Blue/cyan → green
                if b > r + 30 and b > 100:
                    nr = max(0, int(r * 0.4))
                    ng = min(255, int(b * 0.85))
                    nb = max(0, int(r * 0.3))
                    new_data.append((nr, ng, nb, a))
                else:
                    new_data.append(px)
            elif color == 'red':
                # Blue/cyan → red
                if b > r + 30 and b > 100:
                    nr = min(255, int(b * 0.9))
                    ng = max(0, int(g * 0.3))
                    nb = max(0, int(r * 0.3))
                    new_data.append((nr, ng, nb, a))
                else:
                    new_data.append(px)
            else:
                new_data.append(px)
        else:
            new_data.append(px)
    result.putdata(new_data)
    return result


def build_game_tileset():
    """Build the game tileset from Sunnyside World.

    Layout (16 cols x 8 rows = 256x128):
    Row 0: grass(0-5), dark_grass(6-7), tall_grass(8-9), path(10-12), sand(13-14), bridge(15)
    Row 1: tree(0-2), water(3-6), fence(7), sign(8), mountain(9-10), flower(11-15)
    Row 2: house blue (roofTL,TC,TR=0-2, midL,MC,MR=3-5, wallL,Win,R=6-8, botL,Door,BR=9-11)
    Row 3: house orange (same layout)
    Row 4-5: interior tiles
    Row 6-7: extra
    """
    ts = Image.open(f'{ASSETS}/Tileset/spr_tileset_sunnysideworld_16px.png')

    # Load buildings pack
    try:
        bld = Image.open(BUILDINGS)
        has_buildings = True
    except:
        has_buildings = False

    COLS, ROWS = 16, 8
    out = Image.new('RGBA', (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))

    def place(tile_img, col, row):
        if tile_img.size != (16, 16):
            tile_img = tile_img.resize((16, 16), Image.NEAREST)
        out.paste(tile_img, (col * TILE, row * TILE), tile_img)

    # ==================== ROW 0: TERRAIN ====================

    # Grass — pure bright green tiles (confirmed at rows 1-5, cols 0-8)
    place(crop_tile(ts, 2, 2), 0, 0)
    place(crop_tile(ts, 3, 3), 1, 0)
    place(crop_tile(ts, 5, 3), 2, 0)
    place(crop_tile(ts, 7, 3), 3, 0)
    place(crop_tile(ts, 2, 3), 4, 0)
    place(crop_tile(ts, 4, 2), 5, 0)

    # Dark grass (darker green at cols 51-52)
    place(crop_tile(ts, 51, 1), 6, 0)
    place(crop_tile(ts, 52, 2), 7, 0)

    # Tall grass (yellow-green at cols 6-7, row 5)
    place(crop_tile(ts, 6, 5), 8, 0)
    place(crop_tile(ts, 7, 5), 9, 0)

    # Paths (brown dirt at rows 10-12)
    place(crop_tile(ts, 2, 10), 10, 0)
    place(crop_tile(ts, 5, 10), 11, 0)
    place(crop_tile(ts, 7, 12), 12, 0)

    # Sand
    place(crop_tile(ts, 5, 1), 13, 0)
    place(crop_tile(ts, 7, 1), 14, 0)

    # Bridge — wooden plank
    place(crop_tile(ts, 38, 5), 15, 0)

    # ==================== ROW 1: OBJECTS ====================

    # Trees — standalone sprites
    tree1_strip = Image.open(f'{ASSETS}/Elements/Plants/spr_deco_tree_01_strip4.png')
    tree2_strip = Image.open(f'{ASSETS}/Elements/Plants/spr_deco_tree_02_strip4.png')

    fw1 = tree1_strip.width // 4
    t1 = tree1_strip.crop((0, 0, fw1, tree1_strip.height))
    bbox = t1.getbbox()
    if bbox:
        place(fit_in_tile(t1.crop(bbox), 0), 0, 1)

    t1b = tree1_strip.crop((fw1 * 2, 0, fw1 * 3, tree1_strip.height))
    bbox = t1b.getbbox()
    if bbox:
        place(fit_in_tile(t1b.crop(bbox), 0), 1, 1)

    fw2 = tree2_strip.width // 4
    t2 = tree2_strip.crop((0, 0, fw2, tree2_strip.height))
    bbox = t2.getbbox()
    if bbox:
        place(fit_in_tile(t2.crop(bbox), 0), 2, 1)

    # Water (deep blue at cols 11-12, rows 18-19)
    place(crop_tile(ts, 11, 18), 3, 1)
    place(crop_tile(ts, 12, 18), 4, 1)
    place(crop_tile(ts, 11, 19), 5, 1)
    place(crop_tile(ts, 12, 19), 6, 1)

    # Fence
    place(crop_tile(ts, 37, 5), 7, 1)

    # Sign
    place(crop_tile(ts, 38, 0), 8, 1)

    # Rocks/mountains
    place(crop_tile(ts, 53, 10), 9, 1)
    place(crop_tile(ts, 54, 10), 10, 1)

    # Flowers — use standalone decoration sprites
    flower_files = [
        ('Plants/spr_deco_mushroom_red_01_strip4.png', 16),
        ('Plants/spr_deco_mushroom_blue_01_strip4.png', 16),
        ('Plants/spr_deco_mushroom_blue_02_strip4.png', 16),
        ('Crops/sunflower_05.png', None),
        ('Crops/pumpkin_05.png', None),
    ]
    for i, (path, frame_w) in enumerate(flower_files):
        try:
            img = Image.open(f'{ASSETS}/Elements/{path}')
            if frame_w:
                frame = img.crop((0, 0, frame_w, img.height))
            else:
                frame = img
            bbox = frame.getbbox()
            if bbox:
                frame = frame.crop(bbox)
            place(fit_in_tile_centered(frame), 11 + i, 1)
        except Exception as e:
            print(f'Flower {path}: {e}')

    # ==================== ROW 2: HOUSE (Blue) ====================
    if has_buildings:
        house_blue = composite_house(bld)
        for row in range(4):
            for col in range(3):
                tile = house_blue.crop((col * 16, row * 16, (col + 1) * 16, (row + 1) * 16))
                place(tile, row * 3 + col, 2)
    else:
        # Fallback
        for i in range(12):
            place(crop_tile(ts, 22 + (i % 3), 9 + (i // 3)), i, 2)

    # ==================== ROW 3: HOUSE (Orange) ====================
    if has_buildings:
        house_orange = recolor_house(composite_house(bld), 'orange')
        for row in range(4):
            for col in range(3):
                tile = house_orange.crop((col * 16, row * 16, (col + 1) * 16, (row + 1) * 16))
                place(tile, row * 3 + col, 3)
    else:
        for i in range(12):
            place(crop_tile(ts, 22 + (i % 3), 17 + (i // 3)), i, 3)

    # ==================== ROWS 4-5: INTERIOR ====================
    # Floor tiles
    place(crop_tile(ts, 39, 9), 0, 4)
    place(crop_tile(ts, 40, 10), 1, 4)
    place(crop_tile(ts, 38, 12), 2, 4)

    # Wall tiles
    place(crop_tile(ts, 1, 15), 3, 4)
    place(crop_tile(ts, 2, 15), 4, 4)
    place(crop_tile(ts, 4, 15), 5, 4)

    # Table
    place(crop_tile(ts, 43, 7), 6, 4)
    place(crop_tile(ts, 42, 7), 7, 4)

    # Chair
    place(crop_tile(ts, 40, 12), 8, 4)

    # Bookshelf
    place(crop_tile(ts, 35, 9), 9, 4)
    place(crop_tile(ts, 36, 9), 10, 4)

    # Barrel
    place(crop_tile(ts, 45, 12), 11, 4)

    # Chest
    place(crop_tile(ts, 46, 12), 12, 4)

    # Bed
    place(crop_tile(ts, 37, 10), 13, 4)

    # Pot
    place(crop_tile(ts, 44, 10), 14, 4)

    # Carpet
    place(crop_tile(ts, 49, 12), 15, 4)

    # Row 5
    place(crop_tile(ts, 46, 10), 0, 5)   # Torch
    place(crop_tile(ts, 43, 10), 1, 5)   # Doormat
    place(crop_tile(ts, 48, 10), 2, 5)   # Altar

    out.save(f'{OUT}/sunnyside_tiles.png')
    print(f'Built game tileset: {out.size}')


def build_character_sheets():
    """Build character spritesheets from Sunnyside walking strips."""
    W, H = 272, 256
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    char_map = {
        'player':   {'file': 'base', 'cols': [0, 1, 2], 'base_row': 0},
        'mentor':   {'file': 'longhair', 'cols': [3, 4, 5], 'base_row': 0},
        'char3':    {'file': 'mophair', 'cols': [6, 7, 8], 'base_row': 0},
        'warrior':  {'file': 'spikeyhair', 'cols': [9, 10, 11], 'base_row': 0},
        'sage':     {'file': 'bowlhair', 'cols': [12, 13, 14], 'base_row': 0},
        'villager': {'file': 'shorthair', 'cols': [0, 1, 2], 'base_row': 8},
        'trader':   {'file': 'curlyhair', 'cols': [3, 4, 5], 'base_row': 8},
        'old':      {'file': 'tools', 'cols': [6, 7], 'base_row': 8},
    }

    def extract_frame(strip_img, frame_idx, num_frames):
        fw = strip_img.width // num_frames
        fh = strip_img.height
        frame = strip_img.crop((frame_idx * fw, 0, (frame_idx + 1) * fw, fh))
        bbox = frame.getbbox()
        if not bbox:
            return Image.new('RGBA', (16, 16), (0, 0, 0, 0))

        char_crop = frame.crop(bbox)
        cw, ch = char_crop.size

        scale = min(15 / cw, 15 / ch)
        nw = max(1, int(cw * scale))
        nh = max(1, int(ch * scale))
        scaled = char_crop.resize((nw, nh), Image.NEAREST)

        result = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        x = (16 - nw) // 2
        y = 16 - nh
        result.paste(scaled, (x, y), scaled)
        return result

    for name, cfg in char_map.items():
        walk_path = f'{ASSETS}/Characters/Human/WALKING/{cfg["file"]}_walk_strip8.png'
        idle_path = f'{ASSETS}/Characters/Human/IDLE/{cfg["file"]}_idle_strip9.png'

        try:
            walk_img = Image.open(walk_path)
        except:
            print(f'Warning: Could not load {walk_path}')
            continue

        try:
            idle_img = Image.open(idle_path)
        except:
            idle_img = walk_img

        standing = extract_frame(idle_img, 0, 9)
        walk1 = extract_frame(walk_img, 1, 8)
        walk2 = extract_frame(walk_img, 5, 8)
        frames = [standing, walk1, walk2]

        for dir_idx in range(4):
            row = cfg['base_row'] + dir_idx
            for frame_idx, col in enumerate(cfg['cols']):
                if frame_idx >= len(frames):
                    break
                f = frames[frame_idx].copy()
                if dir_idx == 1:
                    f = f.transpose(Image.FLIP_LEFT_RIGHT)
                out.paste(f, (col * 16, row * 16), f)

    # Goblin
    try:
        gw = Image.open(f'{ASSETS}/Characters/Goblin/PNG/spr_walk_strip8.png')
        gi = Image.open(f'{ASSETS}/Characters/Goblin/PNG/spr_idle_strip9.png')
        frames = [extract_frame(gi, 0, 9), extract_frame(gw, 1, 8), extract_frame(gw, 5, 8)]
        for dir_idx in range(4):
            for fi, f in enumerate(frames):
                fc = f.copy()
                if dir_idx == 1:
                    fc = fc.transpose(Image.FLIP_LEFT_RIGHT)
                out.paste(fc, ((15 + fi) * 16, dir_idx * 16), fc)
    except Exception as e:
        print(f'Goblin: {e}')

    # Skeleton
    try:
        sw = Image.open(f'{ASSETS}/Characters/Skeleton/PNG/skeleton_walk_strip8.png')
        si = Image.open(f'{ASSETS}/Characters/Skeleton/PNG/skeleton_idle_strip6.png')
        frames = [extract_frame(si, 0, 6), extract_frame(sw, 1, 8), extract_frame(sw, 5, 8)]
        for dir_idx in range(4):
            for fi, f in enumerate(frames):
                fc = f.copy()
                if dir_idx == 1:
                    fc = fc.transpose(Image.FLIP_LEFT_RIGHT)
                out.paste(fc, ((8 + fi) * 16, (8 + dir_idx) * 16), fc)
    except Exception as e:
        print(f'Skeleton: {e}')

    out.save(f'{OUT}/characters.png')
    print(f'Built character sheet: {out.size}')


def main():
    os.makedirs(OUT, exist_ok=True)

    ts = Image.open(f'{ASSETS}/Tileset/spr_tileset_sunnysideworld_16px.png')
    ts.save(f'{OUT}/sunnyside_tileset.png')
    print(f'Copied main tileset: {ts.size}')

    build_game_tileset()
    build_character_sheets()

    for name in ['spr_deco_tree_01_strip4', 'spr_deco_tree_02_strip4']:
        src = f'{ASSETS}/Elements/Plants/{name}.png'
        if os.path.exists(src):
            Image.open(src).save(f'{OUT}/{name}.png')

    print('\nDone! Sunnyside World assets integrated (v3).')


if __name__ == '__main__':
    main()
