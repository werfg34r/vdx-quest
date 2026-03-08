// Sunnyside World - Original GameMaker room dimensions
export const TILE = 16;
export const SCALE = 2;           // 2x zoom for web display
export const RS = TILE * SCALE;   // 32px rendered tile size

// Room dimensions from GameMaker Room1
export const ROOM_W = 1366;       // pixels in original
export const ROOM_H = 768;        // pixels in original
export const MAP_W = 86;          // tiles (86 * 16 = 1376, slightly larger than room)
export const MAP_H = 48;          // tiles (48 * 16 = 768)

// Player
export const PLAYER_SPEED = 1.5;

// Game modes
export const MODE = {
  WORLD: 0,
};
