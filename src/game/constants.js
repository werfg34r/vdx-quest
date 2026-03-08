// Tile size in the tileset
export const TILE = 16;
// Scale factor for crisp pixel art
export const SCALE = 3;
// Rendered tile size on screen
export const RS = TILE * SCALE; // 48px

// Village map dimensions in tiles
export const MAP_W = 32;
export const MAP_H = 24;

// Player
export const PLAYER_SPEED = 1.8;
export const PLAYER_FRAME_MS = 180;

// Game modes
export const MODE = {
  VILLAGE: 0,
  INTERIOR: 1,
};
