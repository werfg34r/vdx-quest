// VDX Quest Sprite System — Sunnyside World Edition
// Uses sunnyside_tiles.png for all environment rendering
// Uses characters.png for player & NPC sprites (Sunnyside character art)

const S = 16 // tile size

// ==================== TILESET COORDINATES ====================
// sunnyside_tiles.png layout (16 cols x 8 rows):
// Row 0: grass(0-5), darkGrass(6-7), tallGrass(8-9), path(10-12), sand(13-14), bridge(15)
// Row 1: tree(0-2), water(3-6), fence(7), sign(8), mountain(9-10), flower(11-15)
// Row 2: house blue (roofTL,TC,TR=0-2, midL,MC,MR=3-5, wallL,Win,R=6-8, botL,Door,BR=9-11)
// Row 3: house orange (same layout)
// Row 4: interior (floor=0-2, wall=3-5, table=6-7, chair=8, bookshelf=9-10, barrel=11, chest=12, bed=13, pot=14, carpet=15)
// Row 5: torch=0, doormat=1, altar=2

const TC = {
  grass:     [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }],
  darkGrass: [{ x: 6, y: 0 }, { x: 7, y: 0 }],
  tallGrass: [{ x: 8, y: 0 }, { x: 9, y: 0 }],
  path:      [{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }],
  sand:      [{ x: 13, y: 0 }, { x: 14, y: 0 }],
  bridge:    { x: 15, y: 0 },
  tree:      [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  water:     [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }],
  fence:     { x: 7, y: 1 },
  sign:      { x: 8, y: 1 },
  mountain:  [{ x: 9, y: 1 }, { x: 10, y: 1 }],
  flower:    [{ x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }],
  // House tiles (blue) - 3 wide x 4 tall
  houseRoofTL:  { x: 0, y: 2 }, houseRoofTC:  { x: 1, y: 2 }, houseRoofTR:  { x: 2, y: 2 },
  houseRoofML:  { x: 3, y: 2 }, houseRoofMC:  { x: 4, y: 2 }, houseRoofMR:  { x: 5, y: 2 },
  houseWallL:   { x: 6, y: 2 }, houseWallWin: { x: 7, y: 2 }, houseWallR:   { x: 8, y: 2 },
  houseWallDL:  { x: 9, y: 2 }, houseDoor:    { x: 10, y: 2 }, houseWallDR:  { x: 11, y: 2 },
  // Interior
  floor:     [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
  wall:      [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }],
  table:     { x: 6, y: 4 },
  chair:     { x: 8, y: 4 },
  bookshelf: { x: 9, y: 4 },
  barrel:    { x: 11, y: 4 },
  chest:     { x: 12, y: 4 },
  bed:       { x: 13, y: 4 },
  pot:       { x: 14, y: 4 },
  carpet:    { x: 15, y: 4 },
  torch:     { x: 0, y: 5 },
  doormat:   { x: 1, y: 5 },
  altar:     { x: 2, y: 5 },
}

// Character layout in characters.png (matches original character.png format)
const NPC_CHARS = {
  mentor:   { startCol: 3,  baseRow: 0 },
  villager: { startCol: 0,  baseRow: 8 },
  warrior:  { startCol: 9,  baseRow: 0 },
  sage:     { startCol: 12, baseRow: 0 },
  old:      { startCol: 6,  baseRow: 8 },
  trader:   { startCol: 3,  baseRow: 8 },
}

const DIR_ROWS = { down: 0, left: 1, right: 2, up: 3 }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function loadSpriteAtlas() {
  const [tileset, character] = await Promise.all([
    loadImage('/assets/sunnyside_tiles.png'),
    loadImage('/assets/characters.png'),
  ])
  return { tileset, character, S }
}

function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

function blit(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

function blitVariant(ctx, img, variants, px, py) {
  const h = tileHash(px, py)
  blit(ctx, img, variants[h % variants.length], px, py)
}

// ==================== MAIN TILE DRAW ====================
export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const ts = atlas.tileset

  switch (tileType) {
    // Terrain
    case 0:  blitVariant(ctx, ts, TC.grass, px, py); break
    case 9:  blitVariant(ctx, ts, TC.darkGrass, px, py); break
    case 17: blitVariant(ctx, ts, TC.tallGrass, px, py); break
    case 1:  blitVariant(ctx, ts, TC.path, px, py); break
    case 2: { // Water — animate through 4 frames
      const frame = Math.floor(tick / 20) % 4
      blit(ctx, ts, TC.water[frame], px, py)
      break
    }
    case 3:  blitVariant(ctx, ts, TC.tree, px, py); break
    case 5:  blitVariant(ctx, ts, TC.mountain, px, py); break
    case 6:  blitVariant(ctx, ts, TC.flower, px, py); break
    case 7:  blit(ctx, ts, TC.bridge, px, py); break
    case 8:  blit(ctx, ts, TC.fence, px, py); break
    case 10: blitVariant(ctx, ts, TC.sand, px, py); break
    case 14: blit(ctx, ts, TC.sign, px, py); break

    // House tiles — now from sunnyside tileset
    case 30: blitVariant(ctx, ts, TC.grass, px, py); blit(ctx, ts, TC.houseRoofTL, px, py); break
    case 31: blitVariant(ctx, ts, TC.grass, px, py); blit(ctx, ts, TC.houseRoofTC, px, py); break
    case 32: blitVariant(ctx, ts, TC.grass, px, py); blit(ctx, ts, TC.houseRoofTR, px, py); break
    case 33: blit(ctx, ts, TC.houseRoofML, px, py); break
    case 34: blit(ctx, ts, TC.houseRoofMC, px, py); break
    case 35: blit(ctx, ts, TC.houseRoofMR, px, py); break
    case 36: blit(ctx, ts, TC.houseWallL, px, py); break
    case 37: blit(ctx, ts, TC.houseWallWin, px, py); break
    case 38: blit(ctx, ts, TC.houseWallR, px, py); break
    case 39: blit(ctx, ts, TC.houseWallDL, px, py); break
    case 40: blit(ctx, ts, TC.houseDoor, px, py); break
    case 41: blit(ctx, ts, TC.houseWallDR, px, py); break

    default: blitVariant(ctx, ts, TC.grass, px, py)
  }
}

// ==================== CHARACTER RENDERING ====================
const CHAR_DRAW = 22
const CHAR_OFF = (CHAR_DRAW - S) / 2

export function drawCharacterShadow(ctx, px, py, width, alpha) {
  const w = width || 12
  const h = w * 0.4
  const cx = Math.floor(px) + S / 2
  const cy = Math.floor(py) + S - 1
  ctx.save()
  ctx.globalAlpha = alpha || 0.3
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawTreeShadow(ctx, px, py) {
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#1A3A0A'
  ctx.beginPath()
  ctx.ellipse(Math.floor(px) + S + 3, Math.floor(py) + S - 1, 7, 3, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawHouseShadow(ctx, houseX, houseY) {
  const px = houseX * S
  const py = houseY * S
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#000'
  ctx.fillRect(px + S * 3, py + S, 4, S * 3)
  ctx.fillRect(px + 2, py + S * 4, S * 3 + 2, 3)
  ctx.restore()
}

export function drawWindowGlow(ctx, px, py, intensity) {
  if (intensity <= 0) return
  ctx.save()
  ctx.globalAlpha = intensity * 0.6
  const cx = Math.floor(px) + S / 2
  const cy = Math.floor(py) + S / 2
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, S * 0.8)
  grad.addColorStop(0, '#ffcc44')
  grad.addColorStop(0.5, 'rgba(255,200,60,0.3)')
  grad.addColorStop(1, 'rgba(255,200,60,0)')
  ctx.fillStyle = grad
  ctx.fillRect(px - 4, py - 4, S + 8, S + 8)
  ctx.restore()
}

export function drawPlayerSprite(ctx, atlas, direction, frame, px, py) {
  const img = atlas.character
  const frameIdx = frame % 3
  const dirOffset = DIR_ROWS[direction] || 0
  const sx = frameIdx * S
  const sy = dirOffset * S
  ctx.drawImage(img, sx, sy, S, S,
    Math.floor(px - CHAR_OFF), Math.floor(py - CHAR_OFF - 2),
    CHAR_DRAW, CHAR_DRAW)
}

export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    drawPlayerSprite(ctx, atlas, direction || 'down', 0, px, py)
    return
  }

  const img = atlas.character
  const frameIdx = 0 // standing frame

  const sx = (charDef.startCol + frameIdx) * S
  const dirOffset = DIR_ROWS[direction || 'down'] || 0
  const sy = (charDef.baseRow + dirOffset) * S

  ctx.drawImage(img, sx, sy, S, S,
    Math.floor(px - CHAR_OFF), Math.floor(py - CHAR_OFF - 2),
    CHAR_DRAW, CHAR_DRAW)
}

// ==================== INTERIOR TILES ====================
// Now using Sunnyside tileset for interior rendering too

export function drawInteriorTile(ctx, tileType, px, py, tick) {
  // We need access to the tileset for interior rendering
  // This function is called from RPGCanvas which has the atlas
  // For interior tiles, we'll use a mix of tileset blitting and procedural effects

  const T = S
  switch (tileType) {
    case 50: { // FLOOR — procedural with warm wood tone (matching Sunnyside palette)
      const h = tileHash(px, py)
      ctx.fillStyle = h % 3 === 0 ? '#C08A64' : '#B88060'
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = '#A07050'
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4)
      ctx.moveTo(px, py + 10); ctx.lineTo(px + T, py + 10)
      ctx.stroke()
      ctx.fillStyle = '#D0A078'
      ctx.globalAlpha = 0.25
      ctx.fillRect(px, py, T, 1)
      ctx.fillRect(px, py + 5, T, 1)
      ctx.fillRect(px, py + 11, T, 1)
      ctx.globalAlpha = 1
      break
    }

    case 51: { // WALL — stone with Sunnyside warm tones
      ctx.fillStyle = '#786A5E'
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#8A7C6E'
      ctx.fillRect(px, py, T, 6)
      ctx.fillStyle = '#96887A'
      ctx.fillRect(px, py, T, 1)
      ctx.strokeStyle = '#6A5C50'
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(px, py + 6); ctx.lineTo(px + T, py + 6)
      ctx.moveTo(px, py + 11); ctx.lineTo(px + T, py + 11)
      ctx.moveTo(px + 5, py); ctx.lineTo(px + 5, py + 6)
      ctx.moveTo(px + 11, py); ctx.lineTo(px + 11, py + 6)
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 3, py + 11)
      ctx.moveTo(px + 8, py + 6); ctx.lineTo(px + 8, py + 11)
      ctx.moveTo(px + 13, py + 6); ctx.lineTo(px + 13, py + 11)
      ctx.moveTo(px + 6, py + 11); ctx.lineTo(px + 6, py + T)
      ctx.moveTo(px + 11, py + 11); ctx.lineTo(px + 11, py + T)
      ctx.stroke()
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(px, py + T - 1, T, 1)
      break
    }

    case 52: { // TABLE
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px + 3, py + 13, 12, 2)
      ctx.fillStyle = '#7A4E2A'; ctx.fillRect(px + 2, py + 11, 2, 4); ctx.fillRect(px + 12, py + 11, 2, 4)
      ctx.fillStyle = '#8B5E36'; ctx.fillRect(px + 1, py + 3, 14, 9)
      ctx.fillStyle = '#9B6E46'; ctx.fillRect(px + 1, py + 3, 14, 2)
      ctx.strokeStyle = '#7A4E2A'; ctx.lineWidth = 0.3; ctx.beginPath()
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 13, py + 6)
      ctx.moveTo(px + 3, py + 9); ctx.lineTo(px + 13, py + 9); ctx.stroke()
      break
    }

    case 53: { // CHAIR
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 5, py + 13, 8, 2)
      ctx.fillStyle = '#7A4E2A'; ctx.fillRect(px + 4, py + 12, 2, 3); ctx.fillRect(px + 10, py + 12, 2, 3)
      ctx.fillStyle = '#9B6E46'; ctx.fillRect(px + 4, py + 5, 8, 7)
      ctx.fillStyle = '#AB7E56'; ctx.fillRect(px + 3, py + 2, 10, 3)
      break
    }

    case 54: { // BOOKSHELF
      ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#8B5E36'; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = '#9B6E46'; ctx.fillRect(px + 1, py + 1, 14, 1)
      ctx.fillStyle = '#7A5230'; ctx.fillRect(px + 1, py + 5, 14, 1); ctx.fillRect(px + 1, py + 10, 14, 1)
      const books = ['#C0392B', '#2E86C1', '#27AE60', '#8E44AD', '#D4A850']
      ctx.fillStyle = books[0]; ctx.fillRect(px + 2, py + 2, 2, 3)
      ctx.fillStyle = books[1]; ctx.fillRect(px + 4, py + 3, 2, 2)
      ctx.fillStyle = books[2]; ctx.fillRect(px + 7, py + 2, 3, 3)
      ctx.fillStyle = books[3]; ctx.fillRect(px + 11, py + 2, 2, 3)
      ctx.fillStyle = books[2]; ctx.fillRect(px + 2, py + 6, 3, 4)
      ctx.fillStyle = books[0]; ctx.fillRect(px + 6, py + 7, 2, 3)
      ctx.fillStyle = books[4]; ctx.fillRect(px + 9, py + 6, 2, 4)
      ctx.fillStyle = books[1]; ctx.fillRect(px + 12, py + 7, 2, 3)
      ctx.fillStyle = books[3]; ctx.fillRect(px + 2, py + 11, 2, 3)
      ctx.fillStyle = books[0]; ctx.fillRect(px + 5, py + 12, 3, 2)
      ctx.fillStyle = books[4]; ctx.fillRect(px + 9, py + 11, 4, 3)
      break
    }

    case 55: { // CARPET
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#8B2252'; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = '#6B1A42'
      ctx.fillRect(px + 1, py + 1, 14, 1); ctx.fillRect(px + 1, py + 14, 14, 1)
      ctx.fillRect(px + 1, py + 1, 1, 14); ctx.fillRect(px + 14, py + 1, 1, 14)
      ctx.fillStyle = '#A0284E'; ctx.fillRect(px + 3, py + 3, 10, 10)
      ctx.fillStyle = '#D4A850'; ctx.fillRect(px + 7, py + 7, 2, 2)
      break
    }

    case 56: { // QUEST ALTAR — animated glow
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      const glow = 0.5 + Math.sin(tick * 0.08) * 0.3
      ctx.save(); ctx.globalAlpha = glow * 0.25; ctx.fillStyle = '#FFE0A0'
      ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      ctx.fillStyle = '#888'; ctx.fillRect(px + 2, py + 10, 12, 5)
      ctx.fillStyle = '#AAA'; ctx.fillRect(px + 3, py + 5, 10, 6)
      ctx.fillStyle = '#BBB'; ctx.fillRect(px + 3, py + 5, 10, 1)
      ctx.fillStyle = '#FFE0A0'; ctx.fillRect(px + 4, py + 2, 8, 5)
      ctx.fillStyle = '#D4A850'; ctx.fillRect(px + 5, py + 3, 6, 3)
      const spark = Math.sin(tick * 0.12) > 0.3
      if (spark) { ctx.fillStyle = '#fff'; ctx.fillRect(px + 3, py + 1, 1, 1); ctx.fillRect(px + 11, py + 2, 1, 1) }
      break
    }

    case 57: { // BARREL
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 5, 2, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#9B7848'; ctx.fillRect(px + 4, py + 2, 8, 12); ctx.fillRect(px + 3, py + 5, 10, 6)
      ctx.fillStyle = '#AB8858'; ctx.fillRect(px + 4, py + 2, 3, 12)
      ctx.fillStyle = '#666'; ctx.fillRect(px + 3, py + 4, 10, 1); ctx.fillRect(px + 3, py + 8, 10, 1); ctx.fillRect(px + 3, py + 12, 10, 1)
      break
    }

    case 58: { // BED
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#8B5E36'; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = '#C8B8A0'; ctx.fillRect(px + 3, py + 2, 10, 4)
      ctx.fillStyle = '#2B6AAA'; ctx.fillRect(px + 2, py + 6, 12, 8)
      ctx.fillStyle = '#3B7ABB'; ctx.fillRect(px + 2, py + 6, 12, 2)
      break
    }

    case 59: { // DOOR MAT
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#772222'; ctx.fillRect(px + 1, py + 3, 14, 10)
      ctx.fillStyle = '#993333'; ctx.fillRect(px + 2, py + 4, 12, 8)
      ctx.fillStyle = '#AA4444'; ctx.fillRect(px + 3, py + 5, 10, 6)
      break
    }

    case 60: { // TORCH — animated flame
      ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = '#8A7C6E'; ctx.fillRect(px, py, T, 6)
      ctx.fillStyle = '#96887A'; ctx.fillRect(px, py, T, 1)
      ctx.save()
      const pulse = 0.3 + Math.sin(tick * 0.1 + px) * 0.1
      ctx.globalAlpha = pulse
      const g = ctx.createRadialGradient(px + 8, py + 5, 0, px + 8, py + 5, 10)
      g.addColorStop(0, '#FF882244'); g.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = g; ctx.fillRect(px - 4, py - 4, T + 8, T + 8); ctx.restore()
      ctx.fillStyle = '#666'; ctx.fillRect(px + 6, py + 7, 4, 6)
      const fl = Math.sin(tick * 0.15 + px) * 0.8
      ctx.fillStyle = '#FF4400'; ctx.fillRect(px + 5 + fl, py + 3, 6, 5)
      ctx.fillStyle = '#FF8833'; ctx.fillRect(px + 6, py + 3, 4, 4)
      ctx.fillStyle = '#FFDD44'; ctx.fillRect(px + 7, py + 4, 2, 2)
      break
    }

    case 61: { // POT
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#AA7744'; ctx.fillRect(px + 4, py + 6, 8, 8); ctx.fillRect(px + 5, py + 4, 6, 3)
      ctx.fillStyle = '#BB8855'; ctx.fillRect(px + 4, py + 4, 8, 1)
      ctx.fillStyle = '#CC9965'; ctx.fillRect(px + 5, py + 6, 2, 6)
      break
    }

    case 62: { // CHEST
      ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px + 3, py + 14, 11, 1)
      ctx.fillStyle = '#DAA520'; ctx.fillRect(px + 2, py + 5, 12, 9)
      ctx.fillStyle = '#EAB530'; ctx.fillRect(px + 2, py + 5, 12, 2)
      ctx.fillStyle = '#8B6914'; ctx.fillRect(px + 2, py + 8, 12, 1); ctx.fillRect(px + 7, py + 5, 2, 9)
      ctx.fillStyle = '#FFD700'; ctx.fillRect(px + 7, py + 9, 2, 2)
      break
    }

    default:
      ctx.fillStyle = '#B88060'
      ctx.fillRect(px, py, T, T)
  }
}

// Interior tile constants
export const IT = {
  FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54,
  CARPET: 55, ALTAR: 56, BARREL: 57, BED: 58, DOOR_MAT: 59,
  TORCH: 60, POT: 61, CHEST: 62,
}

const SOLID_INTERIOR = new Set([IT.WALL, IT.TABLE, IT.BOOKSHELF, IT.BARREL, IT.BED, IT.TORCH, IT.POT, IT.CHEST])

export function canMoveInterior(interiorMap, x, y, interiorNpcs) {
  if (x < 0 || y < 0 || y >= interiorMap.length || x >= interiorMap[0].length) return false
  if (SOLID_INTERIOR.has(interiorMap[y][x])) return false
  if (interiorNpcs) {
    for (const npc of interiorNpcs) {
      if (npc.x === x && npc.y === y) return false
    }
  }
  return true
}

export function generateInterior(zone) {
  const W = 14, H = 12
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H-1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W-1] = IT.WALL }

  m[H-1][6] = IT.DOOR_MAT; m[H-1][7] = IT.DOOR_MAT
  m[0][2] = IT.TORCH; m[0][W-3] = IT.TORCH
  m[4][0] = IT.TORCH; m[4][W-1] = IT.TORCH
  m[8][0] = IT.TORCH; m[8][W-1] = IT.TORCH
  m[2][6] = IT.ALTAR; m[2][7] = IT.ALTAR
  for (let y = 3; y <= H-2; y++) { m[y][6] = IT.CARPET; m[y][7] = IT.CARPET }

  if (zone.id === 1) {
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][3] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF; m[1][W-4] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[3][3] = IT.TABLE; m[4][2] = IT.CHAIR; m[4][3] = IT.CHAIR
    m[3][W-3] = IT.TABLE; m[3][W-4] = IT.TABLE; m[4][W-3] = IT.CHAIR; m[4][W-4] = IT.CHAIR
    m[7][1] = IT.BED; m[8][1] = IT.CHEST; m[6][1] = IT.POT; m[9][W-2] = IT.POT
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL; m[7][W-2] = IT.BARREL
    m[6][2] = IT.BOOKSHELF; m[6][3] = IT.BOOKSHELF
  } else if (zone.id === 2) {
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    m[3][1] = IT.CHEST; m[3][2] = IT.CHEST; m[5][1] = IT.CHEST
    m[3][W-2] = IT.CHEST; m[3][W-3] = IT.CHEST; m[5][W-2] = IT.CHEST
    m[5][4] = IT.TABLE; m[5][5] = IT.TABLE; m[5][8] = IT.TABLE; m[5][9] = IT.TABLE
    m[6][4] = IT.CHAIR; m[6][5] = IT.CHAIR; m[6][8] = IT.CHAIR; m[6][9] = IT.CHAIR
    m[8][1] = IT.POT; m[9][1] = IT.BARREL; m[8][W-2] = IT.POT; m[9][W-2] = IT.BARREL
    m[8][2] = IT.BOOKSHELF; m[8][3] = IT.BOOKSHELF; m[8][W-3] = IT.BOOKSHELF; m[8][W-4] = IT.BOOKSHELF
  } else if (zone.id === 3) {
    m[1][1] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF
    m[2][4] = IT.POT; m[2][9] = IT.POT; m[3][1] = IT.POT; m[3][W-2] = IT.POT
    m[5][2] = IT.TABLE; m[5][3] = IT.TABLE; m[6][2] = IT.CHAIR
    m[8][W-2] = IT.BED; m[8][W-3] = IT.BED
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL; m[9][W-2] = IT.BARREL
    m[7][1] = IT.CHEST
  } else {
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[4][2] = IT.CHAIR; m[3][W-3] = IT.TABLE; m[4][W-3] = IT.CHAIR
    m[7][1] = IT.BARREL; m[7][W-2] = IT.POT
  }

  return { map: m, width: W, height: H, spawnX: 6, spawnY: H - 2 }
}

export { S }
