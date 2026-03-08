import { TILE, SCALE, RS, MAP_W, MAP_H, MODE } from './constants.js';
import { getImg } from './assets.js';
import {
  villageMap, houses, interiorMap, INT_W, INT_H,
  _, G2, W, P, T, F, FL, B, R, H, WE,
  IW, IF, IT, IC, IB, IK, IX, ID, IR, IP, IL, IQ,
} from './maps.js';

// ════════════════════════════════════════════════════════
// Sunny Side World tileset (1024x1024, 16px grid = 64 cols x 64 rows)
// - Grass: top-left (0,0)
// - Bridges: left side rows 3-4
// - Trees: top-right area + individual sprites
//
// Serene Village tileset (304x720, 16px) - used for houses
// ════════════════════════════════════════════════════════

// Draw a tile from the village tileset
function vTile(ctx, sx, sy, dx, dy, tw = 1, th = 1) {
  const img = getImg('village');
  if (!img) return;
  ctx.drawImage(img,
    sx * TILE, sy * TILE, TILE * tw, TILE * th,
    dx, dy, RS * tw, RS * th
  );
}

// Draw tile from Sunny Side World tileset (1024x1024, 16px = 64 cols x 64 rows)
function sTile(ctx, sx, sy, dx, dy, tw = 1, th = 1) {
  const img = getImg('sunnyside');
  if (!img) return;
  ctx.drawImage(img,
    sx * TILE, sy * TILE, TILE * tw, TILE * th,
    dx, dy, RS * tw, RS * th
  );
}

// ── GRASS ──
// Sunny Side World tileset: grass at top-left (0,0)
function drawGrass(ctx, x, y, col, row) {
  sTile(ctx, 0, 0, x, y);
}

// ── WATER ──
function drawWater(ctx, x, y, col, row, frame) {
  // Water tiles in Serene Village - around row 3-4, col 4-6 area
  // Use animated water strip if available
  const waterImg = getImg('water');
  if (waterImg) {
    // water_anim.png is 224x16 = 14 frames of 16x16
    const animFrame = Math.floor(frame / 10) % 14;
    ctx.drawImage(waterImg,
      animFrame * TILE, 0, TILE, TILE,
      x, y, RS, RS
    );
  } else {
    // Fallback: use tileset water
    vTile(ctx, 4, 3, x, y);
  }
}

// ── WATER EDGE ──
function drawWaterEdge(ctx, x, y, col, row, frame) {
  drawGrass(ctx, x, y, col, row);
  // Shore blend toward water
  ctx.fillStyle = 'rgba(60, 140, 200, 0.5)';
  ctx.fillRect(x + RS * 0.4, y, RS * 0.6, RS);
  ctx.fillStyle = 'rgba(60, 140, 200, 0.25)';
  ctx.fillRect(x + RS * 0.2, y, RS * 0.2, RS);
}

// ── PATH / DIRT ──
function drawPath(ctx, x, y, col, row) {
  // Draw a simple dirt path
  ctx.fillStyle = '#c4a96e';
  ctx.fillRect(x, y, RS, RS);
  // Subtle texture
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  const seed = (col * 31 + row * 17) % 5;
  ctx.fillRect(x + seed * 6, y + 4, 8, 4);
  ctx.fillRect(x + 12 + seed * 3, y + RS - 8, 6, 3);
}

// ── TREE ──
// spr_deco_tree_01_strip4.png = 128x34, 4 frames of 32x34 each (round tree)
// spr_deco_tree_02_strip4.png = 112x43, 4 frames of 28x43 each (pine tree)
const TREE_ROUND_FW = 32;  // frame width
const TREE_ROUND_FH = 34;  // frame height
const TREE_PINE_FW = 28;
const TREE_PINE_FH = 43;

function drawTree(ctx, x, y, col, row) {
  // Use the round tree sprite (frame 0)
  const img = getImg('treeRound');
  if (img) {
    // Scale: 2x native size → 64x68 (fills 1 tile width, slightly taller)
    const dw = TREE_ROUND_FW * SCALE / 2;  // 64px = RS
    const dh = TREE_ROUND_FH * SCALE / 2;  // 68px
    ctx.drawImage(img,
      0, 0, TREE_ROUND_FW, TREE_ROUND_FH,  // frame 0
      x, y - (dh - RS), dw, dh  // bottom-aligned to tile
    );
  } else {
    // Fallback: simple green circle
    ctx.fillStyle = '#2d7a2d';
    ctx.beginPath(); ctx.arc(x + RS / 2, y + RS * 0.35, RS * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3018';
    ctx.fillRect(x + RS * 0.4, y + RS * 0.6, RS * 0.2, RS * 0.4);
  }
}

// ── ROCK ──
function drawRock(ctx, x, y, col, row) {
  drawGrass(ctx, x, y, col, row);
  // Draw a small rock on grass
  ctx.fillStyle = '#8a8a7a';
  ctx.beginPath();
  ctx.ellipse(x + RS / 2, y + RS * 0.6, RS * 0.3, RS * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9a9a8a';
  ctx.beginPath();
  ctx.ellipse(x + RS / 2, y + RS * 0.55, RS * 0.25, RS * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── FLOWER ──
function drawFlower(ctx, x, y, col, row) {
  drawGrass(ctx, x, y, col, row);
  // Small pixel flowers on grass
  const colors = ['#e74c3c', '#f1c40f', '#e8e0ff', '#ff69b4'];
  const seed = (col * 7 + row * 11) % 4;
  ctx.fillStyle = colors[seed];
  ctx.fillRect(x + RS * 0.2, y + RS * 0.3, 4, 4);
  ctx.fillRect(x + RS * 0.6, y + RS * 0.5, 4, 4);
  ctx.fillRect(x + RS * 0.4, y + RS * 0.7, 3, 3);
  ctx.fillStyle = '#2d8a2d';
  ctx.fillRect(x + RS * 0.2 + 1, y + RS * 0.3 + 4, 2, 4);
  ctx.fillRect(x + RS * 0.6 + 1, y + RS * 0.5 + 4, 2, 4);
}

// ── BRIDGE ──
// Sunny Side World tileset: wooden bridge planks at left side, around rows 3-4
function drawBridge(ctx, x, y) {
  // Use Sunny Side World bridge plank tile
  const img = getImg('sunnyside');
  if (img) {
    // Bridge plank tiles at row 3, cols 0-3 area in the tileset
    sTile(ctx, 1, 3, x, y);
  } else {
    // Fallback: simple wooden planks
    ctx.fillStyle = '#a0784c';
    ctx.fillRect(x, y, RS, RS);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let py = 4; py < RS; py += 10) {
      ctx.beginPath(); ctx.moveTo(x + 2, y + py); ctx.lineTo(x + RS - 2, y + py); ctx.stroke();
    }
  }
}

// ── HOUSE (using pre-rendered house images) ──
function drawHouse(ctx, house, camX, camY) {
  const dx = house.mapX * RS - camX;
  const dy = house.mapY * RS - camY;

  const houseW = house.w * RS;
  const houseH = house.h * RS;

  // Choose the right house image based on style
  let img;
  if (house.style === 'red') {
    img = getImg('houseR');
  } else if (house.style === 'green') {
    img = getImg('houseG');
  } else {
    // Blue house - use tileset rows 37-42
    img = getImg('houseG'); // fallback
  }

  if (img) {
    // Scale the house image to fit the allocated tile space
    const scale = Math.min(houseW / img.width, houseH / img.height) * 1.1;
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, dx + (houseW - sw) / 2, dy + (houseH - sh), sw, sh);
  } else {
    // Fallback: draw from tileset
    // Red houses start around row 19 in Serene Village tileset
    const tileRow = house.style === 'red' ? 19 : house.style === 'green' ? 25 : 37;
    vTile(ctx, 0, tileRow, dx, dy, 5, 4);
  }

  // House name label
  ctx.font = 'bold 11px monospace';
  const tw = ctx.measureText(house.name).width + 14;
  const lx = dx + (houseW - tw) / 2;
  const ly = dy - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(lx, ly, tw, 18);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(lx, ly, tw, 18);
  ctx.fillStyle = '#c7b777';
  ctx.textAlign = 'center';
  ctx.fillText(house.name, dx + houseW / 2, ly + 13);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// PLAYER SPRITE
// player_char.png (Bea) is 256x256
// Clean 4x4 grid: 4 columns x 4 rows of 64x64 each
// Row 0: Walk DOWN  (4 frames)
// Row 1: Walk LEFT  (4 frames)
// Row 2: Walk RIGHT (4 frames)
// Row 3: Walk UP    (4 frames)
// ════════════════════════════════════════════════════════

const PF = 64; // frame size in spritesheet

const PLAYER_ROW = {
  down:  0,
  left:  1,
  right: 2,
  up:    3,
};

export function renderPlayer(ctx, player, camX, camY, mode, intOffset, frame) {
  const img = getImg('player');
  if (!img) return;

  let sx, sy;
  if (mode === MODE.INTERIOR) {
    sx = intOffset.offsetX + player.interiorX * SCALE;
    sy = intOffset.offsetY + player.interiorY * SCALE;
  } else {
    sx = player.x * SCALE - camX;
    sy = player.y * SCALE - camY;
  }

  const row = PLAYER_ROW[player.direction] ?? 0;
  // Frame 0 = idle, frames 1-3 = walk cycle
  const animFrame = player.moving ? (Math.floor(frame / 8) % 3) + 1 : 0;

  // Draw shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx + RS / 2, sy + RS - 2, RS * 0.3, RS * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw player sprite - slightly taller than one tile for Pokemon feel
  const drawH = RS * 1.25;
  ctx.drawImage(img,
    animFrame * PF, row * PF, PF, PF,
    sx, sy - drawH + RS, RS, drawH
  );
}

// ════════════════════════════════════════════════════════
// VILLAGE RENDER
// ════════════════════════════════════════════════════════

export function renderVillage(ctx, canvas, player, frame) {
  const camX = Math.max(0, Math.min(
    player.x * SCALE - canvas.width / 2,
    MAP_W * RS - canvas.width
  ));
  const camY = Math.max(0, Math.min(
    player.y * SCALE - canvas.height / 2,
    MAP_H * RS - canvas.height
  ));

  // Clear with grass green
  ctx.fillStyle = '#5a9e3e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Visible range
  const sc = Math.max(0, Math.floor(camX / RS) - 1);
  const sr = Math.max(0, Math.floor(camY / RS) - 1);
  const ec = Math.min(MAP_W, Math.ceil((camX + canvas.width) / RS) + 1);
  const er = Math.min(MAP_H, Math.ceil((camY + canvas.height) / RS) + 1);

  // Pass 1: Ground tiles (everything except trees)
  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const tile = villageMap[row]?.[col];
      const x = col * RS - camX;
      const y = row * RS - camY;
      if (tile === undefined) continue;

      switch (tile) {
        case _:  case G2: drawGrass(ctx, x, y, col, row); break;
        case W:            drawWater(ctx, x, y, col, row, frame); break;
        case WE:           drawWaterEdge(ctx, x, y, col, row, frame); break;
        case P:            drawPath(ctx, x, y, col, row); break;
        case T:            drawGrass(ctx, x, y, col, row); break; // grass under trees
        case FL:           drawFlower(ctx, x, y, col, row); break;
        case B:            drawBridge(ctx, x, y); break;
        case R:            drawRock(ctx, x, y, col, row); break;
        case H:            drawGrass(ctx, x, y, col, row); break;
        default:           drawGrass(ctx, x, y, col, row);
      }
    }
  }

  // Pass 2: Trees (drawn on top so they overlap neighbors properly)
  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      if (villageMap[row]?.[col] === T) {
        drawTree(ctx, col * RS - camX, row * RS - camY, col, row);
      }
    }
  }

  // Houses
  for (const h of houses) {
    drawHouse(ctx, h, camX, camY);
  }

  // Enter prompts
  for (const h of houses) {
    const dx = Math.abs(player.x / TILE - h.doorX);
    const dy = Math.abs(player.y / TILE - h.doorY);
    if (dx < 1.5 && dy < 1.5) {
      const px = h.doorX * RS - camX + RS / 2;
      const py = h.doorY * RS - camY - 30;
      drawPrompt(ctx, px, py, '⏎ ESPACE — Entrer');
    }
  }

  return { cameraX: camX, cameraY: camY };
}

// ════════════════════════════════════════════════════════
// INTERIOR RENDER
// Uses IndoorTileset.png (960x496) for furniture and floors
// ════════════════════════════════════════════════════════

// Draw from indoor tileset
function iTile(ctx, sx, sy, dx, dy, tw = 1, th = 1) {
  const img = getImg('indoor');
  if (!img) return;
  ctx.drawImage(img,
    sx * TILE, sy * TILE, TILE * tw, TILE * th,
    dx, dy, RS * tw, RS * th
  );
}

function drawWallTile(ctx, x, y, row, col, house) {
  const colors = {
    red:   { base: '#8a4040', light: '#a05050' },
    green: { base: '#3a6a3a', light: '#4a8a4a' },
    blue:  { base: '#3a5a8a', light: '#4a6fa5' },
  };
  const c = colors[house?.style] || colors.red;

  ctx.fillStyle = row === 0 ? c.base : c.light;
  ctx.fillRect(x, y, RS, RS);

  // Stone pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  const off = row % 2 === 0 ? 0 : RS / 2;
  for (let by = 0; by < RS; by += 14) {
    for (let bx = -RS / 2; bx < RS; bx += RS / 2) {
      ctx.strokeRect(x + bx + off + 1, y + by + 1, RS / 2 - 3, 12);
    }
  }
}

function drawWoodFloor(ctx, x, y, col, row) {
  // Try using indoor tileset floor tiles
  // Floor tiles in IndoorTileset.png - top-left area around (0,0)
  // The tileset shows: floors at very top-left, various wood patterns
  ctx.fillStyle = (col + row) % 2 === 0 ? '#c9a96e' : '#bfa060';
  ctx.fillRect(x, y, RS, RS);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + RS / 3); ctx.lineTo(x + RS, y + RS / 3);
  ctx.moveTo(x, y + RS * 2 / 3); ctx.lineTo(x + RS, y + RS * 2 / 3);
  ctx.stroke();
}

function drawInteriorTable(ctx, x, y) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 3, y + 6, RS - 6, RS * 0.45);
  ctx.fillStyle = '#9e6e4c';
  ctx.fillRect(x + 5, y + 8, RS - 10, RS * 0.35);
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 6, y + RS * 0.5, 4, RS * 0.45);
  ctx.fillRect(x + RS - 10, y + RS * 0.5, 4, RS * 0.45);
}

function drawInteriorChair(ctx, x, y) {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x + 10, y + 2, RS - 20, 10);
  ctx.fillStyle = '#8a6240';
  ctx.fillRect(x + 8, y + 12, RS - 16, 14);
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(x + 10, y + 26, 3, RS - 28);
  ctx.fillRect(x + RS - 13, y + 26, 3, RS - 28);
}

function drawInteriorBed(ctx, x, y, col) {
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + 4, RS - 4, RS - 6);
  ctx.fillStyle = '#f0ead0';
  ctx.fillRect(x + 4, y + 6, RS - 8, RS - 10);
  if (col <= 6) {
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(x + 6, y + 8, 16, 12);
  }
  ctx.fillStyle = '#4a7fbf';
  ctx.fillRect(x + 4, y + RS * 0.45, RS - 8, RS * 0.45);
}

function drawInteriorBookshelf(ctx, x, y) {
  ctx.fillStyle = '#5a3018';
  ctx.fillRect(x + 2, y + 2, RS - 4, RS - 4);
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + RS / 2, RS - 4, 3);
  const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22'];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[(i + r * 2) % 5];
      const bh = 10 + (i % 3) * 2;
      ctx.fillRect(x + 5 + i * 7, r === 0 ? y + RS / 2 - bh : y + RS - 6 - bh, 5, bh);
    }
  }
}

function drawInteriorChest(ctx, x, y) {
  ctx.fillStyle = '#7a4e28';
  ctx.fillRect(x + 6, y + 12, RS - 12, RS - 16);
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 5, y + 10, RS - 10, 10);
  ctx.fillStyle = '#888';
  ctx.fillRect(x + 6, y + 16, RS - 12, 2);
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath(); ctx.arc(x + RS / 2, y + 18, 3, 0, Math.PI * 2); ctx.fill();
}

function drawInteriorDoor(ctx, x, y) {
  drawWoodFloor(ctx, x, y, 4, 7);
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x + 6, y + 6, RS - 12, RS - 12);
  ctx.fillStyle = 'rgba(199,183,119,0.5)';
  ctx.beginPath();
  ctx.moveTo(x + RS / 2, y + RS - 10);
  ctx.lineTo(x + RS / 2 - 6, y + RS - 18);
  ctx.lineTo(x + RS / 2 + 6, y + RS - 18);
  ctx.closePath();
  ctx.fill();
}

function drawInteriorRug(ctx, x, y, house) {
  const colors = { red: '#a05050', green: '#4a9a5a', blue: '#4a7fbf' };
  ctx.fillStyle = colors[house?.style] || '#8B4513';
  ctx.fillRect(x + 2, y + 2, RS - 4, RS - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 8, y + 8, RS - 16, RS - 16);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 4, y + 4, RS - 8, RS - 8);
}

function drawInteriorFireplace(ctx, x, y, frame) {
  ctx.fillStyle = '#555';
  ctx.fillRect(x + 2, y + 2, RS - 4, RS - 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 8, y + 10, RS - 16, RS - 14);
  const t = frame * 0.12;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.arc(x + RS / 2, y + RS / 2 + Math.sin(t) * 3, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f39c12';
  ctx.beginPath(); ctx.arc(x + RS / 2, y + RS / 2 - 2 + Math.sin(t) * 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath(); ctx.arc(x + RS / 2, y + RS / 2 - 4 + Math.sin(t) * 2, 2.5, 0, Math.PI * 2); ctx.fill();
}

function drawInteriorBarrel(ctx, x, y) {
  ctx.fillStyle = '#7a4e28';
  ctx.fillRect(x + 8, y + 4, RS - 16, RS - 8);
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 6, y + RS * 0.3, RS - 12, RS * 0.4);
  ctx.fillStyle = '#888';
  ctx.fillRect(x + 7, y + 10, RS - 14, 2);
  ctx.fillRect(x + 7, y + RS - 12, RS - 14, 2);
}

function drawInteriorPlant(ctx, x, y) {
  ctx.fillStyle = '#8a6a4a';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 14); ctx.lineTo(x + RS - 14, y + 14);
  ctx.lineTo(x + RS - 10, y + RS - 8); ctx.lineTo(x + 10, y + RS - 8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d9e3d';
  ctx.fillRect(x + RS / 2 - 1, y + 6, 2, 10);
  ctx.beginPath(); ctx.arc(x + RS / 2 - 4, y + 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + RS / 2 + 3, y + 8, 3, 0, Math.PI * 2); ctx.fill();
}

export function renderInterior(ctx, canvas, player, house, frame) {
  const oX = (canvas.width - INT_W * RS) / 2;
  const oY = (canvas.height - INT_H * RS) / 2;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < INT_H; row++) {
    for (let col = 0; col < INT_W; col++) {
      const tile = interiorMap[row][col];
      const x = oX + col * RS;
      const y = oY + row * RS;

      switch (tile) {
        case IW: drawWallTile(ctx, x, y, row, col, house); break;
        case IF: drawWoodFloor(ctx, x, y, col, row); break;
        case IT: drawWoodFloor(ctx, x, y, col, row); drawInteriorTable(ctx, x, y); break;
        case IC: drawWoodFloor(ctx, x, y, col, row); drawInteriorChair(ctx, x, y); break;
        case IB: drawWoodFloor(ctx, x, y, col, row); drawInteriorBed(ctx, x, y, col); break;
        case IK: drawWoodFloor(ctx, x, y, col, row); drawInteriorBookshelf(ctx, x, y); break;
        case IX: drawWoodFloor(ctx, x, y, col, row); drawInteriorChest(ctx, x, y); break;
        case ID: drawInteriorDoor(ctx, x, y); break;
        case IR: drawWoodFloor(ctx, x, y, col, row); drawInteriorRug(ctx, x, y, house); break;
        case IP: drawWoodFloor(ctx, x, y, col, row); drawInteriorFireplace(ctx, x, y, frame); break;
        case IL: drawWoodFloor(ctx, x, y, col, row); drawInteriorBarrel(ctx, x, y); break;
        case IQ: drawWoodFloor(ctx, x, y, col, row); drawInteriorPlant(ctx, x, y); break;
        default: drawWoodFloor(ctx, x, y, col, row);
      }
    }
  }

  // Header
  const name = house?.name || 'Intérieur';
  ctx.font = 'bold 14px monospace';
  const tw = ctx.measureText(name).width + 28;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(canvas.width / 2 - tw / 2, 14, tw, 26);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width / 2 - tw / 2, 14, tw, 26);
  ctx.fillStyle = '#c7b777'; ctx.textAlign = 'center';
  ctx.fillText(name, canvas.width / 2, 33);
  ctx.textAlign = 'left';

  // Exit prompt
  const pRow = Math.floor((player.interiorY + TILE / 2) / TILE);
  if (pRow >= INT_H - 2) {
    drawPrompt(ctx, canvas.width / 2, oY + INT_H * RS + 14, '⏎ ESPACE — Sortir');
  }

  return { offsetX: oX, offsetY: oY };
}

// ── UI HELPERS ──
function drawPrompt(ctx, cx, cy, text) {
  ctx.font = 'bold 12px monospace';
  const tw = ctx.measureText(text).width + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(cx - tw / 2, cy - 3, tw, 22);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2, cy - 3, tw, 22);
  ctx.fillStyle = '#c7b777'; ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 12);
  ctx.textAlign = 'left';
}
