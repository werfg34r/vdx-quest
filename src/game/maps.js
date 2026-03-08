// Room data from GameMaker Room1.yy
import seaData from '../data/sea_tiles.json';
import roomAssets from '../data/room_assets.json';

// Sea tile grid (86x48, flat array of tile indices)
// Tile indices reference the sunnysideworld tileset (64 cols x 64 rows, 16px each)
export const SEA_W = seaData.width;   // 86
export const SEA_H = seaData.height;  // 48
export const seaTiles = seaData.tiles; // flat array of 4128 tile indices

// All placed sprite assets from Assets_1 + Assets_2 (570 total)
// Each: { sprite, x, y, scaleX, scaleY, rotation, colour, layer }
// Positions are in original pixel coordinates (room is 1366x768)
export const placedAssets = roomAssets;

// Get sea tile at grid position
export function getSeaTile(col, row) {
  if (col < 0 || col >= SEA_W || row < 0 || row >= SEA_H) return 0;
  return seaTiles[row * SEA_W + col] || 0;
}
