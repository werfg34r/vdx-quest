// ═══════════════════════════════════════════════════════
// RENDERER - All drawing code
// ═══════════════════════════════════════════════════════
import {
  TILE, SCALE, RS, ROOM_W, ROOM_H, MODE, INT_W, INT_H, HOUSES,
  TOOLS, ITEM_TYPES, SHOP_ITEMS,
  DAWN_START, DAY_START, DUSK_START, NIGHT_START,
} from './constants.js';
import { getImg, getMeta } from './assets.js';
import { tileLayers, placedAssets } from './maps.js';
import { interiorMap, INTERIOR_BLOCKED } from './player.js';

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
// SPRITE DRAWING
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

function renderPlayer(ctx, player, camX, camY, frame, mode) {
  let sx, sy;
  if (mode === MODE.INTERIOR) {
    sx = player.screenX;
    sy = player.screenY;
  } else {
    sx = player.x * SCALE - camX;
    sy = player.y * SCALE - camY;
  }
  const cx = sx + RS / 2;
  const cy = sy + RS;

  // Invulnerability blink
  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const spriteName = player.actionSprite || (player.moving ? 'spr_walking' : 'spr_idle');
  drawCharacter(ctx, spriteName, cx, cy, player.direction, frame, player.moving);
}

function renderNPC(ctx, npc, camX, camY, frame) {
  const sx = npc.currentX * SCALE - camX;
  const sy = npc.currentY * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;
  if (cx < -100 || cy < -100 || cx > ctx.canvas.width + 100 || cy > ctx.canvas.height + 100) return;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const idleSprite = `${npc.hair}_idle_strip9`;
  const walkSprite = `${npc.hair}_walk_strip8`;
  drawCharacter(ctx, npc.moving ? walkSprite : idleSprite, cx, cy, npc.direction, frame, npc.moving);

  // Name label
  ctx.font = 'bold 9px monospace';
  const nameW = ctx.measureText(npc.name).width + 10;
  ctx.fillStyle = npc.isShop ? 'rgba(80,60,0,0.8)' : 'rgba(0,0,0,0.6)';
  ctx.fillRect(cx - nameW / 2, cy - 50, nameW, 14);
  ctx.fillStyle = npc.isShop ? '#FFD700' : '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, cx, cy - 39);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// TILE LAYERS
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

// House door markers
function renderHouseMarkers(ctx, camX, camY, frame) {
  for (const h of HOUSES) {
    const dx = h.doorX * TILE * SCALE - camX;
    const dy = h.doorY * TILE * SCALE - camY;
    if (dx < -100 || dx > ctx.canvas.width + 100 || dy < -100 || dy > ctx.canvas.height + 100) continue;

    const pulse = 0.5 + Math.sin(frame * 0.08) * 0.3;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.25})`;
    ctx.fillRect(dx - RS / 2, dy - RS, RS * 2, RS);

    const bounce = Math.sin(frame * 0.1) * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(dx + RS / 2, dy - RS - 10 + bounce);
    ctx.lineTo(dx + RS / 2 - 6, dy - RS - 20 + bounce);
    ctx.lineTo(dx + RS / 2 + 6, dy - RS - 20 + bounce);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9px monospace';
    const nameW = ctx.measureText(h.name).width + 12;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(dx + RS / 2 - nameW / 2, dy - RS - 32, nameW, 14);
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(h.name, dx + RS / 2, dy - RS - 21);
    ctx.textAlign = 'left';
  }
}

// ════════════════════════════════════════════════════════
// WORLD RENDER
// ════════════════════════════════════════════════════════
export function renderWorld(ctx, canvas, player, npcs, frame) {
  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const name of tilesBefore2) renderTileLayer(ctx, name, camX, camY);
  for (const asset of assets2Sorted) drawSprite(ctx, asset, camX, camY, frame);
  for (const name of tilesBetween) renderTileLayer(ctx, name, camX, camY);

  // Y-sorted entities
  const entities = [];
  for (const asset of assets1Sorted) entities.push({ type: 'asset', y: asset.y, data: asset });
  entities.push({ type: 'player', y: player.y, data: player });
  for (const npc of npcs) entities.push({ type: 'npc', y: npc.currentY, data: npc });
  entities.sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.type === 'asset') drawSprite(ctx, e.data, camX, camY, frame);
    else if (e.type === 'player') renderPlayer(ctx, e.data, camX, camY, frame, MODE.WORLD);
    else if (e.type === 'npc') renderNPC(ctx, e.data, camX, camY, frame);
  }

  renderHouseMarkers(ctx, camX, camY, frame);
  for (const name of tilesAfter1) renderTileLayer(ctx, name, camX, camY);

  return { cameraX: camX, cameraY: camY };
}

// ════════════════════════════════════════════════════════
// ENEMIES
// ════════════════════════════════════════════════════════
export function renderEnemies(ctx, enemies, camX, camY, frame) {
  for (const e of enemies) {
    if (e.state === 'dead') continue;
    const sx = e.x * SCALE - camX;
    const sy = e.y * SCALE - camY;
    const cx = sx + RS / 2;
    const cy = sy + RS;
    if (cx < -100 || cy < -100 || cx > ctx.canvas.width + 100 || cy > ctx.canvas.height + 100) continue;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pick sprite
    let spriteName = 'skeleton_idle_strip6';
    if (e.state === 'dying') spriteName = 'skeleton_death_strip10';
    else if (e.state === 'hurt') spriteName = 'skeleton_hurt_strip7';
    else if (e.state === 'attack') spriteName = 'skeleton_attack_strip7';
    else if (e.moving) spriteName = 'skeleton_walk_strip8';

    const img = getImg(spriteName);
    if (!img) continue;
    const meta = getMeta(spriteName);
    const fw = meta.w, fh = meta.h;
    const nFrames = meta.frames;
    const speed = e.state === 'dying' ? 6 : e.state === 'attack' ? 4 : 8;
    const animFrame = Math.floor(frame / speed) % nFrames;

    const drawScale = SCALE * 0.9;
    const dw = fw * drawScale;
    const dh = fh * drawScale;

    ctx.save();
    ctx.translate(cx, cy);
    if (e.direction === 'left') ctx.scale(-1, 1);
    ctx.drawImage(img, animFrame * fw, 0, fw, fh, -dw / 2, -dh, dw, dh);
    ctx.restore();

    // HP bar
    if (e.hp < e.maxHp && e.state !== 'dying') {
      const barW = 24;
      const barH = 3;
      const bx = cx - barW / 2;
      const by = cy - dh - 6;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
    }
  }
}

// ════════════════════════════════════════════════════════
// WORLD OBJECTS (trees, rocks, fishing spots)
// ════════════════════════════════════════════════════════
export function renderWorldObjects(ctx, objects, camX, camY, frame) {
  for (const obj of objects) {
    if (!obj.alive) continue;
    const sx = obj.x * SCALE - camX;
    const sy = obj.y * SCALE - camY;
    if (sx < -100 || sy < -100 || sx > ctx.canvas.width + 100 || sy > ctx.canvas.height + 100) continue;

    const shake = obj.shakeTimer > 0 ? Math.sin(obj.shakeTimer * 1.5) * 3 : 0;

    if (obj.type === 'tree') {
      // Draw tree using decoration sprite or fallback
      const treeImg = getImg('spr_deco_tree_01');
      if (treeImg) {
        const meta = getMeta('spr_deco_tree_01');
        const animFrame = Math.floor(frame / 12) % meta.frames;
        ctx.drawImage(treeImg, animFrame * meta.w, 0, meta.w, meta.h,
          sx - 16 + shake, sy - 32, meta.w * SCALE, meta.h * SCALE);
      } else {
        // Fallback tree shape
        ctx.fillStyle = '#5b3a1a';
        ctx.fillRect(sx + 12 + shake, sy + 10, 8, 20);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx + 16 + shake, sy + 4, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'rock') {
      // Draw rock
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(sx + 16 + shake, sy + 20, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.ellipse(sx + 14 + shake, sy + 17, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Ore sparkle
      if (frame % 60 < 10) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 20 + shake, sy + 15, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'fishing') {
      // Fish splash indicator
      const pulse = Math.sin(frame * 0.1) * 3;
      ctx.fillStyle = 'rgba(100,180,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 16 + pulse, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('~', sx + 16, sy + 12 + pulse);
      ctx.textAlign = 'left';
    }
  }
}

// ════════════════════════════════════════════════════════
// FARM PLOTS
// ════════════════════════════════════════════════════════
export function renderFarmPlots(ctx, plots, camX, camY, frame) {
  for (const plot of plots) {
    const sx = plot.x * SCALE - camX;
    const sy = plot.y * SCALE - camY;
    if (sx < -100 || sy < -100 || sx > ctx.canvas.width + 100 || sy > ctx.canvas.height + 100) continue;

    if (plot.state === 'empty') {
      // Empty plot marker
      ctx.strokeStyle = 'rgba(139,94,60,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 2, sy + 2, RS - 4, RS - 4);
      ctx.setLineDash([]);
    } else if (plot.state === 'tilled') {
      // Tilled soil
      const soilImg = getImg('soil_01');
      if (soilImg) {
        ctx.drawImage(soilImg, 0, 0, soilImg.width, soilImg.height, sx + 4, sy + 8, RS - 8, RS - 12);
      } else {
        ctx.fillStyle = '#6b3e1c';
        ctx.fillRect(sx + 4, sy + 8, RS - 8, RS - 12);
      }
    } else if (plot.state === 'planted' || plot.state === 'harvestable') {
      // Soil base
      const soilKey = plot.watered ? 'soil_04' : 'soil_01';
      const soilImg = getImg(soilKey);
      if (soilImg) {
        ctx.drawImage(soilImg, 0, 0, soilImg.width, soilImg.height, sx + 4, sy + 8, RS - 8, RS - 12);
      } else {
        ctx.fillStyle = plot.watered ? '#4a2810' : '#6b3e1c';
        ctx.fillRect(sx + 4, sy + 8, RS - 8, RS - 12);
      }

      // Crop sprite
      const cropSprite = `${plot.cropType}_0${plot.stage}`;
      const cropImg = getImg(cropSprite);
      if (cropImg) {
        const cm = getMeta(cropSprite);
        ctx.drawImage(cropImg, 0, 0, cm.w, cm.h, sx + 6, sy + 2, RS - 12, RS - 8);
      }

      // Harvestable glow
      if (plot.state === 'harvestable') {
        const pulse = 0.3 + Math.sin(frame * 0.08) * 0.2;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.fillRect(sx + 2, sy + 2, RS - 4, RS - 4);
      }

      // Water drop indicator
      if (plot.watered && plot.state === 'planted' && plot.stage < 5) {
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(sx + RS - 6, sy + 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// DAY/NIGHT
// ════════════════════════════════════════════════════════
export function renderDayNight(ctx, canvas, gameTime) {
  const h = gameTime.hour + gameTime.minute / 60;
  let alpha = 0;
  let r = 0, g = 0, b = 30;

  if (h >= NIGHT_START || h < DAWN_START) {
    // Night
    alpha = 0.45;
    r = 10; g = 10; b = 40;
  } else if (h >= DAWN_START && h < DAY_START) {
    // Dawn transition
    const t = (h - DAWN_START) / (DAY_START - DAWN_START);
    alpha = 0.45 * (1 - t);
    r = Math.floor(30 * (1 - t)); g = Math.floor(10 * (1 - t)); b = Math.floor(40 * (1 - t));
  } else if (h >= DUSK_START && h < NIGHT_START) {
    // Dusk transition
    const t = (h - DUSK_START) / (NIGHT_START - DUSK_START);
    alpha = 0.45 * t;
    r = Math.floor(40 * t); g = Math.floor(15 * t); b = Math.floor(30 * t);
  }

  if (alpha > 0.01) {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ════════════════════════════════════════════════════════
// DIALOGUE BOX
// ════════════════════════════════════════════════════════
export function renderDialogue(ctx, canvas, dialogueState) {
  if (!dialogueState.active) return;
  const boxW = Math.min(600, canvas.width - 40);
  const boxH = 100;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = canvas.height - boxH - 50;

  ctx.fillStyle = 'rgba(15, 10, 25, 0.92)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  const name = dialogueState.npc?.name || '???';
  ctx.font = 'bold 13px monospace';
  const nameW = ctx.measureText(name).width + 16;
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(boxX + 16, boxY - 12, nameW, 20);
  ctx.fillStyle = '#0f0a19';
  ctx.fillText(name, boxX + 24, boxY + 3);

  if (dialogueState.npc?.expression) {
    const exprImg = getImg(dialogueState.npc.expression);
    if (exprImg) {
      ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height, boxX + boxW - 50, boxY - 24, 32, 32);
    }
  }

  ctx.fillStyle = '#f0ead0'; ctx.font = '12px monospace';
  const maxLineW = boxW - 40;
  const words = dialogueState.text.split(' ');
  let line = '', ly = boxY + 30;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxLineW) {
      ctx.fillText(line, boxX + 20, ly);
      line = word; ly += 18;
    } else { line = test; }
  }
  ctx.fillText(line, boxX + 20, ly);

  if (dialogueState.charIdx >= dialogueState.fullText.length) {
    if (Math.sin(Date.now() * 0.005) > 0) {
      ctx.fillStyle = '#c7b777';
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - 30, boxY + boxH - 20);
      ctx.lineTo(boxX + boxW - 24, boxY + boxH - 12);
      ctx.lineTo(boxX + boxW - 18, boxY + boxH - 20);
      ctx.closePath(); ctx.fill();
    }
  }
}

// ════════════════════════════════════════════════════════
// SHOP UI
// ════════════════════════════════════════════════════════
export function renderShop(ctx, canvas, dialogue, inventory, player) {
  const panelW = 380;
  const panelH = 320;
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  // Background
  ctx.fillStyle = 'rgba(15, 10, 25, 0.95)';
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 2;
  ctx.strokeRect(px + 2, py + 2, panelW - 4, panelH - 4);

  // Title
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOUTIQUE DE SOPHIE', px + panelW / 2, py + 22);

  // Gold display
  ctx.fillStyle = '#FFD700'; ctx.font = '12px monospace';
  ctx.fillText(`Or: ${player.gold}G`, px + panelW / 2, py + 40);

  // Tabs
  const tabY = py + 50;
  const tabW = panelW / 2 - 10;
  ctx.fillStyle = dialogue.shopTab === 'buy' ? 'rgba(199,183,119,0.3)' : 'rgba(255,255,255,0.05)';
  ctx.fillRect(px + 6, tabY, tabW, 22);
  ctx.fillStyle = dialogue.shopTab === 'sell' ? 'rgba(199,183,119,0.3)' : 'rgba(255,255,255,0.05)';
  ctx.fillRect(px + panelW / 2 + 4, tabY, tabW, 22);
  ctx.fillStyle = '#c7b777'; ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ACHETER (Tab)', px + 6 + tabW / 2, tabY + 15);
  ctx.fillText('VENDRE (Tab)', px + panelW / 2 + 4 + tabW / 2, tabY + 15);

  // Items list
  const listY = tabY + 30;
  const rowH = 28;

  if (dialogue.shopTab === 'buy') {
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const item = SHOP_ITEMS[i];
      const iy = listY + i * rowH;
      const selected = i === dialogue.shopCursor;
      ctx.fillStyle = selected ? 'rgba(199,183,119,0.2)' : 'transparent';
      ctx.fillRect(px + 8, iy, panelW - 16, rowH - 2);

      // Icon
      const iconImg = getImg(item.icon);
      if (iconImg) ctx.drawImage(iconImg, 0, 0, iconImg.width, iconImg.height, px + 14, iy + 3, 20, 20);

      ctx.fillStyle = selected ? '#FFD700' : '#f0ead0';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, px + 40, iy + 17);

      const canAfford = player.gold >= item.price;
      ctx.fillStyle = canAfford ? '#FFD700' : '#f44336';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.price}G`, px + panelW - 14, iy + 17);
    }
  } else {
    // Sell tab
    if (inventory.items.length === 0) {
      ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Rien a vendre', px + panelW / 2, listY + 30);
    } else {
      for (let i = 0; i < inventory.items.length; i++) {
        const slot = inventory.items[i];
        const def = ITEM_TYPES[slot.type];
        if (!def) continue;
        const iy = listY + i * rowH;
        const selected = i === dialogue.shopCursor;
        ctx.fillStyle = selected ? 'rgba(199,183,119,0.2)' : 'transparent';
        ctx.fillRect(px + 8, iy, panelW - 16, rowH - 2);

        const iconImg = getImg(def.icon);
        if (iconImg) ctx.drawImage(iconImg, 0, 0, iconImg.width, iconImg.height, px + 14, iy + 3, 20, 20);

        ctx.fillStyle = selected ? '#FFD700' : '#f0ead0';
        ctx.font = '11px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${def.name} x${slot.count}`, px + 40, iy + 17);

        ctx.fillStyle = '#4CAF50'; ctx.textAlign = 'right';
        ctx.fillText(`${(def.sellPrice || 0) * slot.count}G`, px + panelW - 14, iy + 17);
      }
    }
  }

  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Fleches=naviguer | ESPACE=confirmer | Tab=onglet | Echap=fermer', px + panelW / 2, py + panelH - 8);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════
export function renderInventory(ctx, canvas, inventory) {
  if (!inventory.open) return;

  const panelW = 340;
  const panelH = 280;
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  ctx.fillStyle = 'rgba(15, 10, 25, 0.95)';
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 2;
  ctx.strokeRect(px + 2, py + 2, panelW - 4, panelH - 4);

  ctx.fillStyle = '#c7b777'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
  ctx.fillText('INVENTAIRE', px + panelW / 2, py + 22);

  // Tools section
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
  ctx.fillText('Outils (1-' + inventory.tools.length + ')', px + panelW / 2, py + 42);

  const toolSlotSize = 36;
  const toolsStartX = px + (panelW - inventory.tools.length * (toolSlotSize + 4)) / 2;
  for (let i = 0; i < inventory.tools.length; i++) {
    const sx = toolsStartX + i * (toolSlotSize + 4);
    const sy = py + 50;
    ctx.fillStyle = i === inventory.selectedTool ? 'rgba(199,183,119,0.3)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx, sy, toolSlotSize, toolSlotSize);
    ctx.strokeStyle = i === inventory.selectedTool ? '#c7b777' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, toolSlotSize, toolSlotSize);

    const toolDef = TOOLS[inventory.tools[i]];
    if (toolDef) {
      const toolImg = getImg(toolDef.icon);
      if (toolImg) {
        ctx.drawImage(toolImg, 0, 0, toolImg.width, toolImg.height, sx + 6, sy + 4, toolSlotSize - 12, toolSlotSize - 12);
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, sx + toolSlotSize / 2, sy + toolSlotSize - 2);
  }

  // Items section
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Objets', px + panelW / 2, py + 105);

  const itemSlotSize = 40;
  const cols = 6;
  const itemsStartX = px + (panelW - cols * (itemSlotSize + 4)) / 2;
  const itemsStartY = py + 114;

  for (let i = 0; i < 12; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const sx = itemsStartX + c * (itemSlotSize + 4);
    const sy = itemsStartY + r * (itemSlotSize + 4);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(sx, sy, itemSlotSize, itemSlotSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, itemSlotSize, itemSlotSize);

    const slot = inventory.items[i];
    if (slot) {
      const def = ITEM_TYPES[slot.type];
      if (def) {
        const itemImg = getImg(def.icon);
        if (itemImg) {
          ctx.drawImage(itemImg, 0, 0, itemImg.width, itemImg.height, sx + 6, sy + 4, itemSlotSize - 12, itemSlotSize - 12);
        }
        if (slot.count > 1) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'right';
          ctx.fillText(`${slot.count}`, sx + itemSlotSize - 3, sy + itemSlotSize - 3);
        }
      }
    }
  }

  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('I = fermer | 1-6 = selectionner outil', px + panelW / 2, py + panelH - 10);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════════════════
export function renderHUD(ctx, canvas, mode, house, inventory, player, gameTime, notifications) {
  // Top bar background
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, 44);

  // Game title + location
  ctx.fillStyle = '#c7b777'; ctx.font = 'bold 12px monospace';
  ctx.fillText('SUNNYSIDE WORLD', 12, 16);
  const loc = mode === MODE.WORLD ? 'Village' : (house?.name || 'Interieur');
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
  ctx.fillText(loc, 12, 32);

  // Time display
  const hh = String(Math.floor(gameTime.hour)).padStart(2, '0');
  const mm = String(Math.floor(gameTime.minute)).padStart(2, '0');
  const isNight = gameTime.hour >= NIGHT_START || gameTime.hour < DAWN_START;
  ctx.fillStyle = isNight ? '#7986CB' : '#FFD700';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${isNight ? 'Nuit' : 'Jour'} ${gameTime.day}  ${hh}:${mm}`, canvas.width / 2, 16);
  ctx.textAlign = 'left';

  // HP bar
  const barX = 160;
  const barW = 80;
  ctx.fillStyle = '#333'; ctx.fillRect(barX, 6, barW, 8);
  ctx.fillStyle = player.hp > 30 ? '#4CAF50' : '#f44336';
  ctx.fillRect(barX, 6, barW * (player.hp / player.maxHp), 8);
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(barX, 6, barW, 8);
  ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
  ctx.fillText(`PV ${Math.ceil(player.hp)}/${player.maxHp}`, barX + 2, 13);

  // Stamina bar
  ctx.fillStyle = '#333'; ctx.fillRect(barX, 18, barW, 8);
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(barX, 18, barW * (player.stamina / player.maxStamina), 8);
  ctx.strokeStyle = '#666'; ctx.strokeRect(barX, 18, barW, 8);
  ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
  ctx.fillText(`EN ${Math.ceil(player.stamina)}/${player.maxStamina}`, barX + 2, 25);

  // Gold
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 11px monospace';
  ctx.fillText(`${player.gold}G`, barX, 38);

  // Tool bar (top right)
  const toolBarX = canvas.width - 10 - inventory.tools.length * 33;
  for (let i = 0; i < inventory.tools.length; i++) {
    const sx = toolBarX + i * 33;
    const sy = 6;
    const slotW = 30;
    const sel = i === inventory.selectedTool;
    ctx.fillStyle = sel ? 'rgba(199,183,119,0.5)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx, sy, slotW, slotW);
    ctx.strokeStyle = sel ? '#c7b777' : 'rgba(255,255,255,0.2)';
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
      ctx.fillStyle = '#c7b777'; ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(toolDef?.name || '', sx + slotW / 2, sy + slotW + 10);
      ctx.textAlign = 'left';
    }
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.fillStyle = '#888'; ctx.font = '9px monospace';
  ctx.fillText('Fleches/ZQSD=deplacer | ESPACE=agir | 1-6=outil | I=inventaire | Shift=courir', 12, canvas.height - 8);

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
// DEATH SCREEN
// ════════════════════════════════════════════════════════
export function renderDeathScreen(ctx, canvas, player) {
  const alpha = Math.min(0.8, player.deathTimer / 60);
  ctx.fillStyle = `rgba(80, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (player.deathTimer > 30) {
    ctx.fillStyle = '#f44336'; ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOUS ETES MORT', canvas.width / 2, canvas.height / 2 - 20);

    if (player.deathTimer > 60) {
      ctx.fillStyle = '#ccc'; ctx.font = '14px monospace';
      ctx.fillText('Appuyez sur ESPACE pour reapparaitre', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillStyle = '#f44336'; ctx.font = '11px monospace';
      ctx.fillText('(-20G)', canvas.width / 2, canvas.height / 2 + 44);
    }
    ctx.textAlign = 'left';
  }
}

// ════════════════════════════════════════════════════════
// INTERIOR RENDER
// ════════════════════════════════════════════════════════
const WALL_COLORS = {
  red:   { base: '#6a2020', light: '#8a3535' },
  green: { base: '#1a5a2a', light: '#2a7a3a' },
  blue:  { base: '#1a3a6a', light: '#2a5a8a' },
};

export function renderInterior(ctx, canvas, player, house, frame) {
  const oX = (canvas.width - INT_W * RS) / 2;
  const oY = (canvas.height - INT_H * RS) / 2;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const wc = WALL_COLORS[house?.style] || WALL_COLORS.red;

  for (let row = 0; row < INT_H; row++) {
    for (let col = 0; col < INT_W; col++) {
      const tile = interiorMap[row][col];
      const x = oX + col * RS;
      const y = oY + row * RS;

      ctx.fillStyle = (col + row) % 2 === 0 ? '#c9a96e' : '#bfa060';
      ctx.fillRect(x, y, RS, RS);

      switch (tile) {
        case 0: // Wall
          ctx.fillStyle = row === 0 ? wc.base : wc.light;
          ctx.fillRect(x, y, RS, RS);
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.strokeRect(x, y, RS, RS);
          break;
        case 2: // Table
          ctx.fillStyle = '#8B5E3C';
          ctx.fillRect(x + 4, y + 8, RS - 8, RS * 0.4);
          ctx.fillStyle = '#6B3E1C';
          ctx.fillRect(x + 8, y + RS * 0.5, 3, RS * 0.4);
          ctx.fillRect(x + RS - 11, y + RS * 0.5, 3, RS * 0.4);
          break;
        case 3: // Chair
          ctx.fillStyle = '#8a6240';
          ctx.fillRect(x + 10, y + 14, RS - 20, 12);
          ctx.fillStyle = '#6a4220';
          ctx.fillRect(x + 12, y + 26, 3, RS - 30);
          ctx.fillRect(x + RS - 15, y + 26, 3, RS - 30);
          break;
        case 4: // Bed
          ctx.fillStyle = '#6B3E1C';
          ctx.fillRect(x + 3, y + 5, RS - 6, RS - 8);
          ctx.fillStyle = '#f0ead0';
          ctx.fillRect(x + 5, y + 7, RS - 10, RS - 12);
          ctx.fillStyle = '#4a7fbf';
          ctx.fillRect(x + 5, y + RS * 0.5, RS - 10, RS * 0.35);
          break;
        case 5: { // Bookshelf
          ctx.fillStyle = '#5a3018';
          ctx.fillRect(x + 3, y + 3, RS - 6, RS - 6);
          const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad'];
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(x + 6 + i * 7, y + 8, 5, 10);
            ctx.fillRect(x + 6 + i * 7, y + RS / 2 + 2, 5, 10);
          }
          break;
        }
        case 6: // Chest
          ctx.fillStyle = '#7a4e28';
          ctx.fillRect(x + 7, y + 12, RS - 14, RS - 16);
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath(); ctx.arc(x + RS / 2, y + 20, 3, 0, Math.PI * 2); ctx.fill();
          break;
        case 7: // Door
          ctx.fillStyle = '#8a6a4a';
          ctx.fillRect(x + 6, y + 4, RS - 12, RS - 6);
          ctx.fillStyle = '#c7b777';
          ctx.beginPath();
          ctx.moveTo(x + RS / 2, y + RS - 8);
          ctx.lineTo(x + RS / 2 - 6, y + RS - 16);
          ctx.lineTo(x + RS / 2 + 6, y + RS - 16);
          ctx.closePath(); ctx.fill();
          break;
        case 8: // Rug
          ctx.fillStyle = wc.light;
          ctx.fillRect(x + 3, y + 3, RS - 6, RS - 6);
          ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 5, y + 5, RS - 10, RS - 10);
          break;
        case 9: { // Fireplace
          ctx.fillStyle = '#555';
          ctx.fillRect(x + 3, y + 3, RS - 6, RS - 6);
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 8, y + 10, RS - 16, RS - 14);
          const t = frame * 0.12;
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath(); ctx.arc(x + RS / 2, y + RS / 2 + Math.sin(t) * 3, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath(); ctx.arc(x + RS / 2, y + RS / 2 - 3 + Math.sin(t) * 2, 3, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 10: // Barrel
          ctx.fillStyle = '#7a4e28';
          ctx.fillRect(x + 9, y + 5, RS - 18, RS - 10);
          ctx.fillStyle = '#888';
          ctx.fillRect(x + 10, y + 10, RS - 20, 2);
          ctx.fillRect(x + 10, y + RS - 12, RS - 20, 2);
          break;
        case 11: // Plant
          ctx.fillStyle = '#8a6a4a';
          ctx.fillRect(x + 12, y + 16, RS - 24, RS - 20);
          ctx.fillStyle = '#3d9e3d';
          ctx.beginPath(); ctx.arc(x + RS / 2, y + 10, 6, 0, Math.PI * 2); ctx.fill();
          break;
      }
    }
  }

  player.screenX = oX + player.interiorX * SCALE;
  player.screenY = oY + player.interiorY * SCALE;
  renderPlayer(ctx, player, 0, 0, frame, MODE.INTERIOR);

  const name = house?.name || 'Interieur';
  ctx.font = 'bold 14px monospace';
  const tw = ctx.measureText(name).width + 28;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(canvas.width / 2 - tw / 2, oY - 36, tw, 28);
  ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width / 2 - tw / 2, oY - 36, tw, 28);
  ctx.fillStyle = '#c7b777'; ctx.textAlign = 'center';
  ctx.fillText(name, canvas.width / 2, oY - 16);
  ctx.textAlign = 'left';

  return { offsetX: oX, offsetY: oY };
}
