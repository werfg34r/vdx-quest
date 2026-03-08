import { TILE_SIZE, SCALE, RENDER_SIZE, MAP_COLS, MAP_ROWS, GAME_STATE } from './constants.js';
import {
  villageMap, houses, interiorMap, INTERIOR_COLS, INTERIOR_ROWS,
  G, W, P, T, H1, H2, H3, F, FL, B,
  FL_WOOD, WALL, TBL, CHR, BED, BKSH, CHST, DR, RG, FP, BRL, PT,
} from './maps.js';

// No tileset dependency - everything is drawn procedurally
export function loadTileset() {
  return Promise.resolve();
}

const S = RENDER_SIZE; // shorthand

// ── GRASS ──────────────────────────────────────────────
function drawGrass(ctx, x, y, col, row) {
  const v = (col * 7 + row * 13) % 6;
  const greens = ['#5a9e3e', '#4e9235', '#569a3a', '#4d8e34', '#5ba040', '#528f37'];
  ctx.fillStyle = greens[v];
  ctx.fillRect(x, y, S, S);

  // Grass blade details
  ctx.fillStyle = 'rgba(80, 170, 60, 0.4)';
  const seed = col * 31 + row * 17;
  ctx.fillRect(x + (seed % 20) + 4, y + (seed % 15) + 6, 2, 6);
  ctx.fillRect(x + ((seed * 3) % 25) + 8, y + ((seed * 2) % 18) + 4, 2, 5);

  // Occasional dark patch
  if (v === 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(x + 8, y + 10, 16, 12);
  }
}

// ── WATER ──────────────────────────────────────────────
function drawWater(ctx, x, y, col, row, frame) {
  // Base water
  ctx.fillStyle = '#2e86de';
  ctx.fillRect(x, y, S, S);

  // Depth variation
  const depth = (col + row) % 3;
  if (depth === 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x, y, S, S);
  }

  // Animated waves
  const t = frame * 0.04;
  ctx.fillStyle = 'rgba(130, 200, 255, 0.35)';
  for (let i = 0; i < 3; i++) {
    const wx = x + Math.sin(t + col + i * 2) * 6 + i * 14;
    const wy = y + Math.cos(t + row + i * 1.5) * 4 + 8 + i * 12;
    ctx.fillRect(wx, wy, 10, 2);
  }

  // Sparkle
  if ((col + row + Math.floor(frame / 30)) % 7 === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x + 18, y + 10, 3, 3);
  }
}

// ── WATER EDGE (transition grass->water) ──────────────
function drawWaterEdge(ctx, x, y, col, row, frame) {
  drawWater(ctx, x, y, col, row, frame);
  // Shoreline foam
  ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
  const foamW = 6 + Math.sin(frame * 0.05 + col) * 2;
  ctx.fillRect(x, y, foamW, S);
}

// ── PATH ──────────────────────────────────────────────
function drawPath(ctx, x, y, col, row) {
  ctx.fillStyle = '#c9a96e';
  ctx.fillRect(x, y, S, S);

  // Gravel texture
  ctx.fillStyle = 'rgba(160, 130, 80, 0.3)';
  const seed = col * 11 + row * 23;
  ctx.fillRect(x + (seed % 18) + 4, y + (seed % 14) + 6, 6, 4);
  ctx.fillRect(x + ((seed * 3) % 20) + 10, y + ((seed * 2) % 16) + 16, 5, 3);
  ctx.fillRect(x + ((seed * 7) % 22) + 2, y + ((seed * 5) % 20) + 22, 4, 4);

  // Edge darkening
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(x, y, S, 2);
  ctx.fillRect(x, y, 2, S);
}

// ── TREE ──────────────────────────────────────────────
function drawTree(ctx, x, y, col, row) {
  drawGrass(ctx, x, y, col, row);

  const cx = x + S / 2;
  const variant = (col * 3 + row * 7) % 3;

  // Shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 4, y + S - 4, S * 0.38, S * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(cx - 4, y + S * 0.4, 8, S * 0.55);
  ctx.fillStyle = '#5a3520';
  ctx.fillRect(cx - 3, y + S * 0.45, 2, S * 0.4);

  // Canopy layers (bottom to top for depth)
  const canopyR = S * 0.38 + variant * 2;
  const canopyY = y + S * 0.3 - variant * 2;

  // Dark base
  ctx.fillStyle = '#2d7a2d';
  ctx.beginPath();
  ctx.arc(cx, canopyY + 4, canopyR, 0, Math.PI * 2);
  ctx.fill();

  // Main foliage
  ctx.fillStyle = '#3d9e3d';
  ctx.beginPath();
  ctx.arc(cx, canopyY, canopyR - 2, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#5abb5a';
  ctx.beginPath();
  ctx.arc(cx - 4, canopyY - 4, canopyR * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Light dots
  ctx.fillStyle = 'rgba(120, 220, 100, 0.5)';
  ctx.fillRect(cx - 8, canopyY - 6, 3, 3);
  ctx.fillRect(cx + 4, canopyY - 2, 2, 2);
}

// ── FLOWER ────────────────────────────────────────────
function drawFlower(ctx, x, y, col, row) {
  drawGrass(ctx, x, y, col, row);

  const variant = (col * 3 + row * 5) % 4;
  const colors = ['#ff6b6b', '#ffd93d', '#ff9ff3', '#74b9ff'];
  const color = colors[variant];

  for (let i = 0; i < 3; i++) {
    const fx = x + 8 + i * 13;
    const fy = y + 14 + (i * 7) % 16;

    // Stem
    ctx.fillStyle = '#3d8a3d';
    ctx.fillRect(fx + 1, fy + 4, 2, 10);

    // Petals
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fx + 2, fy + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Center
    ctx.fillStyle = '#f9ca24';
    ctx.beginPath();
    ctx.arc(fx + 2, fy + 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── BRIDGE ────────────────────────────────────────────
function drawBridge(ctx, x, y) {
  // Planks
  ctx.fillStyle = '#a0845c';
  ctx.fillRect(x, y, S, S);

  // Individual plank lines
  ctx.strokeStyle = '#8a6e40';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const py = y + 2 + i * (S / 5);
    ctx.beginPath();
    ctx.moveTo(x + 4, py);
    ctx.lineTo(x + S - 4, py);
    ctx.stroke();
  }

  // Side rails
  ctx.fillStyle = '#6b4c1e';
  ctx.fillRect(x, y, 5, S);
  ctx.fillRect(x + S - 5, y, 5, S);

  // Rail posts
  ctx.fillStyle = '#7a5c2e';
  ctx.fillRect(x, y + 2, 5, 8);
  ctx.fillRect(x, y + S - 10, 5, 8);
  ctx.fillRect(x + S - 5, y + 2, 5, 8);
  ctx.fillRect(x + S - 5, y + S - 10, 5, 8);

  // Nail detail
  ctx.fillStyle = '#555';
  ctx.fillRect(x + 2, y + 5, 2, 2);
  ctx.fillRect(x + S - 4, y + 5, 2, 2);
}

// ── HOUSE (fully procedural) ──────────────────────────
function drawHouse(ctx, house, cameraX, cameraY) {
  const destX = house.mapX * S - cameraX;
  const destY = house.mapY * S - cameraY;
  const w = house.width * S;
  const h = house.height * S;

  const roofColors = {
    blue:   { main: '#4a7fbf', light: '#6a9fd8', dark: '#3a6a9a' },
    green:  { main: '#4a9a5a', light: '#6abb70', dark: '#3a7a4a' },
    orange: { main: '#d4882a', light: '#e8a44a', dark: '#b07020' },
  };
  const wallColors = {
    blue:   { main: '#e8dcc0', dark: '#d4c8a0' },
    green:  { main: '#e8dcc0', dark: '#d4c8a0' },
    orange: { main: '#f0e0c0', dark: '#dcc8a0' },
  };

  const rc = roofColors[house.color] || roofColors.blue;
  const wc = wallColors[house.color] || wallColors.blue;

  // ─ Shadow ─
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(destX + 6, destY + h * 0.35 + 6, w, h * 0.65);

  // ─ Walls ─
  ctx.fillStyle = wc.main;
  ctx.fillRect(destX + 8, destY + h * 0.35, w - 16, h * 0.65);

  // Wall texture (horizontal lines)
  ctx.strokeStyle = wc.dark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ly = destY + h * 0.4 + i * (h * 0.12);
    ctx.beginPath();
    ctx.moveTo(destX + 10, ly);
    ctx.lineTo(destX + w - 10, ly);
    ctx.stroke();
  }

  // ─ Door ─
  const doorW = S * 0.7;
  const doorH = h * 0.35;
  const doorX = destX + w / 2 - doorW / 2;
  const doorY = destY + h - doorH;

  ctx.fillStyle = '#6b4226';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = '#5a3520';
  ctx.fillRect(doorX + 2, doorY + 2, doorW - 4, doorH - 2);

  // Door handle
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(doorX + doorW - 8, doorY + doorH / 2, 3, 3);

  // ─ Windows ─
  const winSize = S * 0.5;
  // Left window
  drawWindow(ctx, destX + 16, destY + h * 0.42, winSize, winSize);
  // Right window
  drawWindow(ctx, destX + w - 16 - winSize, destY + h * 0.42, winSize, winSize);

  // ─ Roof (triangle) ─
  ctx.fillStyle = rc.main;
  ctx.beginPath();
  ctx.moveTo(destX - 8, destY + h * 0.38);
  ctx.lineTo(destX + w / 2, destY - 6);
  ctx.lineTo(destX + w + 8, destY + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Roof highlight (left side lighter)
  ctx.fillStyle = rc.light;
  ctx.beginPath();
  ctx.moveTo(destX - 8, destY + h * 0.38);
  ctx.lineTo(destX + w / 2, destY - 6);
  ctx.lineTo(destX + w / 2, destY + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Roof edge line
  ctx.strokeStyle = rc.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(destX - 8, destY + h * 0.38);
  ctx.lineTo(destX + w / 2, destY - 6);
  ctx.lineTo(destX + w + 8, destY + h * 0.38);
  ctx.stroke();

  // Roof tiles pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const ry = destY + h * 0.08 + i * (h * 0.08);
    const inset = (h * 0.38 - (ry - destY)) * (w / (h * 0.44));
    ctx.beginPath();
    ctx.moveTo(destX + w / 2 - inset / 2 - 8, ry);
    ctx.lineTo(destX + w / 2 + inset / 2 + 8, ry);
    ctx.stroke();
  }

  // ─ Chimney ─
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(destX + w * 0.7, destY - 2, 14, h * 0.2);
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(destX + w * 0.7 - 2, destY - 2, 18, 4);

  // ─ House name label ─
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  const label = house.name;
  ctx.font = 'bold 12px monospace';
  const labelW = ctx.measureText(label).width + 16;
  const labelX = destX + (w - labelW) / 2;
  const labelY = destY - 22;
  ctx.fillRect(labelX, labelY, labelW, 20);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX, labelY, labelW, 20);
  ctx.fillStyle = '#c7b777';
  ctx.textAlign = 'center';
  ctx.fillText(label, destX + w / 2, labelY + 14);
  ctx.textAlign = 'left';
}

function drawWindow(ctx, x, y, w, h) {
  // Frame
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x, y, w, h);
  // Glass
  ctx.fillStyle = '#a0d4f0';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  // Cross divider
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x + w / 2 - 1, y, 2, h);
  ctx.fillRect(x, y + h / 2 - 1, w, 2);
  // Light reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x + 3, y + 3, w / 2 - 4, h / 2 - 4);
}

// ── VILLAGE RENDER ────────────────────────────────────
export function renderVillage(ctx, canvas, player, frame) {
  const cameraX = Math.max(0, Math.min(
    player.x * SCALE - canvas.width / 2,
    MAP_COLS * RENDER_SIZE - canvas.width
  ));
  const cameraY = Math.max(0, Math.min(
    player.y * SCALE - canvas.height / 2,
    MAP_ROWS * RENDER_SIZE - canvas.height
  ));

  // Clear with grass color (no more dark background)
  ctx.fillStyle = '#4e9235';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Visible tile range
  const startCol = Math.max(0, Math.floor(cameraX / S));
  const startRow = Math.max(0, Math.floor(cameraY / S));
  const endCol = Math.min(MAP_COLS, Math.ceil((cameraX + canvas.width) / S) + 1);
  const endRow = Math.min(MAP_ROWS, Math.ceil((cameraY + canvas.height) / S) + 1);

  // Ground layer
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = villageMap[row]?.[col];
      const x = col * S - cameraX;
      const y = row * S - cameraY;
      if (tile === undefined) continue;

      switch (tile) {
        case G:   drawGrass(ctx, x, y, col, row); break;
        case W:   drawWater(ctx, x, y, col, row, frame); break;
        case P:   drawPath(ctx, x, y, col, row); break;
        case T:   drawTree(ctx, x, y, col, row); break;
        case FL:  drawFlower(ctx, x, y, col, row); break;
        case B:   drawBridge(ctx, x, y); break;
        case H1: case H2: case H3:
          drawGrass(ctx, x, y, col, row);
          break;
        default:
          drawGrass(ctx, x, y, col, row);
      }
    }
  }

  // Houses (on top of ground)
  for (const house of houses) {
    drawHouse(ctx, house, cameraX, cameraY);
  }

  // Enter prompts
  for (const house of houses) {
    const dx = Math.abs(player.x / TILE_SIZE - house.doorX);
    const dy = Math.abs(player.y / TILE_SIZE - house.doorY);
    if (dx < 1.5 && dy < 1.5) {
      const px = house.doorX * S - cameraX;
      const py = house.doorY * S - cameraY - 44;
      drawPrompt(ctx, px + S / 2, py, '⏎ ESPACE — Entrer');
    }
  }

  return { cameraX, cameraY };
}

// ── INTERIOR RENDER ───────────────────────────────────
export function renderInterior(ctx, canvas, player, currentHouse, frame) {
  const offsetX = (canvas.width - INTERIOR_COLS * S) / 2;
  const offsetY = (canvas.height - INTERIOR_ROWS * S) / 2;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < INTERIOR_ROWS; row++) {
    for (let col = 0; col < INTERIOR_COLS; col++) {
      const tile = interiorMap[row][col];
      const x = offsetX + col * S;
      const y = offsetY + row * S;

      switch (tile) {
        case WALL: drawWallTile(ctx, x, y, row, col, currentHouse); break;
        case FL_WOOD: drawWoodFloor(ctx, x, y, col, row); break;
        case TBL:
          drawWoodFloor(ctx, x, y, col, row);
          drawTable(ctx, x, y);
          break;
        case CHR:
          drawWoodFloor(ctx, x, y, col, row);
          drawChair(ctx, x, y);
          break;
        case BED:
          drawWoodFloor(ctx, x, y, col, row);
          drawBed(ctx, x, y, col);
          break;
        case BKSH:
          drawWoodFloor(ctx, x, y, col, row);
          drawBookshelf(ctx, x, y);
          break;
        case CHST:
          drawWoodFloor(ctx, x, y, col, row);
          drawChest(ctx, x, y);
          break;
        case DR: drawDoorTile(ctx, x, y); break;
        case RG:
          drawWoodFloor(ctx, x, y, col, row);
          drawRug(ctx, x, y, currentHouse);
          break;
        case FP:
          drawWoodFloor(ctx, x, y, col, row);
          drawFireplace(ctx, x, y, frame);
          break;
        case BRL:
          drawWoodFloor(ctx, x, y, col, row);
          drawBarrel(ctx, x, y);
          break;
        case PT:
          drawWoodFloor(ctx, x, y, col, row);
          drawPot(ctx, x, y);
          break;
        default: drawWoodFloor(ctx, x, y, col, row);
      }
    }
  }

  // House name header
  const name = currentHouse?.name || 'Intérieur';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.font = 'bold 16px monospace';
  const tw = ctx.measureText(name).width + 32;
  ctx.fillRect(canvas.width / 2 - tw / 2, 12, tw, 30);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width / 2 - tw / 2, 12, tw, 30);
  ctx.fillStyle = '#c7b777';
  ctx.textAlign = 'center';
  ctx.fillText(name, canvas.width / 2, 33);
  ctx.textAlign = 'left';

  // Exit prompt
  const playerRow = Math.floor((player.interiorY + TILE_SIZE / 2) / TILE_SIZE);
  if (playerRow >= INTERIOR_ROWS - 2) {
    drawPrompt(ctx, canvas.width / 2, offsetY + INTERIOR_ROWS * S + 16, '⏎ ESPACE — Sortir');
  }

  return { offsetX, offsetY };
}

// ── INTERIOR FURNITURE ────────────────────────────────
function drawWallTile(ctx, x, y, row, col, house) {
  const colors = {
    blue:   { base: '#3a5a8a', light: '#4a6fa5' },
    green:  { base: '#3a6a3a', light: '#4a8a4a' },
    orange: { base: '#8a6030', light: '#a07840' },
  };
  const c = colors[house?.color] || colors.blue;

  ctx.fillStyle = row === 0 ? c.base : c.light;
  ctx.fillRect(x, y, S, S);

  // Brick/stone pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  const offset = row % 2 === 0 ? 0 : S / 2;
  for (let by = 0; by < S; by += 14) {
    for (let bx = -S / 2; bx < S; bx += S / 2) {
      ctx.strokeRect(x + bx + offset, y + by, S / 2 - 2, 12);
    }
  }
}

function drawWoodFloor(ctx, x, y, col, row) {
  ctx.fillStyle = (col + row) % 2 === 0 ? '#c9a96e' : '#bfa060';
  ctx.fillRect(x, y, S, S);

  // Plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + S / 3);
  ctx.lineTo(x + S, y + S / 3);
  ctx.moveTo(x, y + S * 2 / 3);
  ctx.lineTo(x + S, y + S * 2 / 3);
  ctx.stroke();

  // Wood grain
  ctx.fillStyle = 'rgba(160, 130, 80, 0.15)';
  ctx.fillRect(x + 8, y + 4, 2, S - 8);
  ctx.fillRect(x + 28, y + 6, 2, S - 12);
}

function drawTable(ctx, x, y) {
  // Table top
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 3, y + 6, S - 6, S * 0.45);
  // Top surface highlight
  ctx.fillStyle = '#9e6e4c';
  ctx.fillRect(x + 5, y + 8, S - 10, S * 0.35);
  // Legs
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 6, y + S * 0.5, 4, S * 0.45);
  ctx.fillRect(x + S - 10, y + S * 0.5, 4, S * 0.45);
}

function drawChair(ctx, x, y) {
  // Back
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x + 10, y + 2, S - 20, 10);
  // Seat
  ctx.fillStyle = '#8a6240';
  ctx.fillRect(x + 8, y + 12, S - 16, 14);
  // Legs
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(x + 10, y + 26, 3, S - 28);
  ctx.fillRect(x + S - 13, y + 26, 3, S - 28);
}

function drawBed(ctx, x, y, col) {
  // Frame
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + 4, S - 4, S - 6);
  // Mattress
  ctx.fillStyle = '#f0ead0';
  ctx.fillRect(x + 4, y + 6, S - 8, S - 10);
  // Pillow (head side)
  if (col === 6) {
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(x + 6, y + 8, 16, 12);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.strokeRect(x + 6, y + 8, 16, 12);
  }
  // Blanket
  ctx.fillStyle = '#4a7fbf';
  ctx.fillRect(x + 4, y + S * 0.45, S - 8, S * 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x + 4, y + S * 0.45, S - 8, 4);
}

function drawBookshelf(ctx, x, y) {
  // Shelf frame
  ctx.fillStyle = '#5a3018';
  ctx.fillRect(x + 2, y + 2, S - 4, S - 4);
  // Shelves
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + S / 2, S - 4, 3);
  // Books
  const bookColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22'];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = bookColors[(i + row * 2) % 5];
      const bh = 10 + (i % 3) * 2;
      const bx = x + 5 + i * 7;
      const by = row === 0 ? y + S / 2 - bh : y + S - 6 - bh;
      ctx.fillRect(bx, by, 5, bh);
    }
  }
}

function drawChest(ctx, x, y) {
  // Body
  ctx.fillStyle = '#7a4e28';
  ctx.fillRect(x + 6, y + 12, S - 12, S - 16);
  // Lid
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 5, y + 10, S - 10, 10);
  // Metal bands
  ctx.fillStyle = '#888';
  ctx.fillRect(x + 6, y + 16, S - 12, 2);
  ctx.fillRect(x + 6, y + S - 8, S - 12, 2);
  // Lock
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(x + S / 2, y + 18, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawDoorTile(ctx, x, y) {
  drawWoodFloor(ctx, x, y, 4, 7);
  // Welcome mat
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x + 6, y + 6, S - 12, S - 12);
  ctx.fillStyle = '#a07a50';
  ctx.fillRect(x + 10, y + 10, S - 20, S - 20);
  // Arrow hint
  ctx.fillStyle = 'rgba(199, 183, 119, 0.6)';
  ctx.beginPath();
  ctx.moveTo(x + S / 2, y + S - 10);
  ctx.lineTo(x + S / 2 - 6, y + S - 18);
  ctx.lineTo(x + S / 2 + 6, y + S - 18);
  ctx.closePath();
  ctx.fill();
}

function drawRug(ctx, x, y, house) {
  const colors = {
    blue: '#4a7fbf',
    green: '#4a9a5a',
    orange: '#d4882a',
  };
  const c = colors[house?.color] || '#8B4513';

  ctx.fillStyle = c;
  ctx.fillRect(x + 2, y + 2, S - 4, S - 4);
  // Inner pattern
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 8, y + 8, S - 16, S - 16);
  // Border
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 4, y + 4, S - 8, S - 8);
  // Diamond pattern center
  ctx.fillStyle = 'rgba(199, 183, 119, 0.4)';
  ctx.beginPath();
  ctx.moveTo(x + S / 2, y + 10);
  ctx.lineTo(x + S - 10, y + S / 2);
  ctx.lineTo(x + S / 2, y + S - 10);
  ctx.lineTo(x + 10, y + S / 2);
  ctx.closePath();
  ctx.fill();
}

function drawFireplace(ctx, x, y, frame) {
  // Stone surround
  ctx.fillStyle = '#666';
  ctx.fillRect(x + 2, y + 2, S - 4, S - 4);
  ctx.fillStyle = '#555';
  ctx.fillRect(x + 6, y + 8, S - 12, S - 12);
  // Fire opening
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 8, y + 12, S - 16, S - 16);

  // Animated fire
  const t = frame * 0.12;
  const flames = [
    { cx: S / 2 - 4, r: 6, color: '#e74c3c' },
    { cx: S / 2 + 2, r: 7, color: '#e74c3c' },
    { cx: S / 2, r: 5, color: '#f39c12' },
    { cx: S / 2 - 1, r: 3, color: '#f1c40f' },
  ];
  for (const f of flames) {
    const flicker = Math.sin(t + f.cx * 0.5) * 3;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(x + f.cx, y + S / 2 + flicker, f.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glow
  const glow = ctx.createRadialGradient(x + S / 2, y + S / 2, 0, x + S / 2, y + S / 2, S * 0.6);
  glow.addColorStop(0, 'rgba(255, 160, 50, 0.15)');
  glow.addColorStop(1, 'rgba(255, 160, 50, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - S * 0.3, y - S * 0.3, S * 1.6, S * 1.6);
}

function drawBarrel(ctx, x, y) {
  // Body
  ctx.fillStyle = '#7a4e28';
  ctx.fillRect(x + 8, y + 4, S - 16, S - 8);
  // Wider middle
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 6, y + S * 0.3, S - 12, S * 0.4);
  // Metal bands
  ctx.fillStyle = '#888';
  ctx.fillRect(x + 7, y + 10, S - 14, 2);
  ctx.fillRect(x + 7, y + S - 12, S - 14, 2);
  // Top
  ctx.fillStyle = '#6a3e18';
  ctx.beginPath();
  ctx.ellipse(x + S / 2, y + 6, S / 2 - 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPot(ctx, x, y) {
  // Body
  ctx.fillStyle = '#8a6a4a';
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 10);
  ctx.lineTo(x + S - 12, y + 10);
  ctx.lineTo(x + S - 8, y + S - 8);
  ctx.lineTo(x + 8, y + S - 8);
  ctx.closePath();
  ctx.fill();
  // Rim
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(x + 10, y + 8, S - 20, 4);
  // Soil inside
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x + 12, y + 12, S - 24, 4);
  // Little plant
  ctx.fillStyle = '#3d9e3d';
  ctx.fillRect(x + S / 2 - 1, y + 4, 2, 8);
  ctx.fillRect(x + S / 2 - 4, y + 2, 3, 3);
  ctx.fillRect(x + S / 2 + 1, y + 4, 3, 3);
}

// ── UI HELPERS ────────────────────────────────────────
function drawPrompt(ctx, cx, cy, text) {
  ctx.font = 'bold 13px monospace';
  const tw = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(cx - tw / 2, cy - 4, tw, 24);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2, cy - 4, tw, 24);
  ctx.fillStyle = '#c7b777';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 12);
  ctx.textAlign = 'left';
}

// ── PLAYER ────────────────────────────────────────────
export function renderPlayer(ctx, player, cameraX, cameraY, gameState, interiorOffset) {
  let sx, sy;

  if (gameState === GAME_STATE.INTERIOR) {
    sx = interiorOffset.offsetX + (player.interiorX * SCALE);
    sy = interiorOffset.offsetY + (player.interiorY * SCALE);
  } else {
    sx = player.x * SCALE - cameraX;
    sy = player.y * SCALE - cameraY;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(sx + S / 2, sy + S - 2, S * 0.28, S * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#34495e';
  if (player.moving) {
    const leg = Math.sin(Date.now() * 0.012) * 4;
    ctx.fillRect(sx + S * 0.32, sy + S * 0.72, S * 0.14, S * 0.22 + leg);
    ctx.fillRect(sx + S * 0.54, sy + S * 0.72, S * 0.14, S * 0.22 - leg);
  } else {
    ctx.fillRect(sx + S * 0.32, sy + S * 0.72, S * 0.14, S * 0.22);
    ctx.fillRect(sx + S * 0.54, sy + S * 0.72, S * 0.14, S * 0.22);
  }

  // Shoes
  ctx.fillStyle = '#5a3520';
  ctx.fillRect(sx + S * 0.30, sy + S * 0.92, S * 0.18, S * 0.06);
  ctx.fillRect(sx + S * 0.52, sy + S * 0.92, S * 0.18, S * 0.06);

  // Body
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(sx + S * 0.25, sy + S * 0.38, S * 0.5, S * 0.38);

  // VDX gold belt
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(sx + S * 0.25, sy + S * 0.68, S * 0.5, 4);

  // Gold collar/cape accent
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(sx + S * 0.22, sy + S * 0.38, S * 0.56, 3);

  // Arms
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(sx + S * 0.18, sy + S * 0.42, S * 0.1, S * 0.28);
  ctx.fillRect(sx + S * 0.72, sy + S * 0.42, S * 0.1, S * 0.28);

  // Hands
  ctx.fillStyle = '#f5cba7';
  ctx.fillRect(sx + S * 0.18, sy + S * 0.68, S * 0.1, S * 0.06);
  ctx.fillRect(sx + S * 0.72, sy + S * 0.68, S * 0.1, S * 0.06);

  // Head
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(sx + S / 2, sy + S * 0.28, S * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(sx + S / 2, sy + S * 0.23, S * 0.2, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();
  // Hair side
  ctx.fillRect(sx + S * 0.3, sy + S * 0.18, S * 0.08, S * 0.14);
  ctx.fillRect(sx + S * 0.62, sy + S * 0.18, S * 0.08, S * 0.14);

  // Eyes
  ctx.fillStyle = '#000';
  if (player.direction === 'left') {
    ctx.fillRect(sx + S * 0.36, sy + S * 0.27, 3, 3);
    ctx.fillRect(sx + S * 0.48, sy + S * 0.27, 3, 3);
  } else if (player.direction === 'right') {
    ctx.fillRect(sx + S * 0.48, sy + S * 0.27, 3, 3);
    ctx.fillRect(sx + S * 0.60, sy + S * 0.27, 3, 3);
  } else if (player.direction === 'up') {
    // Seen from back - no eyes
  } else {
    ctx.fillRect(sx + S * 0.40, sy + S * 0.27, 3, 3);
    ctx.fillRect(sx + S * 0.56, sy + S * 0.27, 3, 3);
    // Mouth
    ctx.fillRect(sx + S * 0.46, sy + S * 0.34, 4, 1);
  }
}
