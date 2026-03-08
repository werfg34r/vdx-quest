// VDX Quest Sprite System — Tileset-based rendering
// Uses generated tileset.png for environment tiles
// Uses characters.png for player & NPC sprites
// Uses overworld.png for house tiles (they look good)

const S = 16 // tile size

// ==================== TILESET COORDINATES ====================
// tileset.png layout (16x4 grid of 16x16 tiles):
// Row 0: grass(0-3), darkGrass(4-5), tallGrass(6-7), path(8-10), sand(11-12)
// Row 1: tree(0-2), water(3-6)
// Row 2: flower(0-2), fence(3), bridge(4), sign(5), mountain(6)

const TILE_COORDS = {
  grass:     [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  darkGrass: [{ x: 4, y: 0 }, { x: 5, y: 0 }],
  tallGrass: [{ x: 6, y: 0 }, { x: 7, y: 0 }],
  path:      [{ x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 }],
  sand:      [{ x: 11, y: 0 }, { x: 12, y: 0 }],
  tree:      [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  water:     [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }],
  flower:    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  fence:     [{ x: 3, y: 2 }],
  bridge:    [{ x: 4, y: 2 }],
  sign:      [{ x: 5, y: 2 }],
  mountain:  [{ x: 6, y: 2 }],
}

// House tile coordinates from overworld.png (these look good, keep them)
const HOUSE_TILES = {
  houseRoofTL:  { x: 7, y: 0 },
  houseRoofTC:  { x: 8, y: 0 },
  houseRoofTR:  { x: 9, y: 0 },
  houseRoofML:  { x: 7, y: 1 },
  houseRoofMC:  { x: 8, y: 1 },
  houseRoofMR:  { x: 9, y: 1 },
  houseWallL:   { x: 7, y: 2 },
  houseWallWin: { x: 8, y: 2 },
  houseWallR:   { x: 9, y: 2 },
  houseWallDL:  { x: 7, y: 3 },
  houseDoor:    { x: 8, y: 3 },
  houseWallDR:  { x: 9, y: 3 },
}

// character.png / characters.png layout:
// Group 0 (rows 0-3): player=cols0-2, mentor=cols3-5, char3=cols6-8, warrior=cols9-11, sage=cols12-14
// Group 2 (rows 8-11): villager=cols0-2, trader=cols3-5, old=cols6-7
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
  const [overworld, character, tileset] = await Promise.all([
    loadImage('/assets/overworld.png'),
    loadImage('/assets/characters.png'),
    loadImage('/assets/tileset.png'),
  ])
  return { overworld, character, tileset, S }
}

function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

// Blit a tile from the tileset spritesheet
function blitTileset(ctx, tileset, coord, px, py) {
  ctx.drawImage(tileset, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

// Blit a tile from the overworld spritesheet
function blitOverworld(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

// ==================== TILE DRAWING (tileset-based) ====================

function drawVariant(ctx, tileset, variants, px, py) {
  const h = tileHash(px, py)
  const coord = variants[h % variants.length]
  blitTileset(ctx, tileset, coord, px, py)
}

function drawWater(ctx, tileset, px, py, tick) {
  // Animated water — cycle through 4 frames
  const frame = Math.floor(tick / 20) % 4
  const coord = TILE_COORDS.water[frame]
  blitTileset(ctx, tileset, coord, px, py)
}

// ==================== MAIN TILE DRAW ====================
export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const ts = atlas.tileset
  const ow = atlas.overworld

  switch (tileType) {
    case 0:  drawVariant(ctx, ts, TILE_COORDS.grass, px, py); break
    case 9:  drawVariant(ctx, ts, TILE_COORDS.darkGrass, px, py); break
    case 17: drawVariant(ctx, ts, TILE_COORDS.tallGrass, px, py); break
    case 1:  drawVariant(ctx, ts, TILE_COORDS.path, px, py); break
    case 2:  drawWater(ctx, ts, px, py, tick); break
    case 3:  drawVariant(ctx, ts, TILE_COORDS.tree, px, py); break
    case 5:  blitTileset(ctx, ts, TILE_COORDS.mountain[0], px, py); break
    case 6:  drawVariant(ctx, ts, TILE_COORDS.flower, px, py); break
    case 7:  blitTileset(ctx, ts, TILE_COORDS.bridge[0], px, py); break
    case 8:  blitTileset(ctx, ts, TILE_COORDS.fence[0], px, py); break
    case 10: drawVariant(ctx, ts, TILE_COORDS.sand, px, py); break
    case 14: blitTileset(ctx, ts, TILE_COORDS.sign[0], px, py); break

    // House tiles — keep from overworld.png tileset
    case 30: drawVariant(ctx, ts, TILE_COORDS.grass, px, py); blitOverworld(ctx, ow, HOUSE_TILES.houseRoofTL, px, py); break
    case 31: drawVariant(ctx, ts, TILE_COORDS.grass, px, py); blitOverworld(ctx, ow, HOUSE_TILES.houseRoofTC, px, py); break
    case 32: drawVariant(ctx, ts, TILE_COORDS.grass, px, py); blitOverworld(ctx, ow, HOUSE_TILES.houseRoofTR, px, py); break
    case 33: blitOverworld(ctx, ow, HOUSE_TILES.houseRoofML, px, py); break
    case 34: blitOverworld(ctx, ow, HOUSE_TILES.houseRoofMC, px, py); break
    case 35: blitOverworld(ctx, ow, HOUSE_TILES.houseRoofMR, px, py); break
    case 36: blitOverworld(ctx, ow, HOUSE_TILES.houseWallL, px, py); break
    case 37: blitOverworld(ctx, ow, HOUSE_TILES.houseWallWin, px, py); break
    case 38: blitOverworld(ctx, ow, HOUSE_TILES.houseWallR, px, py); break
    case 39: blitOverworld(ctx, ow, HOUSE_TILES.houseWallDL, px, py); break
    case 40: blitOverworld(ctx, ow, HOUSE_TILES.houseDoor, px, py); break
    case 41: blitOverworld(ctx, ow, HOUSE_TILES.houseWallDR, px, py); break

    default: drawVariant(ctx, ts, TILE_COORDS.grass, px, py)
  }
}

// ==================== CHARACTER RENDERING ====================
const CHAR_DRAW = 22
const CHAR_OFF = (CHAR_DRAW - S) / 2

// Draw a blob shadow under a character
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

// Draw tree shadow (directional, cast to the right)
export function drawTreeShadow(ctx, px, py) {
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#1A3A0A'
  ctx.beginPath()
  ctx.ellipse(Math.floor(px) + S + 3, Math.floor(py) + S - 1, 7, 3, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Draw house shadow (cast to the right and below)
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

// Draw window glow for houses at night
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

// Draw player (cols 0-2 of characters.png)
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

// Draw NPC using characters.png
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    drawPlayerSprite(ctx, atlas, direction || 'down', 0, px, py)
    return
  }

  const img = atlas.character
  // Use frame 0 (standing) for static NPCs
  const frameIdx = 0

  const sx = (charDef.startCol + frameIdx) * S
  const dirOffset = DIR_ROWS[direction || 'down'] || 0
  const sy = (charDef.baseRow + dirOffset) * S

  ctx.drawImage(img, sx, sy, S, S,
    Math.floor(px - CHAR_OFF), Math.floor(py - CHAR_OFF - 2),
    CHAR_DRAW, CHAR_DRAW)
}

// ==================== INTERIOR TILES ====================
const INTERIOR_COLORS = {
  floor:     '#8B7355',
  floorDark: '#7A6548',
  floorLight:'#9A8265',
  wall:      '#5C5040',
  wallTop:   '#6B5E4E',
  wallHighlight: '#7A6E5E',
  carpet:    '#8B2252',
  carpetB:   '#A0284E',
  carpetBorder: '#6B1A42',
  table:     '#6B4226',
  tableLeg:  '#5B3216',
  tableHighlight: '#7B5236',
  chair:     '#8B6E4E',
  chairHighlight: '#9B7E5E',
  shelf:     '#6B4226',
  shelfItem: '#C7B777',
  book1:     '#C0392B',
  book2:     '#2E86C1',
  book3:     '#27AE60',
  book4:     '#8E44AD',
  barrel:    '#8B6848',
  barrelBand:'#555',
  barrelHighlight: '#9B7858',
  bed:       '#C8B8A0',
  bedBlanket:'#2B6AAA',
  bedBlanketHighlight: '#3B7ABB',
  torch:     '#FF8833',
  torchBase: '#555',
  chest:     '#DAA520',
  chestBand: '#8B6914',
  chestHighlight: '#EAB530',
  altar:     '#C7B777',
  altarGlow: '#FFE0A0',
  pot:       '#AA7744',
  potHighlight: '#BB8855',
  rug:       '#993333',
  rugBorder: '#772222',
}

export function drawInteriorTile(ctx, tileType, px, py, tick) {
  const IC = INTERIOR_COLORS
  const T = S

  switch (tileType) {
    case 50: { // FLOOR
      const h = tileHash(px, py)
      ctx.fillStyle = h % 3 === 0 ? IC.floorLight : IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4)
      ctx.moveTo(px, py + 10); ctx.lineTo(px + T, py + 10)
      ctx.stroke()
      ctx.fillStyle = IC.floorDark
      if (h % 5 === 0) ctx.fillRect(px + 3, py + 2, 1, 1)
      if (h % 7 === 0) ctx.fillRect(px + 10, py + 7, 1, 1)
      if (h % 11 === 0) ctx.fillRect(px + 6, py + 12, 1, 1)
      ctx.fillStyle = IC.floorLight
      ctx.globalAlpha = 0.3
      ctx.fillRect(px, py, T, 1)
      ctx.fillRect(px, py + 5, T, 1)
      ctx.fillRect(px, py + 11, T, 1)
      ctx.globalAlpha = 1
      break
    }

    case 51: { // WALL
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.wallTop
      ctx.fillRect(px, py, T, 6)
      ctx.fillStyle = IC.wallHighlight
      ctx.fillRect(px, py, T, 1)
      ctx.strokeStyle = '#4A4035'
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
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(px, py + T - 1, T, 1)
      break
    }

    case 52: { // TABLE
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px + 3, py + 13, 12, 2)
      ctx.fillStyle = IC.tableLeg; ctx.fillRect(px + 2, py + 11, 2, 4); ctx.fillRect(px + 12, py + 11, 2, 4)
      ctx.fillStyle = IC.table; ctx.fillRect(px + 1, py + 3, 14, 9)
      ctx.fillStyle = IC.tableHighlight; ctx.fillRect(px + 1, py + 3, 14, 2)
      ctx.strokeStyle = IC.tableLeg; ctx.lineWidth = 0.3; ctx.beginPath()
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 13, py + 6)
      ctx.moveTo(px + 3, py + 9); ctx.lineTo(px + 13, py + 9); ctx.stroke()
      break
    }

    case 53: { // CHAIR
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 5, py + 13, 8, 2)
      ctx.fillStyle = IC.tableLeg; ctx.fillRect(px + 4, py + 12, 2, 3); ctx.fillRect(px + 10, py + 12, 2, 3)
      ctx.fillStyle = IC.chair; ctx.fillRect(px + 4, py + 5, 8, 7)
      ctx.fillStyle = IC.chairHighlight; ctx.fillRect(px + 3, py + 2, 10, 3)
      ctx.fillStyle = IC.chair; ctx.fillRect(px + 5, py + 2, 1, 3); ctx.fillRect(px + 8, py + 2, 1, 3); ctx.fillRect(px + 11, py + 2, 1, 3)
      break
    }

    case 54: { // BOOKSHELF
      ctx.fillStyle = IC.wall; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.shelf; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = IC.tableHighlight; ctx.fillRect(px + 1, py + 1, 14, 1)
      ctx.fillStyle = IC.floorDark; ctx.fillRect(px + 1, py + 5, 14, 1); ctx.fillRect(px + 1, py + 10, 14, 1)
      const books = [IC.book1, IC.book2, IC.book3, IC.book4, IC.shelfItem]
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
      ctx.fillStyle = IC.shelfItem; ctx.fillRect(px + 9, py + 11, 4, 3)
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(px + 14, py + 1, 1, 14)
      break
    }

    case 55: { // CARPET
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.carpet; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = IC.carpetBorder
      ctx.fillRect(px + 1, py + 1, 14, 1); ctx.fillRect(px + 1, py + 14, 14, 1)
      ctx.fillRect(px + 1, py + 1, 1, 14); ctx.fillRect(px + 14, py + 1, 1, 14)
      ctx.fillStyle = IC.carpetB; ctx.fillRect(px + 3, py + 3, 10, 10)
      ctx.fillStyle = IC.carpet
      ctx.fillRect(px + 7, py + 4, 2, 2); ctx.fillRect(px + 6, py + 5, 4, 2)
      ctx.fillRect(px + 5, py + 6, 6, 2); ctx.fillRect(px + 6, py + 8, 4, 2)
      ctx.fillRect(px + 7, py + 10, 2, 2)
      ctx.fillStyle = '#C7A755'; ctx.fillRect(px + 8, py + 7, 1, 1); ctx.fillRect(px + 7, py + 8, 1, 1)
      break
    }

    case 56: { // QUEST_ALTAR
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      const glow = 0.5 + Math.sin(tick * 0.08) * 0.3
      const auraSize = 2 + Math.sin(tick * 0.06) * 1
      ctx.save(); ctx.globalAlpha = glow * 0.25; ctx.fillStyle = '#FFE0A0'
      ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.7 + auraSize, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      ctx.fillStyle = '#777'; ctx.fillRect(px + 2, py + 10, 12, 5)
      ctx.fillStyle = '#999'; ctx.fillRect(px + 3, py + 5, 10, 6)
      ctx.fillStyle = '#aaa'; ctx.fillRect(px + 3, py + 5, 10, 1)
      ctx.fillStyle = IC.altarGlow; ctx.fillRect(px + 4, py + 2, 8, 5)
      ctx.fillStyle = IC.altar; ctx.fillRect(px + 5, py + 3, 6, 3)
      const spark1 = Math.sin(tick * 0.12) > 0.3
      const spark2 = Math.sin(tick * 0.12 + 2) > 0.3
      ctx.fillStyle = '#fff'
      if (spark1) ctx.fillRect(px + 3, py + 1, 1, 1)
      if (spark2) ctx.fillRect(px + 11, py + 2, 1, 1)
      break
    }

    case 57: { // BARREL
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 5, 2, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = IC.barrel; ctx.fillRect(px + 4, py + 2, 8, 12); ctx.fillRect(px + 3, py + 5, 10, 6)
      ctx.fillStyle = IC.barrelHighlight; ctx.fillRect(px + 4, py + 2, 3, 12)
      ctx.fillStyle = IC.barrelBand; ctx.fillRect(px + 3, py + 4, 10, 1); ctx.fillRect(px + 3, py + 8, 10, 1); ctx.fillRect(px + 3, py + 12, 10, 1)
      ctx.fillStyle = '#6A5838'; ctx.fillRect(px + 4, py + 2, 8, 1)
      break
    }

    case 58: { // BED
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.table; ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = IC.tableHighlight; ctx.fillRect(px + 1, py + 1, 14, 1)
      ctx.fillStyle = IC.bed; ctx.fillRect(px + 3, py + 2, 10, 4)
      ctx.fillStyle = '#D8C8B0'; ctx.fillRect(px + 4, py + 3, 4, 2)
      ctx.fillStyle = IC.bedBlanket; ctx.fillRect(px + 2, py + 6, 12, 8)
      ctx.fillStyle = IC.bedBlanketHighlight; ctx.fillRect(px + 2, py + 6, 12, 2)
      break
    }

    case 59: { // DOOR_MAT
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.rugBorder; ctx.fillRect(px + 1, py + 3, 14, 10)
      ctx.fillStyle = IC.rug; ctx.fillRect(px + 2, py + 4, 12, 8)
      ctx.fillStyle = '#AA4444'; ctx.fillRect(px + 3, py + 5, 10, 6)
      ctx.fillStyle = IC.rugBorder; ctx.fillRect(px + 7, py + 6, 2, 4); ctx.fillRect(px + 5, py + 8, 6, 2)
      break
    }

    case 60: { // TORCH_WALL
      ctx.fillStyle = IC.wall; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.wallTop; ctx.fillRect(px, py, T, 6)
      ctx.fillStyle = IC.wallHighlight; ctx.fillRect(px, py, T, 1)
      ctx.save()
      const lightPulse = 0.3 + Math.sin(tick * 0.1 + px) * 0.1
      ctx.globalAlpha = lightPulse
      const lightGrad = ctx.createRadialGradient(px + 8, py + 5, 0, px + 8, py + 5, 10)
      lightGrad.addColorStop(0, '#FF882244')
      lightGrad.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = lightGrad
      ctx.fillRect(px - 4, py - 4, T + 8, T + 8)
      ctx.restore()
      ctx.fillStyle = IC.torchBase; ctx.fillRect(px + 6, py + 7, 4, 6)
      const flicker = Math.sin(tick * 0.15 + px) * 0.8
      const flicker2 = Math.cos(tick * 0.2 + px) * 0.5
      ctx.fillStyle = '#FF4400'; ctx.fillRect(px + 5 + flicker, py + 3, 6, 5)
      ctx.fillStyle = IC.torch; ctx.fillRect(px + 6 + flicker2, py + 3, 4, 4)
      ctx.fillStyle = '#FFDD44'; ctx.fillRect(px + 7, py + 4, 2, 2)
      ctx.fillStyle = '#FFEE88'; ctx.fillRect(px + 7 + flicker2 * 0.5, py + 2, 2, 2)
      break
    }

    case 61: { // POT
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = IC.pot; ctx.fillRect(px + 4, py + 6, 8, 8); ctx.fillRect(px + 5, py + 4, 6, 3)
      ctx.fillStyle = '#BB8855'; ctx.fillRect(px + 4, py + 4, 8, 1)
      ctx.fillStyle = IC.potHighlight; ctx.fillRect(px + 5, py + 6, 2, 6)
      ctx.fillStyle = '#886633'; ctx.fillRect(px + 4, py + 9, 8, 1)
      break
    }

    case 62: { // CHEST
      ctx.fillStyle = IC.floor; ctx.fillRect(px, py, T, T)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px + 3, py + 14, 11, 1)
      ctx.fillStyle = IC.chest; ctx.fillRect(px + 2, py + 5, 12, 9)
      ctx.fillStyle = IC.chestHighlight; ctx.fillRect(px + 2, py + 5, 12, 2)
      ctx.fillStyle = IC.chestBand; ctx.fillRect(px + 2, py + 8, 12, 1); ctx.fillRect(px + 2, py + 12, 12, 1); ctx.fillRect(px + 7, py + 5, 2, 9)
      ctx.fillStyle = '#FFD700'; ctx.fillRect(px + 7, py + 9, 2, 2)
      ctx.fillStyle = '#CC9900'; ctx.fillRect(px + 7, py + 10, 2, 1)
      break
    }

    default:
      ctx.fillStyle = IC.floor
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

// Generate interior map for a zone
export function generateInterior(zone) {
  const W = 14, H = 12
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H-1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W-1] = IT.WALL }

  m[H-1][6] = IT.DOOR_MAT
  m[H-1][7] = IT.DOOR_MAT

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
