import { TILE, PLAYER_SPEED, MODE, HOUSES, INT_W, INT_H } from './constants.js';
import collisionData from '../data/collision.json';

const COL_W = collisionData.width;   // 86
const COL_H = collisionData.height;  // 48
const colMap = collisionData.data;    // 0=blocked, 1=walkable, 2=building

function getCollision(col, row) {
  if (col < 0 || col >= COL_W || row < 0 || row >= COL_H) return 0;
  return colMap[row * COL_W + col];
}

// Interior layout
// IW=wall, IF=floor, IT=table, IC=chair, IB=bed, IK=bookshelf, IX=chest, ID=door, IR=rug, IP=fire, IL=barrel, IQ=plant
const IW = 0, IF = 1, IT = 2, IC = 3, IB = 4, IK = 5, IX = 6, ID = 7, IR = 8, IP = 9, IL = 10, IQ = 11;

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

export const INTERIOR_BLOCKED = new Set([IW, IT, IB, IK, IX, IP, IL, IQ]);

export function createPlayer() {
  return {
    // Start in walkable area near center - tile (35, 30) which is clearly walkable
    x: 35 * TILE,
    y: 30 * TILE,
    direction: 'down',
    moving: false,
    // Interior position
    interiorX: 4 * TILE,
    interiorY: 5 * TILE,
  };
}

export function updatePlayer(player, keys, mode) {
  let dx = 0, dy = 0;

  if (keys.ArrowLeft  || keys.KeyA || keys.KeyQ) { dx = -PLAYER_SPEED; player.direction = 'left'; }
  if (keys.ArrowRight || keys.KeyD)               { dx =  PLAYER_SPEED; player.direction = 'right'; }
  if (keys.ArrowUp    || keys.KeyW || keys.KeyZ)  { dy = -PLAYER_SPEED; player.direction = 'up'; }
  if (keys.ArrowDown  || keys.KeyS)               { dy =  PLAYER_SPEED; player.direction = 'down'; }

  player.moving = dx !== 0 || dy !== 0;

  if (mode === MODE.WORLD) {
    moveWorld(player, dx, dy);
  } else {
    moveInterior(player, dx, dy);
  }
}

function moveWorld(player, dx, dy) {
  const pad = 3; // collision padding in pixels

  // Try X movement
  if (dx !== 0) {
    const nx = player.x + dx;
    const checkCol = dx > 0
      ? Math.floor((nx + TILE - pad) / TILE)
      : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.y + pad) / TILE);
    const rBot = Math.floor((player.y + TILE - pad) / TILE);

    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      const c = getCollision(checkCol, r);
      if (c !== 1) { ok = false; break; } // Only 1=walkable
    }
    if (ok) player.x = nx;
  }

  // Try Y movement
  if (dy !== 0) {
    const ny = player.y + dy;
    const checkRow = dy > 0
      ? Math.floor((ny + TILE - pad) / TILE)
      : Math.floor((ny + pad) / TILE);
    const cLeft  = Math.floor((player.x + pad) / TILE);
    const cRight = Math.floor((player.x + TILE - pad) / TILE);

    let ok = true;
    for (let c = cLeft; c <= cRight; c++) {
      const col = getCollision(c, checkRow);
      if (col !== 1) { ok = false; break; }
    }
    if (ok) player.y = ny;
  }
}

function moveInterior(player, dx, dy) {
  const pad = 3;

  if (dx !== 0) {
    const nx = player.interiorX + dx;
    const checkCol = dx > 0
      ? Math.floor((nx + TILE - pad) / TILE)
      : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.interiorY + pad) / TILE);
    const rBot = Math.floor((player.interiorY + TILE - pad) / TILE);

    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      const t = interiorMap[r]?.[checkCol];
      if (t === undefined || INTERIOR_BLOCKED.has(t)) { ok = false; break; }
    }
    if (ok) player.interiorX = nx;
  }

  if (dy !== 0) {
    const ny = player.interiorY + dy;
    const checkRow = dy > 0
      ? Math.floor((ny + TILE - pad) / TILE)
      : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((player.interiorX + pad) / TILE);
    const cR = Math.floor((player.interiorX + TILE - pad) / TILE);

    let ok = true;
    for (let c = cL; c <= cR; c++) {
      const t = interiorMap[checkRow]?.[c];
      if (t === undefined || INTERIOR_BLOCKED.has(t)) { ok = false; break; }
    }
    if (ok) player.interiorY = ny;
  }
}

// Check if player is near a house door
export function getNearbyHouse(player) {
  const ptx = player.x / TILE;
  const pty = player.y / TILE;
  for (const h of HOUSES) {
    const dx = Math.abs(ptx - h.doorX);
    const dy = Math.abs(pty - h.doorY);
    if (dx < 1.8 && dy < 1.8) return h;
  }
  return null;
}

// Check if player is at interior door
export function isAtInteriorDoor(player) {
  const col = Math.floor((player.interiorX + TILE / 2) / TILE);
  const row = Math.floor((player.interiorY + TILE / 2) / TILE);
  return interiorMap[row]?.[col] === ID;
}
