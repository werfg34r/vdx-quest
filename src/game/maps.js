import { MAP_COLS, MAP_ROWS } from './constants.js';

// Tile types for the village map
const G = 0;  // Grass
const W = 1;  // Water
const P = 2;  // Path (dirt)
const T = 3;  // Tree (collision)
const H1 = 10; // House 1 (blue) - position marker
const H2 = 11; // House 2 (green) - position marker
const H3 = 12; // House 3 (orange) - position marker
const F = 4;  // Fence
const FL = 5; // Flower
const B = 6;  // Bridge

// Village map - 30 columns x 22 rows
// The village has 3 houses, a river on the right, trees around edges, paths between houses
export const villageMap = [
  // Row 0 - top edge trees
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  // Row 1
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 2
  [T,G,G,G,FL,G,G,G,G,G,G,G,G,FL,G,G,G,G,G,G,FL,G,G,G,T,W,W,W,W,T],
  // Row 3 - House 1 top
  [T,G,G,G,G,H1,H1,H1,H1,H1,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 4 - House 1 middle
  [T,G,G,G,G,H1,H1,H1,H1,H1,G,G,G,G,G,G,G,H2,H2,H2,H2,H2,G,G,T,W,W,W,W,T],
  // Row 5 - House 1 bottom
  [T,G,G,G,G,H1,H1,H1,H1,H1,G,G,G,G,G,G,G,H2,H2,H2,H2,H2,G,G,G,B,B,G,G,T],
  // Row 6 - path
  [T,G,FL,G,G,G,G,P,G,G,G,G,G,G,G,G,G,H2,H2,H2,H2,H2,G,G,G,B,B,G,G,T],
  // Row 7
  [T,G,G,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,P,G,G,G,G,T,W,W,W,W,T],
  // Row 8
  [T,G,G,G,G,G,G,P,G,G,G,G,FL,G,G,G,G,G,G,P,G,G,G,G,T,W,W,W,W,T],
  // Row 9 - horizontal path
  [T,G,G,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,G,G,T,W,W,W,W,T],
  // Row 10
  [T,G,G,G,G,G,G,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 11
  [T,G,G,G,G,G,G,G,G,G,G,P,G,G,G,G,G,G,G,G,FL,G,G,G,T,W,W,W,W,T],
  // Row 12 - House 3 area
  [T,G,G,G,G,G,G,G,G,G,G,P,G,G,H3,H3,H3,H3,H3,G,G,G,G,G,T,W,W,W,W,T],
  // Row 13
  [T,G,FL,G,G,G,G,G,G,G,G,P,G,G,H3,H3,H3,H3,H3,G,G,G,G,G,G,B,B,G,G,T],
  // Row 14
  [T,G,G,G,G,G,G,G,G,G,G,P,P,P,H3,H3,H3,H3,H3,G,G,G,G,G,G,B,B,G,G,T],
  // Row 15
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,P,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 16
  [T,G,G,G,G,T,G,G,G,G,FL,G,G,G,G,G,G,G,G,G,G,G,FL,G,T,W,W,W,W,T],
  // Row 17
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 18
  [T,G,G,G,G,G,G,G,FL,G,G,G,G,G,G,G,T,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 19
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 20
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,W,W,W,W,T],
  // Row 21 - bottom edge
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

// House definitions with door positions and interior references
export const houses = [
  {
    id: 'house1',
    name: 'Maison de la Clarté',
    color: 'blue',
    // Top-left tile position of the house on the map
    mapX: 5,
    mapY: 3,
    width: 5,
    height: 3,
    // Door position (relative to map, where player stands to enter)
    doorX: 7,
    doorY: 6,
  },
  {
    id: 'house2',
    name: 'Maison du Courage',
    color: 'green',
    mapX: 17,
    mapY: 4,
    width: 5,
    height: 3,
    doorX: 19,
    doorY: 7,
  },
  {
    id: 'house3',
    name: 'Maison du Terrain',
    color: 'orange',
    mapX: 14,
    mapY: 12,
    width: 5,
    height: 3,
    doorX: 17,
    doorY: 15,
  },
];

// Interior map for houses (10x8 tiles)
export const INTERIOR_COLS = 10;
export const INTERIOR_ROWS = 8;

// Interior tile types
const FL_WOOD = 0;  // Wood floor
const WALL = 1;     // Wall
const TBL = 2;      // Table
const CHR = 3;      // Chair
const BED = 4;      // Bed
const BKSH = 5;     // Bookshelf
const CHST = 6;     // Chest
const DR = 7;       // Door (exit)
const RG = 8;       // Rug
const FP = 9;       // Fireplace
const BRL = 11;     // Barrel
const PT = 12;      // Pot

// Generic interior layout
export const interiorMap = [
  [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
  [WALL, BKSH, FL_WOOD, FL_WOOD, FP, FL_WOOD, FL_WOOD, FL_WOOD, BKSH, WALL],
  [WALL, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, WALL],
  [WALL, FL_WOOD, TBL, TBL, FL_WOOD, FL_WOOD, BED, BED, FL_WOOD, WALL],
  [WALL, FL_WOOD, CHR, CHR, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, FL_WOOD, WALL],
  [WALL, FL_WOOD, FL_WOOD, FL_WOOD, RG, RG, FL_WOOD, BRL, PT, WALL],
  [WALL, CHST, FL_WOOD, FL_WOOD, RG, RG, FL_WOOD, FL_WOOD, FL_WOOD, WALL],
  [WALL, WALL, WALL, WALL, DR, DR, WALL, WALL, WALL, WALL],
];

// Collision map for village (true = blocked)
export function isBlocked(tileType) {
  return tileType === T || tileType === W || tileType === F;
}

// Check if a tile is a house tile
export function isHouseTile(tileType) {
  return tileType === H1 || tileType === H2 || tileType === H3;
}

// Collision map for interior
export function isInteriorBlocked(tileType) {
  return tileType === WALL || tileType === TBL || tileType === BED ||
         tileType === BKSH || tileType === CHST || tileType === FP ||
         tileType === BRL || tileType === PT;
}

// Check if standing on a door
export function isInteriorDoor(tileType) {
  return tileType === DR;
}

export { G, W, P, T, H1, H2, H3, F, FL, B };
export { FL_WOOD, WALL, TBL, CHR, BED, BKSH, CHST, DR, RG, FP, BRL, PT };
