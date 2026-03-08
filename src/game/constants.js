// ═══════════════════════════════════════════════════════
// VDX QUEST - Constants & Definitions - Village 1
// ═══════════════════════════════════════════════════════

export const TILE = 16;
export const SCALE = 3;
export const RS = TILE * SCALE; // 48px rendered

// Village 1 map: 32x24 tiles
export const MAP_COLS = 32;
export const MAP_ROWS = 24;

export const MODE = {
  WORLD: 0,
  DIALOGUE: 1,
  BUILDING: 2,
};

// Player
export const PLAYER_SPEED = 1.6;
export const PLAYER_START_X = 15;
export const PLAYER_START_Y = 17;

// Tool definitions
export const TOOLS = {
  axe: { name: 'Hache', icon: 'axe', action: 'spr_axe', frames: 25, staminaCost: 0 },
};

// Items
export const ITEM_TYPES = {
  wood: { name: 'Bois', icon: 'wood', stackable: true },
  rock: { name: 'Pierre', icon: 'rock', stackable: true },
};

// House building stages
export const HOUSE_STAGES = [
  { name: 'Terrain vide',   woodCost: 0,  rockCost: 0 },
  { name: 'Fondations',     woodCost: 5,  rockCost: 0 },
  { name: 'Murs',           woodCost: 10, rockCost: 0 },
  { name: 'Toit',           woodCost: 5,  rockCost: 3 },
  { name: 'Maison terminee!', woodCost: 0, rockCost: 0 },
];

// Tileset tile IDs (from original Sunnyside World tileset)
export const TILES = {
  GRASS: 193,
  GRASS_ALT: 69,
  WATER: [1291, 1292, 1293, 1294, 1355, 1356, 1357, 1358, 1163, 1164, 1165, 1166, 1227, 1228, 1229, 1230],
  PATH: 460,
  PATH_ALT: 449,
  DIRT: 135,
};

// Village 1 Map Layout
// 0=water, 1=grass, 2=path, 3=forest(walkable+trees), 4=dense forest(blocked),
// 5=building plot, 6=rocks area, 7=Laurent spawn, 8=player spawn
export const VILLAGE1_MAP = generateVillage1();

function generateVillage1() {
  const m = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // Water border (2 tiles)
      if (r < 2 || r >= MAP_ROWS - 2 || c < 2 || c >= MAP_COLS - 2) {
        row.push(0);
        continue;
      }
      // Water edge (1 more tile for gentle shore)
      if (r === 2 || r === MAP_ROWS - 3 || c === 2 || c === MAP_COLS - 3) {
        row.push(0);
        continue;
      }

      // Dense forest border (north, northeast)
      if (r >= 3 && r <= 5 && c >= 3 && c <= MAP_COLS - 4) {
        row.push(4); // blocked forest
        continue;
      }

      // Walkable forest zone (rows 6-10, cols 3-14)
      if (r >= 6 && r <= 10 && c >= 3 && c <= 14) {
        row.push(3); // forest with trees
        continue;
      }

      // Dense forest left wall
      if (c === 3 && r >= 6 && r <= 14) {
        row.push(4);
        continue;
      }

      // Rock area (west side, rows 12-15)
      if (r >= 12 && r <= 14 && c >= 4 && c <= 7) {
        row.push(6);
        continue;
      }

      // Building plot (east side)
      if (r >= 13 && r <= 16 && c >= 22 && c <= 25) {
        row.push(5);
        continue;
      }

      // Central path (north-south)
      if (c >= 14 && c <= 16 && r >= 6 && r <= 19) {
        row.push(2);
        continue;
      }
      // Path branch to building plot
      if (r >= 14 && r <= 15 && c >= 16 && c <= 22) {
        row.push(2);
        continue;
      }
      // Path branch to rocks
      if (r >= 13 && r <= 14 && c >= 7 && c <= 14) {
        row.push(2);
        continue;
      }

      // Laurent spawn point
      if (r === 16 && c === 15) {
        row.push(7);
        continue;
      }

      // Player spawn
      if (r === 18 && c === 15) {
        row.push(8);
        continue;
      }

      // Default: grass
      row.push(1);
    }
    m.push(row);
  }
  return m;
}

// Tree positions in the forest zone
export const FOREST_TREES = [];
for (let r = 6; r <= 10; r++) {
  for (let c = 4; c <= 13; c++) {
    if ((r + c) % 2 === 0) {
      FOREST_TREES.push({ x: c, y: r });
    }
  }
}

// Rock positions
export const ROCK_POSITIONS = [
  { x: 4, y: 12 }, { x: 5, y: 13 }, { x: 6, y: 12 },
  { x: 7, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 },
];

// Laurent NPC
export const LAURENT = {
  id: 'laurent',
  name: 'Laurent',
  hair: 'shorthair',
  x: 15 * TILE,
  y: 16 * TILE,
};
