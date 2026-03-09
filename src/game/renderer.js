// ═══════════════════════════════════════════════════════
// VDX QUEST - Renderer (clean village, no placed sprites)
// ═══════════════════════════════════════════════════════
import {
  TILE, SCALE, RS, ROOM_W, ROOM_H, TOOLS,
  ITEM_TYPES, BUILD_PLOT, HOUSE_STAGES,
} from './constants.js';
import { getImg, getMeta } from './assets.js';
import { tileLayers } from './maps.js';
import { getCurrentQuest, getObjectiveProgress } from './quests.js';

// ════════════════════════════════════════════════════════
// TILESET DRAWING
// ════════════════════════════════════════════════════════
const TILESET_COLS = 64;
const FLIP_H = 0x10000000;
const FLIP_V = 0x20000000;
const ROTATE = 0x40000000;
const TILE_MASK = 0x0FFFFFFF;

function drawTile(ctx, tileId, dx, dy, tileSize, renderSize, tilesetKey) {
  if (tileId === 0) return;
  const img = getImg(tilesetKey);
  if (!img) return;
  const id = tileId & TILE_MASK;
  const cols = tilesetKey === 'forest' ? 10 : TILESET_COLS;
  const col = id % cols;
  const row = Math.floor(id / cols);
  const fh = (tileId & FLIP_H) !== 0;
  const fv = (tileId & FLIP_V) !== 0;
  const rot = (tileId & ROTATE) !== 0;

  if (fh || fv || rot) {
    ctx.save();
    ctx.translate(dx + renderSize / 2, dy + renderSize / 2);
    if (rot) ctx.rotate(Math.PI / 2);
    if (fh) ctx.scale(-1, 1);
    if (fv) ctx.scale(1, -1);
    ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize,
      -renderSize / 2, -renderSize / 2, renderSize, renderSize);
    ctx.restore();
  } else {
    ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize,
      dx, dy, renderSize, renderSize);
  }
}

// ════════════════════════════════════════════════════════
// CHARACTER DRAWING (bigger scale for visibility)
// ════════════════════════════════════════════════════════
const CHAR_SCALE = 0.75;

function drawCharacter(ctx, spriteName, x, y, direction, frame, isMoving) {
  const img = getImg(spriteName);
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const meta = getMeta(spriteName);
  const fw = meta.w, fh = meta.h;
  const nFrames = meta.frames;
  const animFrame = isMoving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;
  const drawW = fw * SCALE * CHAR_SCALE;
  const drawH = fh * SCALE * CHAR_SCALE;
  ctx.save();
  ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  ctx.drawImage(img, animFrame * fw, 0, fw, fh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
}

function renderPlayer(ctx, player, camX, camY, frame) {
  const sx = player.x * SCALE - camX;
  const sy = player.y * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const spriteName = player.actionSprite || (player.moving ? 'spr_walking' : 'spr_idle');
  drawCharacter(ctx, spriteName, cx, cy, player.direction, frame, player.moving);
}

function renderLaurent(ctx, laurent, camX, camY, frame, quests) {
  const sx = laurent.x * SCALE - camX;
  const sy = laurent.y * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;
  if (cx < -100 || cy < -100 || cx > ctx.canvas.width + 100 || cy > ctx.canvas.height + 100) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const idleSprite = 'shorthair_idle_strip9';
  const walkSprite = 'shorthair_walk_strip8';
  drawCharacter(ctx, laurent.moving ? walkSprite : idleSprite, cx, cy, laurent.direction, frame, laurent.moving);

  // Name label
  ctx.font = 'bold 11px monospace';
  const name = 'Laurent';
  const nameW = ctx.measureText(name).width + 12;
  ctx.fillStyle = 'rgba(0,60,120,0.85)';
  ctx.fillRect(cx - nameW / 2, cy - 60, nameW, 16);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, cy - 47);

  // Quest indicator "!"
  if (quests.needsTalk) {
    const bounce = Math.sin(frame * 0.12) * 6;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('!', cx, cy - 74 + bounce);
  }

  // Expression bubble
  const exprImg = getImg('expression_chat');
  if (exprImg && quests.needsTalk) {
    ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height, cx + 14, cy - 72, 20, 20);
  }

  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// TILE LAYERS (terrain only, no placed sprites)
// ════════════════════════════════════════════════════════
const RENDER_LAYERS = [
  'sea', 'clouds_02', 'land', 'paths', 'shadows',
  'decoration_01', 'forest', 'building', 'walls',
  'decoration_02', 'decoration_03',
];
const TOP_LAYERS = ['cloud_shadow', 'clouds_01'];

function renderTileLayer(ctx, layerName, camX, camY) {
  const layer = tileLayers[layerName];
  if (!layer || layer.nonEmpty === 0) return;
  const isForest = layerName === 'forest';
  const tileSize = isForest ? 32 : TILE;
  const renderSize = isForest ? 64 : RS;
  const tilesetKey = isForest ? 'forest' : 'tileset';
  const gridW = layer.width, gridH = layer.height;
  const sc = Math.max(0, Math.floor(camX / renderSize) - 1);
  const sr = Math.max(0, Math.floor(camY / renderSize) - 1);
  const ec = Math.min(gridW, Math.ceil((camX + ctx.canvas.width) / renderSize) + 1);
  const er = Math.min(gridH, Math.ceil((camY + ctx.canvas.height) / renderSize) + 1);
  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const tileId = layer.tiles[row * gridW + col];
      if (tileId && tileId !== 0) {
        drawTile(ctx, tileId, col * renderSize - camX, row * renderSize - camY,
          tileSize, renderSize, tilesetKey);
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// WORLD OBJECTS (interactive trees & rocks)
// ════════════════════════════════════════════════════════
function renderWorldObjects(ctx, objects, camX, camY, frame) {
  for (const obj of objects) {
    if (!obj.alive) continue;
    const sx = obj.x * SCALE - camX;
    const sy = obj.y * SCALE - camY;
    if (sx < -100 || sy < -100 || sx > ctx.canvas.width + 100 || sy > ctx.canvas.height + 100) continue;

    const shake = obj.shakeTimer > 0 ? Math.sin(obj.shakeTimer * 1.5) * 3 : 0;

    if (obj.type === 'tree') {
      const treeImg = getImg('spr_deco_tree_01');
      if (treeImg) {
        const meta = getMeta('spr_deco_tree_01');
        const animFrame = Math.floor(frame / 12) % meta.frames;
        ctx.drawImage(treeImg, animFrame * meta.w, 0, meta.w, meta.h,
          sx - 20 + shake, sy - 40, meta.w * SCALE * 1.1, meta.h * SCALE * 1.1);
      } else {
        // Fallback
        ctx.fillStyle = '#5b3a1a';
        ctx.fillRect(sx + 10 + shake, sy + 8, 12, 24);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx + 16 + shake, sy, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP indicator
      if (obj.hp < obj.maxHp) {
        const barW = 24;
        const barX = sx + 4;
        const barY = sy - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barW * (obj.hp / obj.maxHp), 4);
      }
    } else if (obj.type === 'rock') {
      const oreImg = getImg('spr_deco_ore_stone');
      if (oreImg) {
        const meta = getMeta('spr_deco_ore_stone');
        ctx.drawImage(oreImg, 0, 0, meta.w, meta.h,
          sx - 6 + shake, sy + 2, meta.w * SCALE * 1.1, meta.h * SCALE * 1.1);
      } else {
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.ellipse(sx + 16 + shake, sy + 20, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.ellipse(sx + 14 + shake, sy + 16, 7, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparkle
      if (frame % 60 < 10) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 22 + shake, sy + 14, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP indicator
      if (obj.hp < obj.maxHp) {
        const barW = 24;
        const barX = sx + 4;
        const barY = sy - 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(barX, barY, barW * (obj.hp / obj.maxHp), 4);
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// BUILDING PLOT (detailed house construction stages)
// ════════════════════════════════════════════════════════
function renderBuildingPlot(ctx, camX, camY, houseStage, frame) {
  const px = BUILD_PLOT.x * RS - camX;
  const py = BUILD_PLOT.y * RS - camY;
  const w = BUILD_PLOT.w * RS;
  const h = BUILD_PLOT.h * RS;

  if (houseStage === 0) {
    // Empty plot - dashed outline with stakes
    ctx.strokeStyle = '#c7b777';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(px + 4, py + 4, w - 8, h - 8);
    ctx.setLineDash([]);

    // Corner stakes
    ctx.fillStyle = '#8B6914';
    const stakes = [[px + 6, py + 6], [px + w - 10, py + 6], [px + 6, py + h - 10], [px + w - 10, py + h - 10]];
    for (const [sx, sy] of stakes) {
      ctx.fillRect(sx, sy, 4, 8);
    }

    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const pulse = 0.5 + Math.sin(frame * 0.06) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('TERRAIN', px + w / 2, py + h / 2 - 6);
    ctx.fillText('DE CONSTRUCTION', px + w / 2, py + h / 2 + 10);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

  } else if (houseStage === 1) {
    // Stage 1: 7 Pillars (fondations)
    ctx.fillStyle = '#6B5335';
    ctx.fillRect(px + 8, py + h - 12, w - 16, 8); // Ground beam
    const pillarCount = 7;
    const spacing = (w - 24) / (pillarCount - 1);
    for (let i = 0; i < pillarCount; i++) {
      const pillarX = px + 12 + i * spacing;
      // Pillar base (stone)
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(pillarX - 4, py + h - 18, 10, 8);
      // Pillar (wood)
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(pillarX - 2, py + h * 0.4, 6, h * 0.56);
      // Pillar top
      ctx.fillStyle = '#A0822A';
      ctx.fillRect(pillarX - 4, py + h * 0.38, 10, 6);
    }

  } else if (houseStage === 2) {
    // Stage 2: Sol (floor) on pillars
    // Pillars
    ctx.fillStyle = '#8B6914';
    const pillarCount = 7;
    const spacing = (w - 24) / (pillarCount - 1);
    for (let i = 0; i < pillarCount; i++) {
      const pillarX = px + 12 + i * spacing;
      ctx.fillRect(pillarX - 2, py + h * 0.55, 6, h * 0.4);
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(pillarX - 4, py + h - 14, 10, 8);
      ctx.fillStyle = '#8B6914';
    }
    // Floor platform
    ctx.fillStyle = '#C4A265';
    ctx.fillRect(px + 6, py + h * 0.48, w - 12, 14);
    ctx.fillStyle = '#A0822A';
    ctx.fillRect(px + 6, py + h * 0.48, w - 12, 3);
    // Floor planks
    ctx.strokeStyle = '#9B7B3D';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const plankX = px + 10 + i * ((w - 20) / 8);
      ctx.beginPath();
      ctx.moveTo(plankX, py + h * 0.48);
      ctx.lineTo(plankX, py + h * 0.48 + 14);
      ctx.stroke();
    }

  } else if (houseStage === 3) {
    // Stage 3: Walls (premier etage)
    // Foundation
    ctx.fillStyle = '#6B5335';
    ctx.fillRect(px + 6, py + h - 10, w - 12, 8);
    // Walls
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    // Wall border
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    // Wall beams (vertical)
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(px + 8, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w - 14, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w / 2 - 3, py + h * 0.3, 6, h * 0.66);
    // Door opening
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + w / 2 - 12, py + h * 0.52, 24, h * 0.44);
    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + 24, py + h * 0.42, 20, 16);
    ctx.fillRect(px + w - 44, py + h * 0.42, 20, 16);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 24, py + h * 0.42, 20, 16);
    ctx.strokeRect(px + w - 44, py + h * 0.42, 20, 16);
    // Cross beams on windows
    ctx.beginPath();
    ctx.moveTo(px + 34, py + h * 0.42);
    ctx.lineTo(px + 34, py + h * 0.42 + 16);
    ctx.moveTo(px + w - 34, py + h * 0.42);
    ctx.lineTo(px + w - 34, py + h * 0.42 + 16);
    ctx.stroke();

  } else if (houseStage === 4) {
    // Stage 4: Roof
    // Walls (same as stage 3)
    ctx.fillStyle = '#6B5335';
    ctx.fillRect(px + 6, py + h - 10, w - 12, 8);
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(px + 8, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w - 14, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w / 2 - 3, py + h * 0.3, 6, h * 0.66);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + w / 2 - 12, py + h * 0.52, 24, h * 0.44);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + 24, py + h * 0.42, 20, 16);
    ctx.fillRect(px + w - 44, py + h * 0.42, 20, 16);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 24, py + h * 0.42, 20, 16);
    ctx.strokeRect(px + w - 44, py + h * 0.42, 20, 16);
    // Roof
    ctx.fillStyle = '#8B2020';
    ctx.beginPath();
    ctx.moveTo(px + 2, py + h * 0.32);
    ctx.lineTo(px + w / 2, py - 4);
    ctx.lineTo(px + w - 2, py + h * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a1515';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Roof lines
    ctx.strokeStyle = '#7a1818';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const ry = py + h * 0.32 - i * (h * 0.08);
      const indent = i * 12;
      ctx.beginPath();
      ctx.moveTo(px + 2 + indent, ry);
      ctx.lineTo(px + w - 2 - indent, ry);
      ctx.stroke();
    }

  } else if (houseStage >= 5) {
    // Stage 5: Complete house with finitions
    // Foundation
    ctx.fillStyle = '#6B5335';
    ctx.fillRect(px + 6, py + h - 10, w - 12, 8);
    // Walls
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 8, py + h * 0.3, w - 16, h * 0.66);
    // Beams
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(px + 8, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w - 14, py + h * 0.3, 6, h * 0.66);
    ctx.fillRect(px + w / 2 - 3, py + h * 0.3, 6, h * 0.66);
    // Door (nicer)
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(px + w / 2 - 12, py + h * 0.52, 24, h * 0.44);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + w / 2 + 6, py + h * 0.72, 3, 0, Math.PI * 2);
    ctx.fill();
    // Windows with warm glow
    const glow = 0.6 + Math.sin(frame * 0.05) * 0.3;
    ctx.fillStyle = `rgba(255, 200, 100, ${glow})`;
    ctx.fillRect(px + 24, py + h * 0.42, 20, 16);
    ctx.fillRect(px + w - 44, py + h * 0.42, 20, 16);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 24, py + h * 0.42, 20, 16);
    ctx.strokeRect(px + w - 44, py + h * 0.42, 20, 16);
    // Window cross
    ctx.beginPath();
    ctx.moveTo(px + 34, py + h * 0.42);
    ctx.lineTo(px + 34, py + h * 0.42 + 16);
    ctx.moveTo(px + w - 34, py + h * 0.42);
    ctx.lineTo(px + w - 34, py + h * 0.42 + 16);
    ctx.stroke();
    // Roof
    ctx.fillStyle = '#8B2020';
    ctx.beginPath();
    ctx.moveTo(px + 2, py + h * 0.32);
    ctx.lineTo(px + w / 2, py - 4);
    ctx.lineTo(px + w - 2, py + h * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a1515';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Roof tiles
    ctx.strokeStyle = '#7a1818';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const ry = py + h * 0.32 - i * (h * 0.08);
      const indent = i * 12;
      ctx.beginPath();
      ctx.moveTo(px + 2 + indent, ry);
      ctx.lineTo(px + w - 2 - indent, ry);
      ctx.stroke();
    }
    // Chimney
    ctx.fillStyle = '#666';
    ctx.fillRect(px + w * 0.7, py - 2, 14, h * 0.2);
    ctx.fillStyle = '#555';
    ctx.fillRect(px + w * 0.7 - 2, py - 4, 18, 4);
    // Smoke
    for (let i = 0; i < 3; i++) {
      const smokeY = py - 10 - i * 14 - Math.sin(frame * 0.03 + i) * 4;
      const smokeX = px + w * 0.72 + Math.sin(frame * 0.02 + i * 2) * 5;
      ctx.globalAlpha = 0.3 - i * 0.08;
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 5 + i * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Flower pots
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 16, py + h * 0.88, 8, 8);
    ctx.fillRect(px + w - 24, py + h * 0.88, 8, 8);
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(px + 20, py + h * 0.86, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + w - 20, py + h * 0.86, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ════════════════════════════════════════════════════════
// WORLD RENDER (main scene - clean, no placed sprites)
// ════════════════════════════════════════════════════════
export function renderWorld(ctx, canvas, state) {
  const { player, laurent, quests, worldObjects, houseStage, frame } = state;

  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  // Background
  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tile layers (terrain only - NO placed sprites)
  for (const name of RENDER_LAYERS) renderTileLayer(ctx, name, camX, camY);

  // Building plot
  renderBuildingPlot(ctx, camX, camY, houseStage, frame);

  // Y-sorted entities: player + Laurent + world objects
  const entities = [];
  entities.push({ type: 'player', y: player.y, data: player });
  entities.push({ type: 'laurent', y: laurent.y, data: laurent });
  for (const obj of worldObjects) {
    if (obj.alive) entities.push({ type: 'obj', y: obj.y, data: obj });
  }
  entities.sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.type === 'player') renderPlayer(ctx, e.data, camX, camY, frame);
    else if (e.type === 'laurent') renderLaurent(ctx, e.data, camX, camY, frame, quests);
    else if (e.type === 'obj') renderWorldObjects(ctx, [e.data], camX, camY, frame);
  }

  // Top layers (clouds)
  for (const name of TOP_LAYERS) renderTileLayer(ctx, name, camX, camY);

  return { camX, camY };
}

// ════════════════════════════════════════════════════════
// QUEST DIALOGUE
// ════════════════════════════════════════════════════════
export function renderQuestDialogue(ctx, canvas, quests) {
  if (!quests.showingDialogue) return;

  const boxW = Math.min(600, canvas.width - 40);
  const boxH = 110;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = canvas.height - boxH - 50;

  ctx.fillStyle = 'rgba(15, 10, 25, 0.92)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#4FC3F7'; ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  // Name
  const name = 'Laurent';
  ctx.font = 'bold 14px monospace';
  const nameW = ctx.measureText(name).width + 16;
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(boxX + 16, boxY - 12, nameW, 22);
  ctx.fillStyle = '#0f0a19';
  ctx.fillText(name, boxX + 24, boxY + 4);

  // Expression
  const exprImg = getImg('expression_chat');
  if (exprImg) {
    ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height, boxX + boxW - 50, boxY - 24, 32, 32);
  }

  // Text with word wrap
  ctx.fillStyle = '#e8f4fd'; ctx.font = '13px monospace';
  const maxLineW = boxW - 40;
  const words = quests.displayText.split(' ');
  let line = '', ly = boxY + 32;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxLineW) {
      ctx.fillText(line, boxX + 20, ly);
      line = word; ly += 20;
    } else { line = test; }
  }
  ctx.fillText(line, boxX + 20, ly);

  // Continue arrow
  const fullLine = quests.dialogueLines[quests.dialogueIdx] || '';
  if (quests.charIdx >= fullLine.length && Math.sin(Date.now() * 0.005) > 0) {
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - 30, boxY + boxH - 22);
    ctx.lineTo(boxX + boxW - 24, boxY + boxH - 14);
    ctx.lineTo(boxX + boxW - 18, boxY + boxH - 22);
    ctx.closePath(); ctx.fill();
  }
}

// ════════════════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════════════════
export function renderHUD(ctx, canvas, state) {
  const { quests, inventory, houseStage, notifications, frame } = state;

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, 48);

  // Title
  ctx.fillStyle = '#4FC3F7'; ctx.font = 'bold 13px monospace';
  ctx.fillText('VDX QUEST', 12, 18);
  ctx.fillStyle = '#aaa'; ctx.font = '11px monospace';
  ctx.fillText('Village 1', 12, 35);

  // Quest objective (center)
  const quest = getCurrentQuest(quests);
  if (quest) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(quest.title, canvas.width / 2, 18);
    ctx.fillStyle = '#e8f4fd'; ctx.font = '11px monospace';
    const progress = getObjectiveProgress(quests, inventory, houseStage);
    ctx.fillText(progress, canvas.width / 2, 36);
    ctx.textAlign = 'left';
  }

  // Tool bar (top right)
  const toolBarX = canvas.width - 10 - inventory.tools.length * 36;
  for (let i = 0; i < inventory.tools.length; i++) {
    const sx = toolBarX + i * 36;
    const sy = 6;
    const slotW = 32;
    const sel = i === inventory.selectedTool;
    ctx.fillStyle = sel ? 'rgba(79,195,247,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx, sy, slotW, slotW);
    ctx.strokeStyle = sel ? '#4FC3F7' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, slotW, slotW);

    const toolDef = TOOLS[inventory.tools[i]];
    if (toolDef) {
      const img = getImg(toolDef.icon);
      if (img) ctx.drawImage(img, 0, 0, img.width, img.height, sx + 4, sy + 2, slotW - 8, slotW - 8);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px monospace';
    ctx.fillText(`${i + 1}`, sx + 2, sy + 10);

    if (sel) {
      ctx.fillStyle = '#4FC3F7'; ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(toolDef?.name || '', sx + slotW / 2, sy + slotW + 12);
      ctx.textAlign = 'left';
    }
  }

  // Resource counts
  const resX = toolBarX;
  const resY = 46;
  const woodCount = inventory.items.find(s => s.type === 'wood')?.count || 0;
  const rockCount = inventory.items.find(s => s.type === 'rock')?.count || 0;

  const woodImg = getImg('wood');
  if (woodImg) ctx.drawImage(woodImg, 0, 0, woodImg.width, woodImg.height, resX, resY, 18, 18);
  ctx.fillStyle = '#c9a96e'; ctx.font = 'bold 11px monospace';
  ctx.fillText(`${woodCount}`, resX + 22, resY + 14);

  const rockImg = getImg('rock');
  if (rockImg) ctx.drawImage(rockImg, 0, 0, rockImg.width, rockImg.height, resX + 52, resY, 18, 18);
  ctx.fillStyle = '#999';
  ctx.fillText(`${rockCount}`, resX + 74, resY + 14);

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, canvas.height - 26, canvas.width, 26);
  ctx.fillStyle = '#888'; ctx.font = '10px monospace';
  ctx.fillText('Fleches/ZQSD=deplacer | ESPACE=agir | 1-2=outil | Shift=courir', 12, canvas.height - 8);

  // Notifications
  if (notifications && notifications.length > 0) {
    let ny = canvas.height - 64;
    for (let i = notifications.length - 1; i >= 0; i--) {
      const n = notifications[i];
      const alpha = Math.max(0, 1 - n.age / n.duration);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.font = '12px monospace';
      const tw = ctx.measureText(n.text).width + 18;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(canvas.width / 2 - tw / 2, ny - 8, tw, 24);
      ctx.fillStyle = n.color || '#c7b777';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, canvas.width / 2, ny + 9);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ny -= 28;
    }
  }
}

// ════════════════════════════════════════════════════════
// PROMPTS (interaction hints)
// ════════════════════════════════════════════════════════
export function renderPrompts(ctx, state, camX, camY) {
  const { player, laurent, quests, worldObjects, houseStage, inventory } = state;
  if (quests.showingDialogue) return;

  // Near Laurent
  const distToLaurent = Math.hypot(player.x - laurent.x, player.y - laurent.y);
  if (distToLaurent < TILE * 3) {
    const sx = laurent.x * SCALE - camX + RS / 2;
    const sy = laurent.y * SCALE - camY - 14;
    drawPrompt(ctx, sx, sy, 'ESPACE - Parler a Laurent');
    return;
  }

  // Near building plot
  const ptx = Math.round(player.x / TILE);
  const pty = Math.round(player.y / TILE);
  const bp = BUILD_PLOT;
  if (ptx >= bp.x - 1 && ptx <= bp.x + bp.w && pty >= bp.y - 1 && pty <= bp.y + bp.h && houseStage < HOUSE_STAGES.length - 1) {
    const bpx = (bp.x + bp.w / 2) * RS - camX;
    const bpy = bp.y * RS - camY - 14;
    drawPrompt(ctx, bpx, bpy, 'ESPACE - Construire');
    return;
  }

  // Near tree/rock
  const toolId = inventory.tools[inventory.selectedTool];
  const wantType = toolId === 'axe' ? 'tree' : toolId === 'pickaxe' ? 'rock' : null;
  if (wantType) {
    for (const obj of worldObjects) {
      if (!obj.alive || obj.type !== wantType) continue;
      const dist = Math.hypot(obj.x + TILE / 2 - player.x, obj.y + TILE / 2 - player.y);
      if (dist < 2.5 * TILE) {
        const sx = obj.x * SCALE - camX + RS / 2;
        const sy = obj.y * SCALE - camY - 14;
        drawPrompt(ctx, sx, sy, `ESPACE - ${obj.type === 'tree' ? 'Couper' : 'Miner'}`);
        return;
      }
    }
  }
}

function drawPrompt(ctx, cx, cy, text) {
  ctx.font = 'bold 11px monospace';
  const tw = ctx.measureText(text).width + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(cx - tw / 2, cy - 5, tw, 24);
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2, cy - 5, tw, 24);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 12);
  ctx.textAlign = 'left';
}
