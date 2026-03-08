#!/usr/bin/env python3
"""Integrate Sunnyside World assets into VDX Quest.
Extracts tiles, characters from the Sunnyside World asset pack.
"""

from PIL import Image
import os

TILE = 16
ASSETS = '/tmp/sunnyside/Sunnyside_World_Assets'
OUT = 'public/assets'

def crop_tile(img, col, row, size=16):
    return img.crop((col * size, row * size, (col + 1) * size, (row + 1) * size))

def scale_to_tile(img_region, target=16):
    """Scale an image region to 16x16 using nearest neighbor (pixel art safe)."""
    return img_region.resize((target, target), Image.NEAREST)

def fit_in_tile(sprite, pad_bottom=2):
    """Fit a sprite into a 16x16 tile, centered horizontally, bottom-aligned."""
    result = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    sw, sh = sprite.size
    # Scale to fit
    scale = min(14 / sw, (16 - pad_bottom) / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    scaled = sprite.resize((nw, nh), Image.NEAREST)
    x = (16 - nw) // 2
    y = 16 - nh - pad_bottom
    result.paste(scaled, (x, y), scaled)
    return result


def build_game_tileset():
    """Build the game tileset from Sunnyside World.

    Layout (16 cols x 8 rows = 256x128):
    Row 0: grass(0-5), dark_grass(6-7), tall_grass(8-9), path(10-12), sand(13-14), bridge(15)
    Row 1: tree(0-2), water(3-6), fence(7), sign(8), mountain(9-10), flower(11-15)
    Row 2: house tiles (roof TL,TC,TR, mid-L,MC,MR, wall-L,Win,R, bot-L,Door,BR) = 12 tiles
    Row 3: second house color (same layout)
    Row 4-7: interior tiles
    """
    ts = Image.open(f'{ASSETS}/Tileset/spr_tileset_sunnysideworld_16px.png')

    COLS, ROWS = 16, 8
    out = Image.new('RGBA', (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))

    def place(tile_img, col, row):
        # Ensure 16x16
        if tile_img.size != (16, 16):
            tile_img = tile_img.resize((16, 16), Image.NEAREST)
        out.paste(tile_img, (col * TILE, row * TILE), tile_img)

    # ========== ROW 0: TERRAIN ==========

    # Grass — bright green solid tiles from rows 2-4
    place(crop_tile(ts, 2, 3), 0, 0)   # grass base
    place(crop_tile(ts, 3, 3), 1, 0)   # grass variant
    place(crop_tile(ts, 5, 3), 2, 0)   # grass variant
    place(crop_tile(ts, 1, 2), 3, 0)   # grass lighter
    place(crop_tile(ts, 1, 4), 4, 0)   # grass variant
    place(crop_tile(ts, 6, 3), 5, 0)   # grass variant

    # Dark grass — slightly darker green
    place(crop_tile(ts, 5, 4), 6, 0)   # dark grass
    place(crop_tile(ts, 3, 4), 7, 0)   # dark grass edge

    # Tall grass — the yellow-green farm crop tiles
    place(crop_tile(ts, 6, 5), 8, 0)   # tall/crop
    place(crop_tile(ts, 7, 5), 9, 0)   # tall/crop

    # Paths — brown dirt tiles from rows 9-10
    place(crop_tile(ts, 1, 9), 10, 0)  # path main
    place(crop_tile(ts, 5, 9), 11, 0)  # path variant
    place(crop_tile(ts, 2, 9), 12, 0)  # path edge

    # Sand — warm yellow
    place(crop_tile(ts, 5, 1), 13, 0)  # sand
    place(crop_tile(ts, 7, 1), 14, 0)  # sand variant

    # Bridge — wooden plank
    place(crop_tile(ts, 38, 9), 15, 0) # wood plank

    # ========== ROW 1: TREES, WATER, SPECIAL ==========

    # Trees — scale the standalone tree sprites to 16x16
    tree1_strip = Image.open(f'{ASSETS}/Elements/Plants/spr_deco_tree_01_strip4.png')
    tree2_strip = Image.open(f'{ASSETS}/Elements/Plants/spr_deco_tree_02_strip4.png')

    # Tree 1 (round tree): frame 0, 32x34 each
    t1_frame = tree1_strip.crop((0, 0, 32, 34))
    t1_bbox = t1_frame.getbbox()
    t1_crop = t1_frame.crop(t1_bbox)
    place(fit_in_tile(t1_crop, 0), 0, 1)

    # Tree 1 frame 2 (slightly different animation)
    t1_f2 = tree1_strip.crop((64, 0, 96, 34))
    t1_f2_bbox = t1_f2.getbbox()
    if t1_f2_bbox:
        t1_f2_crop = t1_f2.crop(t1_f2_bbox)
        place(fit_in_tile(t1_f2_crop, 0), 1, 1)

    # Tree 2 (conifer): frame 0, 28x43 each
    t2_frame = tree2_strip.crop((0, 0, 28, 43))
    t2_bbox = t2_frame.getbbox()
    t2_crop = t2_frame.crop(t2_bbox)
    place(fit_in_tile(t2_crop, 0), 2, 1)

    # Water — solid blue tiles
    place(crop_tile(ts, 11, 18), 3, 1)
    place(crop_tile(ts, 12, 18), 4, 1)
    place(crop_tile(ts, 11, 19), 5, 1)
    place(crop_tile(ts, 12, 19), 6, 1)

    # Fence — wooden fence post from tileset (col 37, row 1 area)
    place(crop_tile(ts, 37, 1), 7, 1)

    # Sign — sign-like element
    place(crop_tile(ts, 41, 1), 8, 1)

    # Mountain/rocks — gray rock tiles
    # Use items from the decoration area
    place(crop_tile(ts, 53, 10), 9, 1)
    place(crop_tile(ts, 54, 10), 10, 1)

    # Flowers — colorful small flowers from the items area
    # Row 4, cols 48-52 have colored small objects
    place(crop_tile(ts, 48, 2), 11, 1)  # green bush
    place(crop_tile(ts, 49, 2), 12, 1)  # blue item
    place(crop_tile(ts, 48, 1), 13, 1)  # plant
    place(crop_tile(ts, 49, 1), 14, 1)  # item
    place(crop_tile(ts, 50, 1), 15, 1)  # item

    # ========== ROW 2: HOUSE (Blue/Teal) ==========
    # Use building tiles from the main tileset
    # Blue house rows 9-12, cols ~20-28
    # Looking at the tileset buildings area around cols 22-24, rows 9-12

    # Alternative: use the building rows from cols 14-17 (the green house panels area)
    # Actually from earlier observation, rows 9-16 cols 1-8 have wooden frame pieces
    # Let me use a simpler approach - the house facade tiles

    # Top roof row (3 wide)
    place(crop_tile(ts, 22, 9), 0, 2)
    place(crop_tile(ts, 23, 9), 1, 2)
    place(crop_tile(ts, 24, 9), 2, 2)
    # Mid roof row
    place(crop_tile(ts, 22, 10), 3, 2)
    place(crop_tile(ts, 23, 10), 4, 2)
    place(crop_tile(ts, 24, 10), 5, 2)
    # Wall row (with window in center)
    place(crop_tile(ts, 22, 11), 6, 2)
    place(crop_tile(ts, 23, 11), 7, 2)
    place(crop_tile(ts, 24, 11), 8, 2)
    # Bottom row (with door in center)
    place(crop_tile(ts, 22, 12), 9, 2)
    place(crop_tile(ts, 23, 12), 10, 2)
    place(crop_tile(ts, 24, 12), 11, 2)

    # ========== ROW 3: HOUSE 2 (Orange) ==========
    place(crop_tile(ts, 22, 17), 0, 3)
    place(crop_tile(ts, 23, 17), 1, 3)
    place(crop_tile(ts, 24, 17), 2, 3)
    place(crop_tile(ts, 22, 18), 3, 3)
    place(crop_tile(ts, 23, 18), 4, 3)
    place(crop_tile(ts, 24, 18), 5, 3)
    place(crop_tile(ts, 22, 19), 6, 3)
    place(crop_tile(ts, 23, 19), 7, 3)
    place(crop_tile(ts, 24, 19), 8, 3)
    place(crop_tile(ts, 22, 20), 9, 3)
    place(crop_tile(ts, 23, 20), 10, 3)
    place(crop_tile(ts, 24, 20), 11, 3)

    # ========== ROWS 4-5: INTERIOR ==========

    # Floor tiles
    place(crop_tile(ts, 38, 9), 0, 4)   # wood floor
    place(crop_tile(ts, 39, 9), 1, 4)   # wood floor 2
    place(crop_tile(ts, 40, 9), 2, 4)   # wood floor 3

    # Wall tiles (stone)
    place(crop_tile(ts, 1, 15), 3, 4)   # stone wall
    place(crop_tile(ts, 2, 15), 4, 4)   # stone wall 2
    place(crop_tile(ts, 5, 15), 5, 4)   # stone wall dark

    # Table
    place(crop_tile(ts, 38, 10), 6, 4)
    place(crop_tile(ts, 39, 10), 7, 4)

    # Chair
    place(crop_tile(ts, 41, 10), 8, 4)

    # Bookshelf
    place(crop_tile(ts, 35, 9), 9, 4)
    place(crop_tile(ts, 35, 10), 10, 4)

    # Barrel
    place(crop_tile(ts, 43, 10), 11, 4)

    # Chest
    place(crop_tile(ts, 45, 10), 12, 4)

    # Bed
    place(crop_tile(ts, 37, 10), 13, 4)

    # Pot/jar
    place(crop_tile(ts, 44, 10), 14, 4)

    # Carpet
    place(crop_tile(ts, 42, 12), 15, 4)

    # Row 5: More interior + misc
    # Torch/light
    place(crop_tile(ts, 46, 10), 0, 5)
    # Door mat
    place(crop_tile(ts, 40, 12), 1, 5)
    # Altar/special
    place(crop_tile(ts, 48, 10), 2, 5)

    out.save(f'{OUT}/sunnyside_tiles.png')
    print(f'Built game tileset: {out.size}')


def build_character_sheets():
    """Build character spritesheets from Sunnyside walking strips.

    Output layout matches original character.png: 272x256 (17 cols x 16 rows)
    """
    W, H = 272, 256
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    char_map = {
        'player':   {'file': 'base', 'cols': [0,1,2], 'base_row': 0},
        'mentor':   {'file': 'longhair', 'cols': [3,4,5], 'base_row': 0},
        'char3':    {'file': 'mophair', 'cols': [6,7,8], 'base_row': 0},
        'warrior':  {'file': 'spikeyhair', 'cols': [9,10,11], 'base_row': 0},
        'sage':     {'file': 'bowlhair', 'cols': [12,13,14], 'base_row': 0},
        'villager': {'file': 'shorthair', 'cols': [0,1,2], 'base_row': 8},
        'trader':   {'file': 'curlyhair', 'cols': [3,4,5], 'base_row': 8},
        'old':      {'file': 'tools', 'cols': [6,7], 'base_row': 8},
    }

    def extract_frame(strip_img, frame_idx, num_frames):
        """Extract a character frame and fit into 16x16."""
        fw = strip_img.width // num_frames
        fh = strip_img.height
        frame = strip_img.crop((frame_idx * fw, 0, (frame_idx + 1) * fw, fh))
        bbox = frame.getbbox()
        if not bbox:
            return Image.new('RGBA', (16, 16), (0, 0, 0, 0))

        char_crop = frame.crop(bbox)
        cw, ch = char_crop.size

        # Scale to fit in 16x16 (keep proportions, pixel-art scale)
        scale = min(14 / cw, 15 / ch)
        nw = max(1, int(cw * scale))
        nh = max(1, int(ch * scale))
        scaled = char_crop.resize((nw, nh), Image.NEAREST)

        result = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        x = (16 - nw) // 2
        y = 16 - nh - 1  # bottom-aligned with 1px padding
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

        # Frame selection: standing (idle 0), walk mid-left (walk 2), walk mid-right (walk 6)
        standing = extract_frame(idle_img, 0, 9)
        walk1 = extract_frame(walk_img, 2, 8)
        walk2 = extract_frame(walk_img, 6, 8)
        frames = [standing, walk1, walk2]

        for dir_idx in range(4):
            row = cfg['base_row'] + dir_idx
            for frame_idx, col in enumerate(cfg['cols']):
                if frame_idx >= len(frames):
                    break

                f = frames[frame_idx].copy()

                # Direction adjustments
                if dir_idx == 1:  # left - mirror
                    f = f.transpose(Image.FLIP_LEFT_RIGHT)
                # dir 0 (down) and 2 (right): keep as-is
                # dir 3 (up): keep as-is (no back view available)

                out.paste(f, (col * 16, row * 16), f)

    # Add Goblin as extra character
    try:
        gw = Image.open(f'{ASSETS}/Characters/Goblin/PNG/spr_walk_strip8.png')
        gi = Image.open(f'{ASSETS}/Characters/Goblin/PNG/spr_idle_strip9.png')

        standing = extract_frame(gi, 0, 9)
        walk1 = extract_frame(gw, 2, 8)
        frames = [standing, walk1]

        for dir_idx in range(4):
            for fi, f in enumerate(frames):
                fc = f.copy()
                if dir_idx == 1:
                    fc = fc.transpose(Image.FLIP_LEFT_RIGHT)
                out.paste(fc, ((15 + fi) * 16, dir_idx * 16), fc)
    except Exception as e:
        print(f'Goblin: {e}')

    # Add Skeleton as extra character
    try:
        sw = Image.open(f'{ASSETS}/Characters/Skeleton/PNG/skeleton_walk_strip8.png')
        si = Image.open(f'{ASSETS}/Characters/Skeleton/PNG/skeleton_idle_strip6.png')

        standing = extract_frame(si, 0, 6)
        walk1 = extract_frame(sw, 2, 8)
        frames = [standing, walk1]

        for dir_idx in range(4):
            for fi, f in enumerate(frames):
                fc = f.copy()
                if dir_idx == 1:
                    fc = fc.transpose(Image.FLIP_LEFT_RIGHT)
                # Place at cols 8-9, rows 8-11
                out.paste(fc, ((8 + fi) * 16, (8 + dir_idx) * 16), fc)
    except Exception as e:
        print(f'Skeleton: {e}')

    out.save(f'{OUT}/characters.png')
    print(f'Built character sheet: {out.size}')


def main():
    os.makedirs(OUT, exist_ok=True)

    # Copy the full tileset for reference
    ts = Image.open(f'{ASSETS}/Tileset/spr_tileset_sunnysideworld_16px.png')
    ts.save(f'{OUT}/sunnyside_tileset.png')
    print(f'Copied main tileset: {ts.size}')

    build_game_tileset()
    build_character_sheets()

    # Copy tree strips for potential animated trees
    for name in ['spr_deco_tree_01_strip4', 'spr_deco_tree_02_strip4']:
        src = f'{ASSETS}/Elements/Plants/{name}.png'
        if os.path.exists(src):
            Image.open(src).save(f'{OUT}/{name}.png')

    print('\nDone! Sunnyside World assets integrated.')


if __name__ == '__main__':
    main()
