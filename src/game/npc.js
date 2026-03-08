// NPC system - walking NPCs with dialogue
import { TILE, PLAYER_SPEED, NPCS } from './constants.js';
import collisionData from '../data/collision.json';

const COL_W = collisionData.width;
const colMap = collisionData.data;

function getCollision(col, row) {
  if (col < 0 || col >= COL_W || row < 0 || row >= collisionData.height) return 0;
  return colMap[row * COL_W + col];
}

export function createNPCs() {
  return NPCS.map(def => ({
    ...def,
    currentX: def.x,
    currentY: def.y,
    targetIdx: 0,
    direction: 'right',
    moving: false,
    waitTimer: 60 + Math.random() * 120, // Wait before first move
    speed: PLAYER_SPEED * 0.5,
    dialogueIdx: 0,
  }));
}

export function updateNPCs(npcs, playerX, playerY) {
  for (const npc of npcs) {
    // Don't move if player is talking to them (close enough)
    const distToPlayer = Math.hypot(npc.currentX - playerX, npc.currentY - playerY);
    if (distToPlayer < TILE * 2) {
      npc.moving = false;
      // Face the player
      const dx = playerX - npc.currentX;
      npc.direction = dx > 0 ? 'right' : 'left';
      continue;
    }

    // Wait timer
    if (npc.waitTimer > 0) {
      npc.waitTimer--;
      npc.moving = false;
      continue;
    }

    // Move toward current patrol target
    const target = npc.patrolPath[npc.targetIdx];
    const dx = target.x - npc.currentX;
    const dy = target.y - npc.currentY;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      // Reached target, wait then go to next
      npc.currentX = target.x;
      npc.currentY = target.y;
      npc.targetIdx = (npc.targetIdx + 1) % npc.patrolPath.length;
      npc.waitTimer = 90 + Math.random() * 120;
      npc.moving = false;
    } else {
      // Move toward target
      const mx = (dx / dist) * npc.speed;
      const my = (dy / dist) * npc.speed;

      // Collision check
      const pad = 3;
      if (mx !== 0) {
        const nx = npc.currentX + mx;
        const checkCol = mx > 0
          ? Math.floor((nx + TILE - pad) / TILE)
          : Math.floor((nx + pad) / TILE);
        const rTop = Math.floor((npc.currentY + pad) / TILE);
        const rBot = Math.floor((npc.currentY + TILE - pad) / TILE);
        let ok = true;
        for (let r = rTop; r <= rBot; r++) {
          if (getCollision(checkCol, r) !== 1) { ok = false; break; }
        }
        if (ok) npc.currentX = nx;
      }
      if (my !== 0) {
        const ny = npc.currentY + my;
        const checkRow = my > 0
          ? Math.floor((ny + TILE - pad) / TILE)
          : Math.floor((ny + pad) / TILE);
        const cL = Math.floor((npc.currentX + pad) / TILE);
        const cR = Math.floor((npc.currentX + TILE - pad) / TILE);
        let ok = true;
        for (let c = cL; c <= cR; c++) {
          if (getCollision(c, checkRow) !== 1) { ok = false; break; }
        }
        if (ok) npc.currentY = ny;
      }

      npc.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        npc.direction = dx > 0 ? 'right' : 'left';
      } else {
        npc.direction = dy > 0 ? 'down' : 'up';
      }
    }
  }
}

// Find NPC near player
export function getNearbyNPC(npcs, playerX, playerY) {
  for (const npc of npcs) {
    const dist = Math.hypot(npc.currentX - playerX, npc.currentY - playerY);
    if (dist < TILE * 2.5) return npc;
  }
  return null;
}
