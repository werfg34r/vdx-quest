import { TILE, SCALE, RS, MAP_W, MAP_H, ROOM_W, ROOM_H, MODE, INT_W, INT_H, HOUSES } from './constants.js';
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
// PLAYER
// ════════════════════════════════════════════════════════

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

  // Shadow under player
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the REAL Sunnyside World character sprites (spr_idle / spr_walking)
  const spriteName = player.moving ? 'spr_walking' : 'spr_idle';
  const img = getImg(spriteName);

  if (img && img.complete && img.naturalWidth > 0) {
    const meta = getMeta(spriteName);
    const fw = meta.w;
    const fh = meta.h;
    const nFrames = meta.frames;
    const animFrame = player.moving
      ? Math.floor(frame / 8) % nFrames
      : Math.floor(frame / 12) % nFrames;

    const drawW = fw * SCALE * 0.5;
    const drawH = fh * SCALE * 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    if (player.direction === 'left') ctx.scale(-1, 1);
    const srcX = animFrame * fw;
    ctx.drawImage(img, srcX, 0, fw, fh, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }
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

// Draw house door markers
function renderHouseMarkers(ctx, camX, camY, frame) {
  for (const h of HOUSES) {
    const doorScreenX = h.doorX * TILE * SCALE - camX;
    const doorScreenY = h.doorY * TILE * SCALE - camY;

    // Pulsing glow on the door tile
    const pulse = 0.5 + Math.sin(frame * 0.08) * 0.3;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.4})`;
    ctx.fillRect(doorScreenX - RS / 2, doorScreenY - RS, RS * 2, RS);

    // Door marker arrow (bouncing)
    const bounce = Math.sin(frame * 0.1) * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(doorScreenX + RS / 2, doorScreenY - RS - 10 + bounce);
    ctx.lineTo(doorScreenX + RS / 2 - 8, doorScreenY - RS - 22 + bounce);
    ctx.lineTo(doorScreenX + RS / 2 + 8, doorScreenY - RS - 22 + bounce);
    ctx.closePath();
    ctx.fill();

    // House name label
    ctx.font = 'bold 11px monospace';
    const nameW = ctx.measureText(h.name).width + 16;
    const lx = doorScreenX + RS / 2 - nameW / 2;
    const ly = doorScreenY - RS - 38;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(lx, ly, nameW, 18);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, nameW, 18);
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(h.name, doorScreenX + RS / 2, ly + 13);
    ctx.textAlign = 'left';
  }
}

export function renderWorld(ctx, canvas, player, frame) {
  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Back tile layers
  for (const name of tilesBefore2) renderTileLayer(ctx, name, camX, camY);

  // Assets_2
  for (const asset of assets2Sorted) drawSprite(ctx, asset, camX, camY, frame);

  // Middle tile layers
  for (const name of tilesBetween) renderTileLayer(ctx, name, camX, camY);

  // Assets_1 sprites
  for (const asset of assets1Sorted) drawSprite(ctx, asset, camX, camY, frame);

  // House door markers (above all sprites)
  renderHouseMarkers(ctx, camX, camY, frame);

  // Player ALWAYS on top of sprites (below clouds only)
  renderPlayer(ctx, player, camX, camY, frame, MODE.WORLD);

  // Top tile layers (clouds)
  for (const name of tilesAfter1) renderTileLayer(ctx, name, camX, camY);

  return { cameraX: camX, cameraY: camY };
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
        case 5: // Bookshelf
          ctx.fillStyle = '#5a3018';
          ctx.fillRect(x + 3, y + 3, RS - 6, RS - 6);
          const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad'];
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(x + 6 + i * 7, y + 8, 5, 10);
            ctx.fillRect(x + 6 + i * 7, y + RS / 2 + 2, 5, 10);
          }
          break;
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
        case 9: // Fireplace
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
  const name = house?.name || 'Intérieur';
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
