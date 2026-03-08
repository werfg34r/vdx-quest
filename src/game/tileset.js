// Tileset coordinates (x, y) in the 16px tileset
// Each value is [col, row] in tile units (multiply by 16 to get pixel coords)

export const TILES = {
  // Grass
  GRASS_1: [0, 0],
  GRASS_2: [1, 0],
  GRASS_3: [2, 0],
  GRASS_DARK: [0, 1],

  // Dirt / path
  DIRT_CENTER: [3, 1],
  DIRT_TOP: [3, 0],
  DIRT_BOTTOM: [3, 2],
  DIRT_LEFT: [2, 1],
  DIRT_RIGHT: [4, 1],
  DIRT_TL: [2, 0],
  DIRT_TR: [4, 0],
  DIRT_BL: [2, 2],
  DIRT_BR: [4, 2],

  // Water
  WATER: [0, 28],
  WATER_2: [1, 28],
  WATER_TOP: [1, 27],
  WATER_BOTTOM: [1, 29],
  WATER_LEFT: [0, 28],
  WATER_RIGHT: [2, 28],
  WATER_TL: [0, 27],
  WATER_TR: [2, 27],
  WATER_BL: [0, 29],
  WATER_BR: [2, 29],

  // Fence
  FENCE_H: [0, 12],
  FENCE_V: [0, 13],
  FENCE_POST: [1, 12],

  // Trees (in the tileset top-right area)
  TREE_TOP_L: [52, 3],
  TREE_TOP_R: [53, 3],
  TREE_BOT_L: [52, 4],
  TREE_BOT_R: [53, 4],

  // Single tree variants
  TREE_SM_1: [50, 5],
  TREE_SM_2: [51, 5],

  // Flowers
  FLOWER_1: [51, 9],
  FLOWER_2: [52, 9],
  FLOWER_3: [53, 9],
  FLOWER_4: [54, 9],

  // Grass decorations
  GRASS_TUFT_1: [49, 7],
  GRASS_TUFT_2: [50, 7],
  GRASS_TUFT_3: [51, 7],
};

// House tile positions in the tileset (these are larger structures)
// Blue house - row ~10 in tileset
// Green house - row ~14
// Orange house - row ~18
// Red house - row ~22
// Purple house - row ~26

// Each house is roughly 8x5 tiles
export const HOUSE_TILES = {
  blue: { startX: 13, startY: 6, width: 11, height: 6 },
  green: { startX: 13, startY: 12, width: 11, height: 6 },
  orange: { startX: 13, startY: 18, width: 11, height: 6 },
  red: { startX: 13, startY: 24, width: 11, height: 6 },
  purple: { startX: 13, startY: 30, width: 11, height: 6 },
};

// Interior furniture tiles (right side of tileset)
export const INTERIOR_TILES = {
  // Floor
  WOOD_FLOOR: [38, 6],
  WOOD_FLOOR_2: [39, 6],

  // Walls
  WALL_TOP: [38, 5],
  WALL_MID: [38, 6],

  // Furniture
  TABLE: [36, 7],
  CHAIR_L: [35, 8],
  CHAIR_R: [37, 8],
  BED_TOP: [36, 11],
  BED_BOT: [36, 12],
  BOOKSHELF: [38, 8],
  CHEST: [40, 12],
  LAMP: [37, 7],
  DOOR: [38, 10],
  RUG_TL: [43, 22],
  RUG_TR: [44, 22],
  RUG_BL: [43, 23],
  RUG_BR: [44, 23],
  WINDOW: [35, 6],
  FIREPLACE_T: [42, 7],
  FIREPLACE_B: [42, 8],
  POT: [39, 10],
  BARREL: [40, 10],
  STOOL: [41, 8],
};
