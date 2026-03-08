import { TILE_SIZE, SCALE, RENDER_SIZE, MAP_COLS, MAP_ROWS, GAME_STATE } from './constants.js';
import {
  villageMap, houses, interiorMap, INTERIOR_COLS, INTERIOR_ROWS,
  G, W, P, T, H1, H2, H3, F, FL, B,
  FL_WOOD, WALL, TBL, CHR, BED, BKSH, CHST, DR, RG, FP, BRL, PT,
} from './maps.js';

let tilesetImg = null;
let tilesetLoaded = false;

export function loadTileset() {
  return new Promise((resolve) => {
    if (tilesetLoaded) { resolve(tilesetImg); return; }
    tilesetImg = new Image();
    tilesetImg.onload = () => { tilesetLoaded = true; resolve(tilesetImg); };
    tilesetImg.src = '/assets/spr_tileset_sunnysideworld_16px.png';
  });
}

// Draw a single tile from the tileset
function drawTile(ctx, tileX, tileY, destX, destY, size = 1) {
  ctx.drawImage(
    tilesetImg,
    tileX * TILE_SIZE, tileY * TILE_SIZE,
    TILE_SIZE * size, TILE_SIZE * size,
    destX, destY,
    RENDER_SIZE * size, RENDER_SIZE * size
  );
}

// Draw a grass tile with some variation
function drawGrass(ctx, x, y, col, row) {
  // Use position to create consistent variation
  const variant = (col * 7 + row * 13) % 5;
  if (variant < 3) {
    drawTile(ctx, 0, 0, x, y); // plain grass
  } else if (variant === 3) {
    drawTile(ctx, 1, 0, x, y); // grass variant 2
  } else {
    drawTile(ctx, 2, 0, x, y); // grass variant 3
  }
}

// Draw water tile with animation
function drawWater(ctx, x, y, col, row, frame) {
  // Water area in tileset - approximately at row 27-29
  // Use simple blue fill with wave effect
  const animOffset = Math.sin((frame * 0.05) + col * 0.5 + row * 0.3) * 2;

  // Deep water blue
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);

  // Wave highlights
  ctx.fillStyle = 'rgba(147, 197, 253, 0.4)';
  const waveY = y + RENDER_SIZE * 0.3 + animOffset;
  ctx.fillRect(x, waveY, RENDER_SIZE, 3);
  ctx.fillRect(x + 8, waveY + 12, RENDER_SIZE - 16, 2);
}

// Draw a path tile
function drawPath(ctx, x, y) {
  // Sandy/dirt color
  ctx.fillStyle = '#c4a46c';
  ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);

  // Some texture
  ctx.fillStyle = 'rgba(160, 130, 80, 0.3)';
  ctx.fillRect(x + 4, y + 4, 8, 8);
  ctx.fillRect(x + 20, y + 16, 12, 6);
  ctx.fillRect(x + 8, y + 30, 6, 8);
}

// Draw a tree
function drawTree(ctx, x, y) {
  // Trunk
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(x + RENDER_SIZE * 0.3, y + RENDER_SIZE * 0.5, RENDER_SIZE * 0.4, RENDER_SIZE * 0.5);

  // Canopy - dark green circle
  ctx.fillStyle = '#2d6a30';
  ctx.beginPath();
  ctx.arc(x + RENDER_SIZE * 0.5, y + RENDER_SIZE * 0.35, RENDER_SIZE * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Lighter highlights
  ctx.fillStyle = '#4a9e4e';
  ctx.beginPath();
  ctx.arc(x + RENDER_SIZE * 0.4, y + RENDER_SIZE * 0.28, RENDER_SIZE * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// Draw flowers
function drawFlower(ctx, x, y, col, row) {
  // Draw grass underneath
  drawGrass(ctx, x, y, col, row);

  const variant = (col * 3 + row * 5) % 4;
  const colors = ['#ff6b6b', '#ffd93d', '#6bcbff', '#ff9ff3'];
  const color = colors[variant];

  // Draw small flowers
  for (let i = 0; i < 3; i++) {
    const fx = x + 8 + (i * 14);
    const fy = y + 12 + ((i * 7) % 20);
    ctx.fillStyle = '#4a9e4e';
    ctx.fillRect(fx + 2, fy + 4, 2, 8);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fx + 3, fy + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw bridge
function drawBridge(ctx, x, y) {
  // Wood planks over water
  ctx.fillStyle = '#a0845c';
  ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);

  // Plank lines
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const ly = y + 4 + i * 12;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + RENDER_SIZE, ly);
    ctx.stroke();
  }

  // Rails
  ctx.fillStyle = '#6b4c1e';
  ctx.fillRect(x, y, 4, RENDER_SIZE);
  ctx.fillRect(x + RENDER_SIZE - 4, y, 4, RENDER_SIZE);
}

// Draw a house from the tileset
function drawHouse(ctx, house, cameraX, cameraY) {
  const tileData = {
    blue: { sy: 6 },
    green: { sy: 12 },
    orange: { sy: 18 },
    red: { sy: 24 },
    purple: { sy: 30 },
  };

  const t = tileData[house.color] || tileData.blue;
  const sx = 13; // Houses start at column 13 in tileset

  const destX = house.mapX * RENDER_SIZE - cameraX;
  const destY = house.mapY * RENDER_SIZE - cameraY;

  // Draw the house from tileset (5 wide x 3 tall tiles)
  ctx.drawImage(
    tilesetImg,
    sx * TILE_SIZE, t.sy * TILE_SIZE,
    5 * TILE_SIZE, 3 * TILE_SIZE,
    destX, destY,
    5 * RENDER_SIZE, 3 * RENDER_SIZE
  );

  // Draw house name label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  const labelW = house.name.length * 8 + 16;
  ctx.fillRect(destX + (5 * RENDER_SIZE - labelW) / 2, destY - 28, labelW, 22);
  ctx.fillStyle = '#c7b777';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(house.name, destX + 5 * RENDER_SIZE / 2, destY - 12);
  ctx.textAlign = 'left';
}

// Render the village map
export function renderVillage(ctx, canvas, player, frame) {
  const cameraX = Math.max(0, Math.min(
    player.x * SCALE - canvas.width / 2,
    MAP_COLS * RENDER_SIZE - canvas.width
  ));
  const cameraY = Math.max(0, Math.min(
    player.y * SCALE - canvas.height / 2,
    MAP_ROWS * RENDER_SIZE - canvas.height
  ));

  // Clear
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!tilesetLoaded) return { cameraX, cameraY };

  // Calculate visible tile range
  const startCol = Math.max(0, Math.floor(cameraX / RENDER_SIZE));
  const startRow = Math.max(0, Math.floor(cameraY / RENDER_SIZE));
  const endCol = Math.min(MAP_COLS, Math.ceil((cameraX + canvas.width) / RENDER_SIZE) + 1);
  const endRow = Math.min(MAP_ROWS, Math.ceil((cameraY + canvas.height) / RENDER_SIZE) + 1);

  // Draw ground layer
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = villageMap[row]?.[col];
      const x = col * RENDER_SIZE - cameraX;
      const y = row * RENDER_SIZE - cameraY;

      if (tile === undefined) continue;

      switch (tile) {
        case G:
          drawGrass(ctx, x, y, col, row);
          break;
        case W:
          drawWater(ctx, x, y, col, row, frame);
          break;
        case P:
          drawPath(ctx, x, y);
          break;
        case T:
          drawGrass(ctx, x, y, col, row);
          drawTree(ctx, x, y);
          break;
        case FL:
          drawFlower(ctx, x, y, col, row);
          break;
        case B:
          drawBridge(ctx, x, y);
          break;
        case H1: case H2: case H3:
          drawGrass(ctx, x, y, col, row);
          break;
        default:
          drawGrass(ctx, x, y, col, row);
      }
    }
  }

  // Draw houses on top
  for (const house of houses) {
    drawHouse(ctx, house, cameraX, cameraY);
  }

  // Draw "enter" prompt near doors
  for (const house of houses) {
    const dx = Math.abs(player.x / TILE_SIZE - house.doorX);
    const dy = Math.abs(player.y / TILE_SIZE - house.doorY);
    if (dx < 1.5 && dy < 1.5) {
      const promptX = house.doorX * RENDER_SIZE - cameraX;
      const promptY = house.doorY * RENDER_SIZE - cameraY - 40;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(promptX - 60, promptY - 5, 160, 28);
      ctx.strokeStyle = '#c7b777';
      ctx.lineWidth = 1;
      ctx.strokeRect(promptX - 60, promptY - 5, 160, 28);
      ctx.fillStyle = '#c7b777';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Appuie ESPACE pour entrer', promptX + 20, promptY + 14);
      ctx.textAlign = 'left';
    }
  }

  return { cameraX, cameraY };
}

// Render interior
export function renderInterior(ctx, canvas, player, currentHouse, frame) {
  const offsetX = (canvas.width - INTERIOR_COLS * RENDER_SIZE) / 2;
  const offsetY = (canvas.height - INTERIOR_ROWS * RENDER_SIZE) / 2;

  // Clear with dark background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw interior tiles
  for (let row = 0; row < INTERIOR_ROWS; row++) {
    for (let col = 0; col < INTERIOR_COLS; col++) {
      const tile = interiorMap[row][col];
      const x = offsetX + col * RENDER_SIZE;
      const y = offsetY + row * RENDER_SIZE;

      switch (tile) {
        case WALL:
          drawWallTile(ctx, x, y, row, currentHouse);
          break;
        case FL_WOOD:
          drawWoodFloor(ctx, x, y, col, row);
          break;
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
        case DR:
          drawDoor(ctx, x, y);
          break;
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
        default:
          drawWoodFloor(ctx, x, y, col, row);
      }
    }
  }

  // House name at top
  const houseName = currentHouse?.name || 'Intérieur';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(canvas.width / 2 - 120, 10, 240, 32);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width / 2 - 120, 10, 240, 32);
  ctx.fillStyle = '#c7b777';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(houseName, canvas.width / 2, 32);
  ctx.textAlign = 'left';

  // Exit prompt near door
  const doorRow = INTERIOR_ROWS - 1;
  const playerTileRow = Math.floor((player.y * SCALE - offsetY) / RENDER_SIZE);
  if (playerTileRow >= doorRow - 1) {
    const promptX = canvas.width / 2;
    const promptY = offsetY + INTERIOR_ROWS * RENDER_SIZE + 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(promptX - 80, promptY - 5, 160, 28);
    ctx.strokeStyle = '#c7b777';
    ctx.strokeRect(promptX - 80, promptY - 5, 160, 28);
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Appuie ESPACE pour sortir', promptX, promptY + 14);
    ctx.textAlign = 'left';
  }

  return { offsetX, offsetY };
}

// Interior drawing helpers
function drawWallTile(ctx, x, y, row, house) {
  const colors = {
    blue: { wall: '#4a6fa5', dark: '#3a5a8a' },
    green: { wall: '#5a8a5a', dark: '#4a7a4a' },
    orange: { wall: '#b8864a', dark: '#a07040' },
  };
  const c = colors[house?.color] || colors.blue;

  if (row === 0) {
    ctx.fillStyle = c.dark;
    ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);
    // Brick pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(x + 2, y + i * 16 + 2, 22, 12);
      ctx.strokeRect(x + 14, y + i * 16 + 10, 22, 12);
    }
  } else {
    ctx.fillStyle = c.wall;
    ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, RENDER_SIZE, RENDER_SIZE);
  }
}

function drawWoodFloor(ctx, x, y, col, row) {
  ctx.fillStyle = (col + row) % 2 === 0 ? '#c9a96e' : '#b8984e';
  ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);
  // Plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + RENDER_SIZE / 2);
  ctx.lineTo(x + RENDER_SIZE, y + RENDER_SIZE / 2);
  ctx.stroke();
}

function drawTable(ctx, x, y) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 4, y + 6, RENDER_SIZE - 8, RENDER_SIZE - 10);
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 6, y + RENDER_SIZE - 6, 4, 6);
  ctx.fillRect(x + RENDER_SIZE - 10, y + RENDER_SIZE - 6, 4, 6);
}

function drawChair(ctx, x, y) {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x + 10, y + 4, RENDER_SIZE - 20, RENDER_SIZE - 12);
  // Legs
  ctx.fillRect(x + 12, y + RENDER_SIZE - 8, 4, 8);
  ctx.fillRect(x + RENDER_SIZE - 16, y + RENDER_SIZE - 8, 4, 8);
}

function drawBed(ctx, x, y, col) {
  // Frame
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + 2, RENDER_SIZE - 4, RENDER_SIZE - 4);
  // Mattress
  ctx.fillStyle = '#f5f0e0';
  ctx.fillRect(x + 4, y + 4, RENDER_SIZE - 8, RENDER_SIZE - 8);
  // Pillow
  if (col === 6) { // left side of bed
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(x + 6, y + 6, 16, 10);
  }
  // Blanket
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(x + 4, y + RENDER_SIZE / 2, RENDER_SIZE - 8, RENDER_SIZE / 2 - 4);
}

function drawBookshelf(ctx, x, y) {
  // Shelf frame
  ctx.fillStyle = '#6B3E1C';
  ctx.fillRect(x + 2, y + 2, RENDER_SIZE - 4, RENDER_SIZE - 4);

  // Books
  const bookColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#f39c12'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(x + 5 + i * 7, y + 6, 5, 16);
    ctx.fillRect(x + 5 + i * 7, y + 24, 5, 14);
  }
}

function drawChest(ctx, x, y) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 6, y + 10, RENDER_SIZE - 12, RENDER_SIZE - 14);
  // Metal bands
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(x + 6, y + 14, RENDER_SIZE - 12, 3);
  ctx.fillRect(x + 6, y + RENDER_SIZE - 10, RENDER_SIZE - 12, 3);
  // Lock
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(x + RENDER_SIZE / 2 - 3, y + 16, 6, 6);
}

function drawDoor(ctx, x, y) {
  // Floor underneath
  ctx.fillStyle = '#b8984e';
  ctx.fillRect(x, y, RENDER_SIZE, RENDER_SIZE);
  // Door mat
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x + 4, y + 4, RENDER_SIZE - 8, RENDER_SIZE - 8);
  ctx.fillStyle = '#a07040';
  ctx.fillRect(x + 8, y + 8, RENDER_SIZE - 16, RENDER_SIZE - 16);
}

function drawRug(ctx, x, y, house) {
  const colors = {
    blue: '#4a6fa5',
    green: '#5a8a5a',
    orange: '#c49040',
  };
  const color = colors[house?.color] || '#8B4513';

  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, RENDER_SIZE - 4, RENDER_SIZE - 4);
  // Pattern
  ctx.fillStyle = 'rgba(199, 183, 119, 0.4)';
  ctx.fillRect(x + 8, y + 8, RENDER_SIZE - 16, RENDER_SIZE - 16);
  // Border decoration
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, RENDER_SIZE - 8, RENDER_SIZE - 8);
}

function drawFireplace(ctx, x, y, frame) {
  // Stone base
  ctx.fillStyle = '#555';
  ctx.fillRect(x + 2, y + 2, RENDER_SIZE - 4, RENDER_SIZE - 4);
  ctx.fillStyle = '#444';
  ctx.fillRect(x + 6, y + 6, RENDER_SIZE - 12, RENDER_SIZE - 10);

  // Fire
  const flicker = Math.sin(frame * 0.15) * 3;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2 + flicker, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2 - 2 + flicker, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2 - 4 + flicker, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarrel(ctx, x, y) {
  ctx.fillStyle = '#8B5E3C';
  ctx.beginPath();
  ctx.ellipse(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Metal bands
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2 - 6, 14, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + RENDER_SIZE / 2, y + RENDER_SIZE / 2 + 6, 14, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPot(ctx, x, y) {
  ctx.fillStyle = '#7f6040';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 8);
  ctx.lineTo(x + RENDER_SIZE - 10, y + 8);
  ctx.lineTo(x + RENDER_SIZE - 6, y + RENDER_SIZE - 6);
  ctx.lineTo(x + 6, y + RENDER_SIZE - 6);
  ctx.closePath();
  ctx.fill();
  // Rim
  ctx.fillStyle = '#6b5030';
  ctx.fillRect(x + 8, y + 6, RENDER_SIZE - 16, 4);
}

// Draw the player character
export function renderPlayer(ctx, player, cameraX, cameraY, gameState, interiorOffset) {
  let screenX, screenY;

  if (gameState === GAME_STATE.INTERIOR) {
    screenX = interiorOffset.offsetX + (player.x * SCALE);
    screenY = interiorOffset.offsetY + (player.y * SCALE);
  } else {
    screenX = player.x * SCALE - cameraX;
    screenY = player.y * SCALE - cameraY;
  }

  const s = RENDER_SIZE;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(screenX + s / 2, screenY + s - 4, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(screenX + s * 0.25, screenY + s * 0.4, s * 0.5, s * 0.45);

  // Head
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(screenX + s / 2, screenY + s * 0.3, s * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(screenX + s / 2, screenY + s * 0.25, s * 0.22, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes based on direction
  ctx.fillStyle = '#000';
  if (player.direction === 'left') {
    ctx.fillRect(screenX + s * 0.35, screenY + s * 0.28, 3, 3);
  } else if (player.direction === 'right') {
    ctx.fillRect(screenX + s * 0.55, screenY + s * 0.28, 3, 3);
  } else {
    ctx.fillRect(screenX + s * 0.38, screenY + s * 0.28, 3, 3);
    ctx.fillRect(screenX + s * 0.55, screenY + s * 0.28, 3, 3);
  }

  // Walk animation - leg movement
  if (player.moving) {
    const legOffset = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(screenX + s * 0.3, screenY + s * 0.82, s * 0.15, s * 0.15 + legOffset);
    ctx.fillRect(screenX + s * 0.55, screenY + s * 0.82, s * 0.15, s * 0.15 - legOffset);
  } else {
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(screenX + s * 0.3, screenY + s * 0.82, s * 0.15, s * 0.15);
    ctx.fillRect(screenX + s * 0.55, screenY + s * 0.82, s * 0.15, s * 0.15);
  }

  // VDX gold accent (small cape/collar)
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(screenX + s * 0.2, screenY + s * 0.4, s * 0.6, 3);
}
