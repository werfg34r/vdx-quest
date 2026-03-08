// ═══════════════════════════════════════════════════════
// VDX QUEST - Renderer (using original Sunnyside World tileset)
// ═══════════════════════════════════════════════════════
import {
  TILE, SCALE, RS, ROOM_W, ROOM_H, MODE, TOOLS,
  ITEM_TYPES, BUILD_PLOT, HOUSE_STAGES,
} from './constants.js';
import { getImg, getMeta } from './assets.js';
import { tileLayers, placedAssets } from './maps.js';
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
// PLACED SPRITE DRAWING
// ════════════════════════════════════════════════════════
function drawSprite(ctx, asset, camX, camY, frame) {
  const img = getImg(asset.sprite);
  if (!img) return;
  const meta = getMeta(asset.sprite);
  const { w, h, ox, oy, frames } = meta;
  let srcX = 0;
  if (frames > 1 && img.width > w) {
    srcX = (Math.floor(frame / 10) % frames) * w;
  }
  const dx = (asset.x - ox) * SCALE - camX;
  const dy = (asset.y - oy) * SCALE - camY;
  const dw = w * SCALE;
  const dh = h * SCALE;
  if (dx + dw < -200 || dy + dh < -200 || dx > ctx.canvas.width + 200 || dy > ctx.canvas.height + 200) return;

  const sx = asset.scaleX, sy = asset.scaleY, rot = asset.rotation;
  const colour = asset.colour || 4294967295;
  const alpha = ((colour >>> 24) & 0xFF) / 255;
  const prevAlpha = ctx.globalAlpha;
  if (alpha < 1) ctx.globalAlpha = alpha;

  if (sx !== 1 || sy !== 1 || rot !== 0) {
    ctx.save();
    ctx.translate(asset.x * SCALE - camX, asset.y * SCALE - camY);
    if (rot !== 0) ctx.rotate(rot * Math.PI / 180);
    ctx.scale(sx, sy);
    ctx.drawImage(img, srcX, 0, w, h, -ox * SCALE, -oy * SCALE, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, srcX, 0, w, h, dx, dy, dw, dh);
  }
  if (alpha < 1) ctx.globalAlpha = prevAlpha;
}

// ════════════════════════════════════════════════════════
// CHARACTER DRAWING
// ════════════════════════════════════════════════════════
function drawCharacter(ctx, spriteName, x, y, direction, frame, isMoving, scale = 0.5) {
  const img = getImg(spriteName);
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const meta = getMeta(spriteName);
  const fw = meta.w, fh = meta.h;
  const nFrames = meta.frames;
  const animFrame = isMoving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;
  const drawW = fw * SCALE * scale;
  const drawH = fh * SCALE * scale;
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
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
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
  ctx.ellipse(cx, cy - 1, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const idleSprite = 'shorthair_idle_strip9';
  const walkSprite = 'shorthair_walk_strip8';
  drawCharacter(ctx, laurent.moving ? walkSprite : idleSprite, cx, cy, laurent.direction, frame, laurent.moving);

  // Name label
  ctx.font = 'bold 9px monospace';
  const name = 'Laurent';
  const nameW = ctx.measureText(name).width + 10;
  ctx.fillStyle = 'rgba(0,60,120,0.8)';
  ctx.fillRect(cx - nameW / 2, cy - 50, nameW, 14);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, cy - 39);

  // Quest indicator
  if (quests.needsTalk) {
    const bounce = Math.sin(frame * 0.12) * 5;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('!', cx, cy - 62 + bounce);
  }

  // Expression
  const exprImg = getImg('expression_chat');
  if (exprImg && quests.needsTalk) {
    ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height, cx + 12, cy - 58, 16, 16);
  }

  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// TILE LAYERS (from GameMaker Room1 data)
// ════════════════════════════════════════════════════════
const assets2Sorted = placedAssets.filter(a => a.layer === 'Assets_2').sort((a, b) => a.y - b.y);
const assets1Sorted = placedAssets.filter(a => a.layer === 'Assets_1').sort((a, b) => a.y - b.y);
const tilesBefore2 = ['sea', 'clouds_02', 'land', 'paths', 'shadows', 'decoration_01'];
const tilesBetween = ['forest', 'building', 'walls', 'decoration_02', 'decoration_03'];
const tilesAfter1 = ['cloud_shadow', 'clouds_01'];

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
// WORLD OBJECTS (trees, rocks with real sprites)
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
          sx - 16 + shake, sy - 32, meta.w * SCALE, meta.h * SCALE);
      } else {
        ctx.fillStyle = '#5b3a1a';
        ctx.fillRect(sx + 12 + shake, sy + 10, 8, 20);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx + 16 + shake, sy + 4, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'rock') {
      const oreImg = getImg('spr_deco_ore_stone');
      if (oreImg) {
        const meta = getMeta('spr_deco_ore_stone');
        ctx.drawImage(oreImg, 0, 0, meta.w, meta.h,
          sx - 4 + shake, sy + 4, meta.w * SCALE, meta.h * SCALE);
      } else {
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.ellipse(sx + 16 + shake, sy + 20, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.ellipse(sx + 14 + shake, sy + 17, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (frame % 60 < 10) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 20 + shake, sy + 15, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// BUILDING PLOT (house construction stages)
// ════════════════════════════════════════════════════════
function renderBuildingPlot(ctx, camX, camY, houseStage, frame) {
  const px = BUILD_PLOT.x * RS - camX;
  const py = BUILD_PLOT.y * RS - camY;
  const w = BUILD_PLOT.w * RS;
  const h = BUILD_PLOT.h * RS;

  if (houseStage === 0) {
    // Empty plot - dashed outline
    ctx.strokeStyle = '#c7b777';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(px + 4, py + 4, w - 8, h - 8);
    ctx.setLineDash([]);
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    const pulse = 0.5 + Math.sin(frame * 0.06) * 0.3;
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
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(px + 12, py + h - RS * 1.6, 8, RS * 1.2);
    ctx.fillRect(px + w - 20, py + h - RS * 1.6, 8, RS * 1.2);
  } else if (houseStage === 2) {
    // Walls
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(px + 10, py + h - RS * 1.2, w - 20, RS * 0.8);
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + w / 2 - 14, py + h - RS * 2.2, 28, RS * 1.4);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(px + RS, py + RS * 1.2, 20, 16);
    ctx.fillRect(px + w - RS - 20, py + RS * 1.2, 20, 16);
  } else if (houseStage >= 3) {
    // Complete house
    ctx.fillStyle = '#c9a96e';
    ctx.fillRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 10, py + RS * 0.8, w - 20, h - RS * 2);
    // Roof
    ctx.fillStyle = '#8B2020';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + RS * 0.9);
    ctx.lineTo(px + w / 2, py - RS * 0.2);
    ctx.lineTo(px + w - 4, py + RS * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a1515'; ctx.stroke();
    // Door
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(px + w / 2 - 14, py + h - RS * 2.2, 28, RS * 1.4);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + w / 2 + 8, py + h - RS * 1.5, 3, 0, Math.PI * 2);
    ctx.fill();
    // Windows with warm glow
    const glow = 0.6 + Math.sin(frame * 0.05) * 0.3;
    ctx.fillStyle = `rgba(255, 200, 100, ${glow})`;
    ctx.fillRect(px + RS, py + RS * 1.2, 20, 16);
    ctx.fillRect(px + w - RS - 20, py + RS * 1.2, 20, 16);
    // Chimney + smoke
    ctx.fillStyle = '#666';
    ctx.fillRect(px + w * 0.7, py - RS * 0.1, 12, RS * 0.5);
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
  }
}

// ════════════════════════════════════════════════════════
// WORLD RENDER (main scene)
// ════════════════════════════════════════════════════════
export function renderWorld(ctx, canvas, state) {
  const { player, laurent, quests, inventory, worldObjects, houseStage, frame } = state;

  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  // Background (ocean blue)
  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tile layers (back)
  for (const name of tilesBefore2) renderTileLayer(ctx, name, camX, camY);
  for (const asset of assets2Sorted) drawSprite(ctx, asset, camX, camY, frame);
  for (const name of tilesBetween) renderTileLayer(ctx, name, camX, camY);

  // Building plot / house
  renderBuildingPlot(ctx, camX, camY, houseStage, frame);

  // Y-sorted entities: Assets_1 sprites + player + Laurent + world objects
  const entities = [];
  for (const asset of assets1Sorted) entities.push({ type: 'asset', y: asset.y, data: asset });
  entities.push({ type: 'player', y: player.y, data: player });
  entities.push({ type: 'laurent', y: laurent.y, data: laurent });
  for (const obj of worldObjects) {
    if (obj.alive) entities.push({ type: 'obj', y: obj.y, data: obj });
  }
  entities.sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.type === 'asset') drawSprite(ctx, e.data, camX, camY, frame);
    else if (e.type === 'player') renderPlayer(ctx, e.data, camX, camY, frame);
    else if (e.type === 'laurent') renderLaurent(ctx, e.data, camX, camY, frame, quests);
    else if (e.type === 'obj') renderWorldObjects(ctx, [e.data], camX, camY, frame);
  }

  // Top tile layers (clouds)
  for (const name of tilesAfter1) renderTileLayer(ctx, name, camX, camY);

  return { camX, camY };
}

// ════════════════════════════════════════════════════════
// QUEST DIALOGUE
// ════════════════════════════════════════════════════════
export function renderQuestDialogue(ctx, canvas, quests) {
  if (!quests.showingDialogue) return;

  const boxW = Math.min(600, canvas.width - 40);
  const boxH = 100;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = canvas.height - boxH - 50;

  ctx.fillStyle = 'rgba(15, 10, 25, 0.92)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#4FC3F7'; ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  // Name
  const name = 'Laurent';
  ctx.font = 'bold 13px monospace';
  const nameW = ctx.measureText(name).width + 16;
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(boxX + 16, boxY - 12, nameW, 20);
  ctx.fillStyle = '#0f0a19';
  ctx.fillText(name, boxX + 24, boxY + 3);

  // Expression
  const exprImg = getImg('expression_chat');
  if (exprImg) {
    ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height, boxX + boxW - 50, boxY - 24, 32, 32);
  }

  // Text with word wrap
  ctx.fillStyle = '#e8f4fd'; ctx.font = '12px monospace';
  const maxLineW = boxW - 40;
  const words = quests.displayText.split(' ');
  let line = '', ly = boxY + 30;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxLineW) {
      ctx.fillText(line, boxX + 20, ly);
      line = word; ly += 18;
    } else { line = test; }
  }
  ctx.fillText(line, boxX + 20, ly);

  // Continue arrow
  const fullLine = quests.dialogueLines[quests.dialogueIdx] || '';
  if (quests.charIdx >= fullLine.length && Math.sin(Date.now() * 0.005) > 0) {
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - 30, boxY + boxH - 20);
    ctx.lineTo(boxX + boxW - 24, boxY + boxH - 12);
    ctx.lineTo(boxX + boxW - 18, boxY + boxH - 20);
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
  ctx.fillRect(0, 0, canvas.width, 44);

  // Title
  ctx.fillStyle = '#4FC3F7'; ctx.font = 'bold 12px monospace';
  ctx.fillText('VDX QUEST', 12, 16);
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
  ctx.fillText('Village 1', 12, 32);

  // Quest objective (center)
  const quest = getCurrentQuest(quests);
  if (quest) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(quest.title, canvas.width / 2, 15);
    ctx.fillStyle = '#e8f4fd'; ctx.font = '10px monospace';
    const progress = getObjectiveProgress(quests, inventory, houseStage);
    ctx.fillText(progress, canvas.width / 2, 32);
    ctx.textAlign = 'left';
  }

  // Tool bar (top right)
  const toolBarX = canvas.width - 10 - inventory.tools.length * 33;
  for (let i = 0; i < inventory.tools.length; i++) {
    const sx = toolBarX + i * 33;
    const sy = 6;
    const slotW = 30;
    const sel = i === inventory.selectedTool;
    ctx.fillStyle = sel ? 'rgba(79,195,247,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx, sy, slotW, slotW);
    ctx.strokeStyle = sel ? '#4FC3F7' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, slotW, slotW);

    const toolDef = TOOLS[inventory.tools[i]];
    if (toolDef) {
      const img = getImg(toolDef.icon);
      if (img) ctx.drawImage(img, 0, 0, img.width, img.height, sx + 5, sy + 3, slotW - 10, slotW - 10);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '8px monospace';
    ctx.fillText(`${i + 1}`, sx + 2, sy + 10);

    if (sel) {
      ctx.fillStyle = '#4FC3F7'; ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(toolDef?.name || '', sx + slotW / 2, sy + slotW + 10);
      ctx.textAlign = 'left';
    }
  }

  // Resource counts (below tools)
  const resX = toolBarX;
  const resY = 42;
  const woodCount = inventory.items.find(s => s.type === 'wood')?.count || 0;
  const rockCount = inventory.items.find(s => s.type === 'rock')?.count || 0;

  const woodImg = getImg('wood');
  if (woodImg) ctx.drawImage(woodImg, 0, 0, woodImg.width, woodImg.height, resX, resY, 16, 16);
  ctx.fillStyle = '#c9a96e'; ctx.font = 'bold 10px monospace';
  ctx.fillText(`${woodCount}`, resX + 20, resY + 13);

  const rockImg = getImg('rock');
  if (rockImg) ctx.drawImage(rockImg, 0, 0, rockImg.width, rockImg.height, resX + 50, resY, 16, 16);
  ctx.fillStyle = '#999';
  ctx.fillText(`${rockCount}`, resX + 70, resY + 13);

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.fillStyle = '#888'; ctx.font = '9px monospace';
  ctx.fillText('Fleches/ZQSD=deplacer | ESPACE=agir | 1-2=outil | Shift=courir', 12, canvas.height - 8);

  // Notifications
  if (notifications && notifications.length > 0) {
    let ny = canvas.height - 60;
    for (let i = notifications.length - 1; i >= 0; i--) {
      const n = notifications[i];
      const alpha = Math.max(0, 1 - n.age / n.duration);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.font = '11px monospace';
      const tw = ctx.measureText(n.text).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(canvas.width / 2 - tw / 2, ny - 8, tw, 22);
      ctx.fillStyle = n.color || '#c7b777';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, canvas.width / 2, ny + 8);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ny -= 26;
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
    const sy = laurent.y * SCALE - camY - 10;
    drawPrompt(ctx, sx, sy, 'ESPACE - Parler a Laurent');
    return;
  }

  // Near building plot
  const ptx = Math.round(player.x / TILE);
  const pty = Math.round(player.y / TILE);
  const bp = BUILD_PLOT;
  if (ptx >= bp.x - 1 && ptx <= bp.x + bp.w && pty >= bp.y - 1 && pty <= bp.y + bp.h && houseStage < 4) {
    const bpx = (bp.x + bp.w / 2) * RS - camX;
    const bpy = bp.y * RS - camY - 10;
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
        const sy = obj.y * SCALE - camY - 10;
        drawPrompt(ctx, sx, sy, `ESPACE - ${obj.type === 'tree' ? 'Couper' : 'Miner'}`);
        return;
      }
    }
  }
}

function drawPrompt(ctx, cx, cy, text) {
  ctx.font = 'bold 10px monospace';
  const tw = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(cx - tw / 2, cy - 4, tw, 22);
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2, cy - 4, tw, 22);
  ctx.fillStyle = '#4FC3F7';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 11);
  ctx.textAlign = 'left';
}
