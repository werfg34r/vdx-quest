// ═══════════════════════════════════════════════════════
// VDX QUEST - Village 1 - Constants & Definitions
// ═══════════════════════════════════════════════════════

// ── Tile & Rendering ──
export const TILE = 16;
export const SCALE = 2;
export const RS = TILE * SCALE;

// Room dimensions from GameMaker Room1
export const ROOM_W = 1366;
export const ROOM_H = 768;
export const MAP_W = 86;
export const MAP_H = 48;

// ── Game modes ──
export const MODE = {
  WORLD: 0,
  DIALOGUE: 1,
};

// ── Player stats ──
export const PLAYER_SPEED = 1.8;
export const PLAYER_START_X = 35;
export const PLAYER_START_Y = 30;

// ── Tools ──
export const TOOLS = {
  axe:     { name: 'Hache',   icon: 'axe',     action: 'spr_axe',    frames: 25, staminaCost: 0 },
  pickaxe: { name: 'Pioche',  icon: 'pickaxe', action: 'spr_mining', frames: 25, staminaCost: 0 },
};

// ── Items ──
export const ITEM_TYPES = {
  wood: { name: 'Bois',   icon: 'wood', stackable: true },
  rock: { name: 'Pierre', icon: 'rock', stackable: true },
};

// ── House building stages ──
export const HOUSE_STAGES = [
  { name: 'Terrain vide',     woodCost: 0,  rockCost: 0 },
  { name: 'Fondations',       woodCost: 5,  rockCost: 0 },
  { name: 'Murs',             woodCost: 10, rockCost: 0 },
  { name: 'Toit',             woodCost: 5,  rockCost: 3 },
  { name: 'Maison terminee!', woodCost: 0,  rockCost: 0 },
];

// ── Building plot position (open grassy area on the map) ──
export const BUILD_PLOT = { x: 42, y: 30, w: 4, h: 4 };

// ── World Objects ──
export const WORLD_TREES = [
  { x: 22, y: 25 }, { x: 30, y: 33 }, { x: 60, y: 30 }, { x: 25, y: 35 },
  { x: 65, y: 25 }, { x: 35, y: 22 }, { x: 50, y: 35 }, { x: 70, y: 28 },
  { x: 28, y: 18 }, { x: 55, y: 32 }, { x: 18, y: 30 }, { x: 45, y: 33 },
  { x: 38, y: 36 }, { x: 62, y: 34 }, { x: 20, y: 22 }, { x: 48, y: 20 },
];

export const WORLD_ROCKS = [
  { x: 65, y: 28 }, { x: 18, y: 35 }, { x: 40, y: 32 },
  { x: 58, y: 18 }, { x: 75, y: 30 }, { x: 32, y: 38 },
  { x: 48, y: 36 }, { x: 26, y: 22 },
];

// ── Laurent NPC ──
export const LAURENT = {
  id: 'laurent',
  name: 'Laurent',
  hair: 'shorthair',
  x: 37 * TILE,
  y: 29 * TILE,
  patrolPath: [
    { x: 37 * TILE, y: 29 * TILE },
    { x: 39 * TILE, y: 29 * TILE },
    { x: 39 * TILE, y: 31 * TILE },
    { x: 37 * TILE, y: 31 * TILE },
  ],
};
