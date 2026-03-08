// ═══════════════════════════════════════════════════════
// VDX QUEST - Renderer
// ═══════════════════════════════════════════════════════
import {
  TILE, SCALE, RS, MAP_COLS, MAP_ROWS, VILLAGE1_MAP,
  TILES, HOUSE_STAGES, ITEM_TYPES, LAURENT,
} from './constants.js';
import { getImg, getMeta } from './assets.js';
import { getCurrentQuest, getObjectiveProgress } from './quests.js';

const TILESET_COLS = 64;
const TILE_MASK = 0x0FFFFFFF;

// ════════════════════════════════════════════
// TILESET TILE
// ════════════════════════════════════════════
function drawTileFromTileset(ctx, tileId, dx, dy) {
  const img = getImg('tileset');
  if (!img) return;
  const id = tileId & TILE_MASK;
  const col = id % TILESET_COLS;
  const row = Math.floor(id / TILESET_COLS);
  ctx.drawImage(img, col * TILE, row * TILE, TILE, TILE, dx, dy, RS, RS);
}

// ════════════════════════════════════════════
// CHARACTER SPRITE
// ════════════════════════════════════════════
function drawCharacter(ctx, spriteName, x, y, direction, frame, isMoving) {
  const img = getImg(spriteName);
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const meta = getMeta(spriteName);
  const fw = meta.w, fh = meta.h, nFrames = meta.frames;
  const animFrame = isMoving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;
  const drawW = fw * SCALE * 0.45;
  const drawH = fh * SCALE * 0.45;
  ctx.save();
  ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  ctx.drawImage(img, animFrame * fw, 0, fw, fh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
}

// ════════════════════════════════════════════
// MAP RENDERING
// ════════════════════════════════════════════
function renderMap(ctx, camX, camY, frame) {
  const sc = Math.max(0, Math.floor(camX / RS) - 1);
  const sr = Math.max(0, Math.floor(camY / RS) - 1);
  const ec = Math.min(MAP_COLS, Math.ceil((camX + ctx.canvas.width) / RS) + 1);
  const er = Math.min(MAP_ROWS, Math.ceil((camY + ctx.canvas.height) / RS) + 1);

  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const terrain = VILLAGE1_MAP[row]?.[col] ?? 0;
      const dx = col * RS - camX;
      const dy = row * RS - camY;

      switch (terrain) {
        case 0: // Water
          renderWater(ctx, dx, dy, col, row, frame);
          break;
        case 1: // Grass
        case 7: // Laurent spawn (grass)
        case 8: // Player spawn (grass)
          drawTileFromTileset(ctx, TILES.GRASS, dx, dy);
          break;
        case 2: // Path
          drawTileFromTileset(ctx, TILES.PATH, dx, dy);
          break;
        case 3: // Forest (walkable, grass floor)
          drawTileFromTileset(ctx, TILES.GRASS_ALT, dx, dy);
          break;
        case 4: // Dense forest (blocked)
          ctx.fillStyle = '#1a3a1a';
          ctx.fillRect(dx, dy, RS, RS);
          // Dense tree tops
          ctx.fillStyle = '#2d5a2d';
          ctx.beginPath();
          ctx.arc(dx + RS / 2, dy + RS / 2, RS * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a4a1a';
          ctx.beginPath();
          ctx.arc(dx + RS * 0.3, dy + RS * 0.4, RS * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 5: // Building plot
          drawTileFromTileset(ctx, TILES.DIRT, dx, dy);
          break;
        case 6: // Rocks area
          drawTileFromTileset(ctx, TILES.GRASS, dx, dy);
          break;
      }
    }
  }
}

function renderWater(ctx, dx, dy, col, row, frame) {
  // Pick water tile based on position (animated pattern)
  const waterTiles = TILES.WATER;
  const idx = ((col + Math.floor(frame / 30)) % 4) + ((row % 4) * 4);
  drawTileFromTileset(ctx, waterTiles[idx % waterTiles.length], dx, dy);
}

// ════════════════════════════════════════════
// WORLD OBJECTS
// ════════════════════════════════════════════
function renderWorldObjects(ctx, objects, camX, camY, frame) {
  for (const obj of objects) {
    if (!obj.alive) continue;
    const sx = obj.x * SCALE - camX;
    const sy = obj.y * SCALE - camY;
    if (sx < -RS * 2 || sy < -RS * 2 || sx > ctx.canvas.width + RS || sy > ctx.canvas.height + RS) continue;

    const shake = obj.shakeTimer > 0 ? Math.sin(obj.shakeTimer * 1.5) * 3 : 0;

    if (obj.type === 'tree') {
      const treeImg = getImg('spr_deco_tree_01');
      if (treeImg) {
        const meta = getMeta('spr_deco_tree_01');
        const animFrame = Math.floor(frame / 12) % meta.frames;
        const tw = meta.w * SCALE * 0.8;
        const th = meta.h * SCALE * 0.8;
        ctx.drawImage(treeImg, animFrame * meta.w, 0, meta.w, meta.h,
          sx - tw / 4 + shake, sy - th + RS / 2, tw, th);
      } else {
        // Fallback
        ctx.fillStyle = '#5b3a1a';
        ctx.fillRect(sx + RS * 0.35 + shake, sy + RS * 0.3, RS * 0.15, RS * 0.5);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx + RS * 0.42 + shake, sy + RS * 0.15, RS * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'rock') {
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(sx + RS * 0.5 + shake, sy + RS * 0.6, RS * 0.35, RS * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.ellipse(sx + RS * 0.4 + shake, sy + RS * 0.5, RS * 0.15, RS * 0.1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Sparkle
      if (frame % 60 < 8) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + RS * 0.6 + shake, sy + RS * 0.45, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ════════════════════════════════════════════
// BUILDING PLOT
// ════════════════════════════════════════════
function renderBuildingPlot(ctx, camX, camY, houseStage, frame) {
  // Building plot is at tiles 22-25, 13-16
  const px = 22 * RS - camX;
  const py = 13 * RS - camY;
  const w = 4 * RS;
  const h = 4 * RS;

  if (houseStage === 0) {
    // Empty plot with markers
    ctx.strokeStyle = '#c7b777';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(px + 4, py + 4, w - 8, h - 8);
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const pulse = 0.6 + Math.sin(frame * 0.06) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('TERRAIN', px + w / 2, py + h / 2 - 4);
    ctx.fillText('DE CONSTRUCTION', px + w / 2, py + h / 2 + 10);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  } else if (houseStage === 1) {
    // Foundation
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(px + 10, py + h - RS * 1.2, w - 20, RS * 0.8);
    ctx.fillStyle = '#6B5335';
    ctx.fillRect(px + 14, py + h - RS * 1.2 + 4, w - 28, RS * 0.7);
    // Corner posts
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(px + 12, py + h - RS * 1.6, 8, RS * 1.2);
    ctx.fillRect(px + w - 20, py + h - RS * 1.6, 8, RS * 1.2);
  } else if (houseStage === 2) {
    // Walls
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(px + 10, py + h - RS * 1.2, w - 20, RS * 0.8);
    // Walls
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    // Door hole
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + w / 2 - 14, py + h - RS * 2.2, 28, RS * 1.4);
    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + RS, py + RS * 1.2, 20, 16);
    ctx.fillRect(px + w - RS - 20, py + RS * 1.2, 20, 16);
  } else if (houseStage === 3) {
    // Walls
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    // Roof
    ctx.fillStyle = '#8B2020';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + RS * 0.9);
    ctx.lineTo(px + w / 2, py - RS * 0.2);
    ctx.lineTo(px + w - 4, py + RS * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a1515';
    ctx.stroke();
    // Door
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(px + w / 2 - 14, py + h - RS * 2.2, 28, RS * 1.4);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + w / 2 + 8, py + h - RS * 1.5, 3, 0, Math.PI * 2);
    ctx.fill();
    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + RS, py + RS * 1.2, 20, 16);
    ctx.fillRect(px + w - RS - 20, py + RS * 1.2, 20, 16);
    // Chimney
    ctx.fillStyle = '#666';
    ctx.fillRect(px + w * 0.7, py - RS * 0.1, 12, RS * 0.5);
  } else if (houseStage >= 4) {
    // Complete house with glow
    renderCompleteHouse(ctx, px, py, w, h, frame);
  }
}

function renderCompleteHouse(ctx, px, py, w, h, frame) {
  // Walls
  ctx.fillStyle = '#c9a96e';
  ctx.fillRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
  // Roof
  ctx.fillStyle = '#8B2020';
  ctx.beginPath();
  ctx.moveTo(px + 4, py + RS * 0.9);
  ctx.lineTo(px + w / 2, py - RS * 0.2);
  ctx.lineTo(px + w - 4, py + RS * 0.9);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = '#5b3a1a';
  ctx.fillRect(px + w / 2 - 14, py + h - RS * 2.2, 28, RS * 1.4);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(px + w / 2 + 8, py + h - RS * 1.5, 3, 0, Math.PI * 2);
  ctx.fill();
  // Windows with warm light
  const glow = 0.6 + Math.sin(frame * 0.05) * 0.3;
  ctx.fillStyle = `rgba(255, 200, 100, ${glow})`;
  ctx.fillRect(px + RS, py + RS * 1.2, 20, 16);
  ctx.fillRect(px + w - RS - 20, py + RS * 1.2, 20, 16);
  // Chimney + smoke
  ctx.fillStyle = '#666';
  ctx.fillRect(px + w * 0.7, py - RS * 0.1, 12, RS * 0.5);
  // Smoke particles
  for (let i = 0; i < 3; i++) {
    const smokeY = py - RS * 0.3 - i * 12 - Math.sin(frame * 0.03 + i) * 4;
    const smokeX = px + w * 0.72 + Math.sin(frame * 0.02 + i * 2) * 4;
    ctx.globalAlpha = 0.3 - i * 0.08;
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, 5 + i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Celebration sparkles
  if (frame % 20 < 10) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + Math.sin(frame * 0.07) * w * 0.4 + w / 2,
            py - 10 + Math.cos(frame * 0.09) * 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ════════════════════════════════════════════
// NPC (Laurent)
// ════════════════════════════════════════════
function renderLaurent(ctx, laurent, camX, camY, frame, quests) {
  const sx = laurent.x * SCALE - camX;
  const sy = laurent.y * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Laurent sprite
  drawCharacter(ctx, 'shorthair_idle_strip9', cx, cy, laurent.direction, frame, false);

  // Name tag
  ctx.font = 'bold 10px monospace';
  const name = 'Laurent';
  const nameW = ctx.measureText(name).width + 12;
  ctx.fillStyle = 'rgba(0,60,120,0.8)';
  ctx.fillRect(cx - nameW / 2, cy - 52, nameW, 16);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, cy - 40);

  // Quest indicator
  if (quests.needsTalk) {
    const bounce = Math.sin(frame * 0.12) * 5;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('!', cx, cy - 62 + bounce);
  }
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════
// PLAYER
// ════════════════════════════════════════════
function renderPlayer(ctx, player, camX, camY, frame) {
  const sx = player.x * SCALE - camX;
  const sy = player.y * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const spriteName = player.actionSprite || (player.moving ? 'spr_walking' : 'spr_idle');
  drawCharacter(ctx, spriteName, cx, cy, player.direction, frame, player.moving);
}

// ════════════════════════════════════════════
// DIALOGUE BOX
// ════════════════════════════════════════════
function renderDialogue(ctx, canvas, quests) {
  if (!quests.showingDialogue) return;

  const boxW = Math.min(560, canvas.width - 40);
  const boxH = 90;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = canvas.height - boxH - 60;

  // Box
  ctx.fillStyle = 'rgba(10, 15, 30, 0.94)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#4FC3F7'; ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  // Name
  ctx.font = 'bold 12px monospace';
  const name = 'Laurent';
  const nameW = ctx.measureText(name).width + 14;
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(boxX + 14, boxY - 11, nameW, 18);
  ctx.fillStyle = '#0a0f1e';
  ctx.fillText(name, boxX + 21, boxY + 3);

  // Text with word wrap
  ctx.fillStyle = '#e8f4fd';
  ctx.font = '12px monospace';
  const maxLineW = boxW - 40;
  const words = quests.displayText.split(' ');
  let line = '', ly = boxY + 28;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxLineW) {
      ctx.fillText(line, boxX + 20, ly);
      line = word; ly += 18;
    } else { line = test; }
  }
  ctx.fillText(line, boxX + 20, ly);

  // Continue indicator
  const fullLine = quests.dialogueLines[quests.dialogueIdx] || '';
  if (quests.charIdx >= fullLine.length && Math.sin(Date.now() * 0.005) > 0) {
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - 28, boxY + boxH - 18);
    ctx.lineTo(boxX + boxW - 22, boxY + boxH - 10);
    ctx.lineTo(boxX + boxW - 16, boxY + boxH - 18);
    ctx.closePath(); ctx.fill();
  }
}

// ════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════
function renderHUD(ctx, canvas, quests, inventory, houseStage, notifications, frame) {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, 50);

  ctx.fillStyle = '#4FC3F7';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('VDX QUEST', 14, 20);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.fillText('Village 1', 14, 36);

  // Quest objective
  const quest = getCurrentQuest(quests);
  if (quest) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(quest.title, canvas.width / 2, 18);

    ctx.fillStyle = '#e8f4fd';
    ctx.font = '10px monospace';
    const progress = getObjectiveProgress(quests, inventory, houseStage);
    ctx.fillText(progress, canvas.width / 2, 34);
    ctx.textAlign = 'left';
  }

  // Inventory display (top right)
  const invX = canvas.width - 160;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(invX - 6, 6, 154, 38);

  // Wood count
  const woodImg = getImg('wood');
  if (woodImg) ctx.drawImage(woodImg, 0, 0, woodImg.width, woodImg.height, invX, 10, 20, 20);
  ctx.fillStyle = '#c9a96e';
  ctx.font = 'bold 12px monospace';
  const woodCount = inventory.items.find(s => s.type === 'wood')?.count || 0;
  ctx.fillText(`${woodCount}`, invX + 24, 26);

  // Rock count
  const rockImg = getImg('rock');
  if (rockImg) ctx.drawImage(rockImg, 0, 0, rockImg.width, rockImg.height, invX + 60, 10, 20, 20);
  ctx.fillStyle = '#999';
  const rockCount = inventory.items.find(s => s.type === 'rock')?.count || 0;
  ctx.fillText(`${rockCount}`, invX + 84, 26);

  // Axe icon
  const axeImg = getImg('axe');
  if (axeImg) ctx.drawImage(axeImg, 0, 0, axeImg.width, axeImg.height, invX + 120, 10, 20, 20);

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.fillStyle = '#888';
  ctx.font = '9px monospace';
  ctx.fillText('Fleches/ZQSD = deplacer | ESPACE = agir/couper/construire | Shift = courir', 14, canvas.height - 8);

  // Notifications
  if (notifications.length > 0) {
    let ny = canvas.height - 60;
    for (let i = notifications.length - 1; i >= 0; i--) {
      const n = notifications[i];
      const alpha = Math.max(0, 1 - n.age / n.duration);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.font = '12px monospace';
      const tw = ctx.measureText(n.text).width + 20;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(canvas.width / 2 - tw / 2, ny - 8, tw, 24);
      ctx.fillStyle = n.color || '#c7b777';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, canvas.width / 2, ny + 9);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ny -= 30;
    }
  }
}

// ════════════════════════════════════════════
// PROMPTS
// ════════════════════════════════════════════
function renderPrompts(ctx, player, laurent, quests, worldObjects, houseStage, camX, camY) {
  if (quests.showingDialogue) return;

  // Near Laurent
  const distToLaurent = Math.hypot(player.x - laurent.x, player.y - laurent.y);
  if (distToLaurent < TILE * 3) {
    const sx = laurent.x * SCALE - camX + RS / 2;
    const sy = laurent.y * SCALE - camY - 10;
    drawPrompt(ctx, sx, sy, 'ESPACE - Parler');
  }

  // Near building plot
  const ptx = Math.round(player.x / TILE);
  const pty = Math.round(player.y / TILE);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const t = VILLAGE1_MAP[pty + dr]?.[ptx + dc];
      if (t === 5 && houseStage < 4) {
        const bpx = 23.5 * RS - camX;
        const bpy = 12.5 * RS - camY;
        drawPrompt(ctx, bpx, bpy, 'ESPACE - Construire');
        return;
      }
    }
  }

  // Near world object
  const obj = getNearbyObjectForPrompt(worldObjects, player.x, player.y);
  if (obj) {
    const sx = obj.x * SCALE - camX + RS / 2;
    const sy = obj.y * SCALE - camY - 10;
    drawPrompt(ctx, sx, sy, `ESPACE - ${obj.type === 'tree' ? 'Couper' : 'Miner'}`);
  }
}

function getNearbyObjectForPrompt(objects, px, py) {
  const range = 2.5 * TILE;
  for (const obj of objects) {
    if (!obj.alive) continue;
    const dist = Math.hypot(obj.x + TILE / 2 - px - TILE / 2, obj.y + TILE / 2 - py - TILE / 2);
    if (dist < range) return obj;
  }
  return null;
}

function drawPrompt(ctx, cx, cy, text) {
  ctx.font = 'bold 10px monospace';
  const tw = ctx.measureText(text).width + 14;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(cx - tw / 2, cy - 4, tw, 20);
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2, cy - 4, tw, 20);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 10);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════
// MAIN RENDER
// ════════════════════════════════════════════
export function renderAll(ctx, canvas, state) {
  const { player, laurent, quests, inventory, worldObjects, houseStage, frame, notifications } = state;

  // Camera centered on player
  const worldW = MAP_COLS * RS;
  const worldH = MAP_ROWS * RS;
  const maxCamX = Math.max(0, worldW - canvas.width);
  const maxCamY = Math.max(0, worldH - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  // Background
  ctx.fillStyle = '#1a3a6a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Map
  renderMap(ctx, camX, camY, frame);

  // Building plot / house
  renderBuildingPlot(ctx, camX, camY, houseStage, frame);

  // Collect all Y-sorted entities
  const entities = [];

  // World objects
  for (const obj of worldObjects) {
    if (obj.alive) entities.push({ type: 'obj', y: obj.y, data: obj });
  }

  // Laurent
  entities.push({ type: 'laurent', y: laurent.y, data: laurent });

  // Player
  entities.push({ type: 'player', y: player.y, data: player });

  entities.sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.type === 'obj') {
      renderWorldObjects(ctx, [e.data], camX, camY, frame);
    } else if (e.type === 'laurent') {
      renderLaurent(ctx, e.data, camX, camY, frame, quests);
    } else if (e.type === 'player') {
      renderPlayer(ctx, e.data, camX, camY, frame);
    }
  }

  // Prompts
  renderPrompts(ctx, player, laurent, quests, worldObjects, houseStage, camX, camY);

  // Dialogue
  renderDialogue(ctx, canvas, quests);

  // HUD
  renderHUD(ctx, canvas, quests, inventory, houseStage, notifications, frame);
}
