#!/usr/bin/env python3
"""Build the final game tileset combining:
- Procedural terrain tiles (from generate_tileset.py logic)
- House tiles from Sunnyside buildings pack
- Interior tiles from Sunnyside tileset
Output: public/assets/sunnyside_tiles.png (256x128, 16x8 grid matching sprites.js TC layout)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image
from generate_tileset import (
    make_grass, make_dark_grass, make_tall_grass, make_path, make_sand,
    make_tree, make_tree2, make_tree3, make_water, make_flower,
    make_fence, make_bridge, make_sign, make_mountain, make_characters,
    TILE
)

BUILDINGS = '/tmp/archive/SUNNYSIDE_WORLD_BUILDINGS_V0.01/SUNNYSIDE_WORLD_BUILDINGS_V0.01.png'
SUNNYSIDE_TS = '/tmp/sunnyside/Sunnyside_World_Assets/Tileset/spr_tileset_sunnysideworld_16px.png'
# Try V2.1 first
SUNNYSIDE_TS_V2 = '/tmp/v2assets/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets/Tileset/spr_tileset_sunnysideworld_16px.png'
OUT = 'public/assets'


def crop_tile(img, col, row, size=16):
    return img.crop((col * size, row * size, (col + 1) * size, (row + 1) * size))


def composite_house(bld):
    """Build a 3x4 tile (48x64) house from the buildings pack."""
    roof = bld.crop((2 * 16, 0, 5 * 16, 3 * 16))
    wall = bld.crop((2 * 16, 4 * 16, 5 * 16, 8 * 16))
    roof_s = roof.resize((48, 32), Image.NEAREST)
    wall_s = wall.resize((48, 32), Image.NEAREST)
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
            else:
                new_data.append(px)
        else:
            new_data.append(px)
    result.putdata(new_data)
    return result


def main():
    os.makedirs(OUT, exist_ok=True)

    COLS, ROWS = 16, 8
    out = Image.new('RGBA', (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))

    def place(tile_img, col, row):
        if tile_img.size != (16, 16):
            tile_img = tile_img.resize((16, 16), Image.NEAREST)
        out.paste(tile_img, (col * TILE, row * TILE), tile_img)

    # ==================== ROW 0: TERRAIN ====================
    # sprites.js expects: grass(0-5), darkGrass(6-7), tallGrass(8-9), path(10-12), sand(13-14), bridge(15)

    # Grass variants (6 tiles)
    for i in range(6):
        place(make_grass(i), i, 0)

    # Dark grass (2 tiles)
    place(make_dark_grass(0), 6, 0)
    place(make_dark_grass(1), 7, 0)

    # Tall grass (2 tiles)
    place(make_tall_grass(0), 8, 0)
    place(make_tall_grass(1), 9, 0)

    # Path (3 tiles)
    for i in range(3):
        place(make_path(i), 10 + i, 0)

    # Sand (2 tiles)
    place(make_sand(0), 13, 0)
    place(make_sand(1), 14, 0)

    # Bridge
    place(make_bridge(), 15, 0)

    # ==================== ROW 1: OBJECTS ====================
    # sprites.js expects: tree(0-2), water(3-6), fence(7), sign(8), mountain(9-10), flower(11-15)

    # Trees (3 variants)
    place(make_tree(0), 0, 1)
    place(make_tree2(1), 1, 1)
    place(make_tree3(2), 2, 1)

    # Water (4 animated frames)
    for i in range(4):
        place(make_water(i), 3 + i, 1)

    # Fence
    place(make_fence(), 7, 1)

    # Sign
    place(make_sign(), 8, 1)

    # Mountain (2 tiles)
    place(make_mountain(), 9, 1)
    # Mountain variant (slightly different)
    mt2 = make_mountain()
    # Flip for variety
    mt2 = mt2.transpose(Image.FLIP_LEFT_RIGHT)
    place(mt2, 10, 1)

    # Flowers (5 variants)
    for i in range(5):
        place(make_flower(i), 11 + i, 1)

    # ==================== ROW 2: HOUSE (Blue) ====================
    # sprites.js expects: 12 house tiles (4 rows × 3 cols) at (0-11, y=2)
    try:
        bld = Image.open(BUILDINGS)
        house_blue = composite_house(bld)
        for row in range(4):
            for col in range(3):
                tile = house_blue.crop((col * 16, row * 16, (col + 1) * 16, (row + 1) * 16))
                place(tile, row * 3 + col, 2)
        print('Blue house: from buildings pack')
    except Exception as e:
        print(f'Blue house: fallback (error: {e})')

    # ==================== ROW 3: HOUSE (Orange) ====================
    try:
        bld = Image.open(BUILDINGS)
        house_orange = recolor_house(composite_house(bld), 'orange')
        for row in range(4):
            for col in range(3):
                tile = house_orange.crop((col * 16, row * 16, (col + 1) * 16, (row + 1) * 16))
                place(tile, row * 3 + col, 3)
        print('Orange house: recolored from buildings pack')
    except Exception as e:
        print(f'Orange house: fallback (error: {e})')

    # ==================== ROWS 4-5: INTERIOR ====================
    # Try Sunnyside tileset for furniture
    ts = None
    for ts_path in [SUNNYSIDE_TS_V2, SUNNYSIDE_TS]:
        try:
            ts = Image.open(ts_path)
            print(f'Interior tiles from: {ts_path}')
            break
        except:
            continue

    if ts:
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
        place(crop_tile(ts, 46, 10), 0, 5)  # Torch
        place(crop_tile(ts, 43, 10), 1, 5)  # Doormat
        place(crop_tile(ts, 48, 10), 2, 5)  # Altar
    else:
        print('WARNING: No Sunnyside tileset found for interior tiles')

    out.save(f'{OUT}/sunnyside_tiles.png')
    print(f'Built combined tileset: {out.size} ({COLS}x{ROWS} tiles)')

    # Also regenerate characters
    char_img = make_characters()
    char_img.save(f'{OUT}/characters.png')
    print(f'Regenerated characters: {char_img.size}')


if __name__ == '__main__':
    main()
