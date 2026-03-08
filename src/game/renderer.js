import { TILE, SCALE, RS, MAP_W, MAP_H, ROOM_W, ROOM_H, MODE, INT_W, INT_H, HOUSES, ITEM_TYPES } from './constants.js';
import { getImg, getMeta } from './assets.js';
import { tileLayerNames, tileLayers, getTile, placedAssets } from './maps.js';
import { interiorMap, INTERIOR_BLOCKED } from './player.js';

// ════════════════════════════════════════════════════════
// TILESET DRAWING
// ════════════════════════════════════════════════════════

const TILESET_COLS = 64;
const FLIP_H = 0x10000000;
const FLIP_V = 0x20000000;
const ROTATE = 0x40000000;
const TILE_MASK = 0x0FFFFFFF;

function drawTileFromTileset(ctx, tileId, dx, dy, tileSize, renderSize, tilesetKey) {
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
    ctx.drawImage(img,
      col * tileSize, row * tileSize, tileSize, tileSize,
      -renderSize / 2, -renderSize / 2, renderSize, renderSize
    );
    ctx.restore();
  } else {
    ctx.drawImage(img,
      col * tileSize, row * tileSize, tileSize, tileSize,
      dx, dy, renderSize, renderSize
    );
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
    const animFrame = Math.floor(frame / 10) % frames;
    srcX = animFrame * w;
  }

  const dx = (asset.x - ox) * SCALE - camX;
  const dy = (asset.y - oy) * SCALE - camY;
  const dw = w * SCALE;
  const dh = h * SCALE;

  if (dx + dw < -200 || dy + dh < -200) return;
  if (dx > ctx.canvas.width + 200 || dy > ctx.canvas.height + 200) return;

  const sx = asset.scaleX;
  const sy = asset.scaleY;
  const rot = asset.rotation;

  const colour = asset.colour || 4294967295;
  const alpha = ((colour >>> 24) & 0xFF) / 255;
  const prevAlpha = ctx.globalAlpha;
  if (alpha < 1) ctx.globalAlpha = alpha;

  if (sx !== 1 || sy !== 1 || rot !== 0) {
    ctx.save();
    const pivotX = asset.x * SCALE - camX;
    const pivotY = asset.y * SCALE - camY;
    ctx.translate(pivotX, pivotY);
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
// CHARACTER DRAWING (player + NPCs)
// ════════════════════════════════════════════════════════

function drawCharacterSprite(ctx, spriteName, x, y, direction, frame, isMoving) {
  const img = getImg(spriteName);
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const meta = getMeta(spriteName);
  const fw = meta.w;
  const fh = meta.h;
  const nFrames = meta.frames;
  const animFrame = isMoving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;

  const drawW = fw * SCALE * 0.5;
  const drawH = fh * SCALE * 0.5;

  ctx.save();
  ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  const srcX = animFrame * fw;
  ctx.drawImage(img, srcX, 0, fw, fh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
}

export function renderPlayer(ctx, player, camX, camY, frame, mode) {
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player sprite (spr_idle / spr_walking / action sprites)
  const spriteName = player.actionSprite || (player.moving ? 'spr_walking' : 'spr_idle');
  drawCharacterSprite(ctx, spriteName, cx, cy, player.direction, frame, player.moving);
}

function renderNPC(ctx, npc, camX, camY, frame) {
  const sx = npc.currentX * SCALE - camX;
  const sy = npc.currentY * SCALE - camY;
  const cx = sx + RS / 2;
  const cy = sy + RS;

  // Cull off-screen
  if (cx < -100 || cy < -100 || cx > ctx.canvas.width + 100 || cy > ctx.canvas.height + 100) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // NPC sprite
  const idleSprite = `${npc.hair}_idle_strip9`;
  const walkSprite = `${npc.hair}_walk_strip8`;
  const spriteName = npc.moving ? walkSprite : idleSprite;
  drawCharacterSprite(ctx, spriteName, cx, cy, npc.direction, frame, npc.moving);

  // Name label above NPC
  ctx.font = 'bold 9px monospace';
  const nameW = ctx.measureText(npc.name).width + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(cx - nameW / 2, cy - 50, nameW, 14);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, cx, cy - 39);
  ctx.textAlign = 'left';
}

// ════════════════════════════════════════════════════════
// WORLD RENDER
// ════════════════════════════════════════════════════════

const assets2Sorted = placedAssets
  .filter(a => a.layer === 'Assets_2')
  .sort((a, b) => a.y - b.y);

const assets1Sorted = placedAssets
  .filter(a => a.layer === 'Assets_1')
  .sort((a, b) => a.y - b.y);

const tilesBefore2 = ['sea', 'clouds_02', 'land', 'paths', 'shadows', 'decoration_01'];
const tilesBetween = ['forest', 'building', 'walls', 'decoration_02', 'decoration_03'];
const tilesAfter1 = ['cloud_shadow', 'clouds_01'];

function renderTileLayer(ctx, layerName, camX, camY) {
  const layer = tileLayers[layerName];
  if (!layer || layer.nonEmpty === 0) return;

  const isForest = layerName === 'forest';
  const tileSize = isForest ? 32 : TILE;
  const renderSize = isForest ? 32 * SCALE : RS;
  const tilesetKey = isForest ? 'forest' : 'tileset';
  const gridW = layer.width;
  const gridH = layer.height;

  const sc = Math.max(0, Math.floor(camX / renderSize) - 1);
  const sr = Math.max(0, Math.floor(camY / renderSize) - 1);
  const ec = Math.min(gridW, Math.ceil((camX + ctx.canvas.width) / renderSize) + 1);
  const er = Math.min(gridH, Math.ceil((camY + ctx.canvas.height) / renderSize) + 1);

  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const tileId = layer.tiles[row * gridW + col];
      if (tileId && tileId !== 0) {
        drawTileFromTileset(ctx, tileId,
          col * renderSize - camX, row * renderSize - camY,
          tileSize, renderSize, tilesetKey);
      }
    }
  }
}

// Door markers on houses
function renderHouseMarkers(ctx, camX, camY, frame) {
  for (const h of HOUSES) {
    const doorScreenX = h.doorX * TILE * SCALE - camX;
    const doorScreenY = h.doorY * TILE * SCALE - camY;

    // Cull
    if (doorScreenX < -100 || doorScreenX > ctx.canvas.width + 100) continue;
    if (doorScreenY < -100 || doorScreenY > ctx.canvas.height + 100) continue;

    // Pulsing glow
    const pulse = 0.5 + Math.sin(frame * 0.08) * 0.3;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.35})`;
    ctx.fillRect(doorScreenX - RS / 2, doorScreenY - RS, RS * 2, RS);

    // Bouncing arrow
    const bounce = Math.sin(frame * 0.1) * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(doorScreenX + RS / 2, doorScreenY - RS - 10 + bounce);
    ctx.lineTo(doorScreenX + RS / 2 - 8, doorScreenY - RS - 22 + bounce);
    ctx.lineTo(doorScreenX + RS / 2 + 8, doorScreenY - RS - 22 + bounce);
    ctx.closePath();
    ctx.fill();

    // Name label
    ctx.font = 'bold 10px monospace';
    const nameW = ctx.measureText(h.name).width + 14;
    const lx = doorScreenX + RS / 2 - nameW / 2;
    const ly = doorScreenY - RS - 36;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(lx, ly, nameW, 16);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, nameW, 16);
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(h.name, doorScreenX + RS / 2, ly + 12);
    ctx.textAlign = 'left';
  }
}

export function renderWorld(ctx, canvas, player, npcs, frame) {
  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Back tile layers
  for (const name of tilesBefore2) renderTileLayer(ctx, name, camX, camY);

  // Assets_2 (behind buildings)
  for (const asset of assets2Sorted) drawSprite(ctx, asset, camX, camY, frame);

  // Middle tile layers
  for (const name of tilesBetween) renderTileLayer(ctx, name, camX, camY);

  // Collect all Y-sorted entities (assets1 + player + NPCs) for proper depth
  const entities = [];

  // Assets_1 sprites
  for (const asset of assets1Sorted) {
    entities.push({ type: 'asset', y: asset.y, data: asset });
  }

  // Player
  entities.push({ type: 'player', y: player.y, data: player });

  // NPCs
  for (const npc of npcs) {
    entities.push({ type: 'npc', y: npc.currentY, data: npc });
  }

  // Sort by Y for depth
  entities.sort((a, b) => a.y - b.y);

  // Render all entities in Y order
  for (const e of entities) {
    switch (e.type) {
      case 'asset':
        drawSprite(ctx, e.data, camX, camY, frame);
        break;
      case 'player':
        renderPlayer(ctx, e.data, camX, camY, frame, MODE.WORLD);
        break;
      case 'npc':
        renderNPC(ctx, e.data, camX, camY, frame);
        break;
    }
  }

  // House markers
  renderHouseMarkers(ctx, camX, camY, frame);

  // Top tile layers (clouds)
  for (const name of tilesAfter1) renderTileLayer(ctx, name, camX, camY);

  return { cameraX: camX, cameraY: camY };
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

  // Box background
  ctx.fillStyle = 'rgba(15, 10, 25, 0.92)';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Border
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  // NPC name
  const name = dialogueState.npc?.name || '???';
  ctx.font = 'bold 13px monospace';
  const nameW = ctx.measureText(name).width + 16;
  ctx.fillStyle = '#c7b777';
  ctx.fillRect(boxX + 16, boxY - 12, nameW, 20);
  ctx.fillStyle = '#0f0a19';
  ctx.fillText(name, boxX + 24, boxY + 3);

  // Expression icon
  if (dialogueState.npc?.expression) {
    const exprImg = getImg(dialogueState.npc.expression);
    if (exprImg) {
      ctx.drawImage(exprImg, 0, 0, exprImg.width, exprImg.height,
        boxX + boxW - 50, boxY - 24, 32, 32);
    }
  }

  // Dialogue text (with word wrap)
  ctx.fillStyle = '#f0ead0';
  ctx.font = '12px monospace';
  const maxLineW = boxW - 40;
  const words = dialogueState.text.split(' ');
  let line = '';
  let ly = boxY + 30;
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (ctx.measureText(testLine).width > maxLineW) {
      ctx.fillText(line, boxX + 20, ly);
      line = word;
      ly += 18;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, boxX + 20, ly);

  // Continue indicator
  if (dialogueState.charIdx >= dialogueState.fullText.length) {
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
      ctx.fillStyle = '#c7b777';
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - 30, boxY + boxH - 20);
      ctx.lineTo(boxX + boxW - 24, boxY + boxH - 12);
      ctx.lineTo(boxX + boxW - 18, boxY + boxH - 20);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// ════════════════════════════════════════════════════════
// INVENTORY UI
// ════════════════════════════════════════════════════════

export function renderInventory(ctx, canvas, inventory) {
  if (!inventory.open) return;

  const slotSize = 48;
  const cols = 6;
  const rows = 2;
  const padding = 6;
  const panelW = cols * (slotSize + padding) + padding;
  const panelH = rows * (slotSize + padding) + padding + 30;
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2;

  // Panel background
  ctx.fillStyle = 'rgba(15, 10, 25, 0.95)';
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = '#c7b777';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 2, py + 2, panelW - 4, panelH - 4);

  // Title
  ctx.fillStyle = '#c7b777';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('INVENTAIRE', px + panelW / 2, py + 20);
  ctx.textAlign = 'left';

  // Slots
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sx = px + padding + col * (slotSize + padding);
    const sy = py + 30 + row * (slotSize + padding);

    // Slot background
    ctx.fillStyle = i === inventory.selectedSlot ? 'rgba(199, 183, 119, 0.3)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx, sy, slotSize, slotSize);
    ctx.strokeStyle = i === inventory.selectedSlot ? '#c7b777' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, slotSize, slotSize);

    // Item in slot
    const slot = inventory.slots[i];
    if (slot) {
      const def = ITEM_TYPES[slot.type];
      if (def) {
        const itemImg = getImg(def.icon);
        if (itemImg) {
          ctx.drawImage(itemImg, 0, 0, itemImg.width, itemImg.height,
            sx + 8, sy + 4, slotSize - 16, slotSize - 16);
        }

        // Count
        if (slot.count > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${slot.count}`, sx + slotSize - 4, sy + slotSize - 4);
          ctx.textAlign = 'left';
        }

        // Name on hover/selected
        if (i === inventory.selectedSlot) {
          ctx.fillStyle = '#c7b777';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(def.name, px + panelW / 2, py + panelH - 6);
          ctx.textAlign = 'left';
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════════════════

export function renderHUD(ctx, canvas, mode, house, inventory, notifications) {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, 36);
  ctx.fillStyle = '#c7b777';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SUNNYSIDE WORLD', 14, 24);
  ctx.fillStyle = '#aaa';
  ctx.font = '11px monospace';
  const loc = mode === MODE.WORLD ? 'Village' : (house?.name || 'Int\u00e9rieur');
  ctx.fillText(loc, 200, 24);

  // Quick inventory bar (top right)
  const barX = canvas.width - 260;
  const barY = 6;
  const slotW = 28;
  for (let i = 0; i < Math.min(6, inventory.maxSlots); i++) {
    const sx = barX + i * (slotW + 3);
    ctx.fillStyle = i === inventory.selectedSlot ? 'rgba(199, 183, 119, 0.5)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx, barY, slotW, slotW);
    ctx.strokeStyle = i === inventory.selectedSlot ? '#c7b777' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, barY, slotW, slotW);

    const slot = inventory.slots[i];
    if (slot) {
      const def = ITEM_TYPES[slot.type];
      if (def) {
        const img = getImg(def.icon);
        if (img) {
          ctx.drawImage(img, 0, 0, img.width, img.height, sx + 4, barY + 2, slotW - 8, slotW - 8);
        }
        if (slot.count > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = '8px monospace';
          ctx.fillText(`${slot.count}`, sx + slotW - 10, barY + slotW - 2);
        }
      }
    }

    // Slot number
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px monospace';
    ctx.fillText(`${i + 1}`, sx + 2, barY + 10);
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.fillText('Fl\u00e8ches/ZQSD = d\u00e9placer | ESPACE = interagir | I = inventaire | 1-6 = s\u00e9lectionner', 14, canvas.height - 10);

  // Notifications
  if (notifications && notifications.length > 0) {
    let ny = canvas.height - 70;
    for (let i = notifications.length - 1; i >= 0; i--) {
      const n = notifications[i];
      const alpha = Math.max(0, 1 - n.age / n.duration);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.font = '11px monospace';
      const tw = ctx.measureText(n.text).width + 16;
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

      // Floor base
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
          ctx.closePath();
          ctx.fill();
          break;
        case 8: // Rug
          ctx.fillStyle = wc.light;
          ctx.fillRect(x + 3, y + 3, RS - 6, RS - 6);
          ctx.strokeStyle = '#c7b777';
          ctx.lineWidth = 1.5;
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

  // Player in interior
  player.screenX = oX + player.interiorX * SCALE;
  player.screenY = oY + player.interiorY * SCALE;
  renderPlayer(ctx, player, 0, 0, frame, MODE.INTERIOR);

  // House name header
  const name = house?.name || 'Int\u00e9rieur';
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
