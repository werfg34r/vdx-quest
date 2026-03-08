import { MAP_W, MAP_H } from './constants.js';

// ── Tile types ──
export const _ = 0;   // Grass (plain)
export const G2 = 1;  // Grass variant 2
export const W = 2;   // Water
export const P = 3;   // Path/dirt
export const T = 4;   // Tree (collidable)
export const F = 5;   // Fence
export const FL = 6;  // Flower
export const B = 7;   // Bridge
export const R = 8;   // Rock
export const H = 9;   // House footprint (collidable, rendered separately)
export const WE = 10; // Water edge

// ── Village Layout (32 x 24) ──
// A cozy Pokemon-style village: grass everywhere, 3 houses, a river, trees around borders
export const villageMap = [
// 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T], // 0
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 1
  [T, _, FL,_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, FL,_, T, WE,W, W, W, W, WE,T, T], // 2
  [T, _, _, _, _, H, H, H, H, H, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 3
  [T, _, _, _, _, H, H, H, H, H, _, _, _, _, _, _, H, H, H, H, H, _, _, T, WE,W, W, W, W, WE,T, T], // 4
  [T, _, _, _, _, H, H, H, H, H, _, _, _, _, _, _, H, H, H, H, H, _, _, T, WE,W, W, W, W, WE,T, T], // 5
  [T, _, FL,_, _, _, _, P, _, _, _, _, _, _, _, _, H, H, H, H, H, _, _, _, B, B, W, W, B, B, T, T], // 6
  [T, _, _, _, _, _, _, P, _, _, _, FL,_, _, _, _, _, _, P, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 7
  [T, _, _, _, _, _, _, P, _, _, _, _, _, _, _, _, _, _, P, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 8
  [T, _, _, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, _, _, T, WE,W, W, W, W, WE,T, T], // 9
  [T, _, _, _, _, _, _, _, _, _, _, P, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 10
  [T, _, _, _, _, _, _, _, _, _, _, P, _, _, _, _, _, _, _, FL,_, _, _, T, WE,W, W, W, W, WE,T, T], // 11
  [T, _, _, _, _, R, _, _, _, _, _, P, _, _, H, H, H, H, H, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 12
  [T, _, FL,_, _, _, _, _, _, _, _, P, _, _, H, H, H, H, H, _, _, _, _, _, B, B, W, W, B, B, T, T], // 13
  [T, _, _, _, _, _, _, _, _, _, _, P, P, P, H, H, H, H, H, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 14
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, P, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 15
  [T, _, _, _, _, T, _, _, _, FL,_, _, _, _, _, _, _, _, _, _, _, FL,_, T, WE,W, W, W, W, WE,T, T], // 16
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 17
  [T, _, FL,_, _, _, _, _, _, _, _, _, FL,_, _, _, _, T, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 18
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, FL,_, _, T, WE,W, W, W, W, WE,T, T], // 19
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 20
  [T, _, _, _, _, _, _, R, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 21
  [T, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, T, WE,W, W, W, W, WE,T, T], // 22
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T], // 23
];

// ── House definitions ──
export const houses = [
  {
    id: 'house1',
    name: 'Maison du Savoir',
    style: 'red',    // Red roof from Serene Village tileset
    mapX: 5, mapY: 3,
    w: 5, h: 3,
    doorX: 7, doorY: 6,  // Where player stands to enter
  },
  {
    id: 'house2',
    name: 'Maison du Courage',
    style: 'green',
    mapX: 16, mapY: 4,
    w: 5, h: 3,
    doorX: 18, doorY: 7,
  },
  {
    id: 'house3',
    name: 'Maison de l\'Esprit',
    style: 'blue',
    mapX: 14, mapY: 12,
    w: 5, h: 3,
    doorX: 16, doorY: 15,
  },
];

// ── Interior (10 x 8) ──
export const INT_W = 10;
export const INT_H = 8;

// Interior tile types
export const IW = 0; // Wall
export const IF = 1; // Wood floor
export const IT = 2; // Table
export const IC = 3; // Chair
export const IB = 4; // Bed
export const IK = 5; // Bookshelf
export const IX = 6; // Chest
export const ID = 7; // Door (exit)
export const IR = 8; // Rug
export const IP = 9; // Fireplace
export const IL = 10; // Barrel
export const IQ = 11; // Potted plant

export const interiorMap = [
  [IW, IW, IW, IW, IW, IW, IW, IW, IW, IW],
  [IW, IK, IF, IF, IP, IF, IF, IF, IK, IW],
  [IW, IF, IF, IF, IF, IF, IF, IF, IF, IW],
  [IW, IF, IT, IT, IF, IF, IB, IB, IF, IW],
  [IW, IF, IC, IC, IF, IF, IF, IF, IF, IW],
  [IW, IF, IF, IF, IR, IR, IF, IL, IQ, IW],
  [IW, IX, IF, IF, IR, IR, IF, IF, IF, IW],
  [IW, IW, IW, IW, ID, ID, IW, IW, IW, IW],
];

// ── Collision helpers ──
export function isBlocked(tile) {
  return tile === T || tile === W || tile === WE || tile === H || tile === R || tile === F;
}

export function isInteriorBlocked(tile) {
  return tile === IW || tile === IT || tile === IB || tile === IK || tile === IX || tile === IP || tile === IL || tile === IQ;
}

export function isInteriorDoor(tile) {
  return tile === ID;
}
