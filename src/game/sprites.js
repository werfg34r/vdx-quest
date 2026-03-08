// Sprite Atlas - Loads real PNG tilesets (ArMM1998 Zelda-like, CC0)
// Overworld.png: 640x576, 16x16 tiles (40 cols x 36 rows)
// character.png: 272x256, 16x16 frames, 8 distinct characters

const S = 16 // source tile size

// Tile coordinates verified via pixel analysis
const TILE_COORDS = {
  grass: [
    { x: 0, y: 0 },
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 5, y: 9 },
  ],
  darkGrass: [
    { x: 4, y: 11 },
    { x: 5, y: 11 },
    { x: 6, y: 11 },
  ],
  tallGrass: [
    { x: 0, y: 4 },
    { x: 2, y: 4 },
  ],
  path: [
    { x: 7, y: 1 },
    { x: 9, y: 1 },
  ],
  water: [
    { x: 17, y: 0 },
    { x: 18, y: 0 },
    { x: 19, y: 0 },
    { x: 17, y: 1 },
  ],
  tree: { x: 1, y: 15, needsBase: 'grass' },
  mountain: [
    { x: 22, y: 1 },
    { x: 24, y: 1 },
  ],
  flower: [
    { x: 15, y: 6 },
    { x: 17, y: 6 },
    { x: 1, y: 4 },
  ],
  bridge: { x: 34, y: 2, needsBase: 'water' },
  fence: { x: 6, y: 3, needsBase: 'grass' },

  // Wooden house tiles - from the large house in tileset (cols 7-9, rows 0-4)
  // Verified via pixel analysis: brown roof, dark walls, dark door at (8,3)
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

  sign: { x: 30, y: 0, needsBase: 'path' },
  sand: [
    { x: 28, y: 1 },
    { x: 29, y: 1 },
  ],
}

// character.png: 272x256 = 17 cols x 16 rows of 16x16 chibi sprites
// Each character: 3 columns (walk frames) x 4 rows (1 per direction)
// Layout: 5 characters per row-group, 4 row-groups total
//   Group 0 (rows 0-3): chars at cols 0,3,6,9,12
//   Group 1 (rows 4-7): chars at cols 0,3,6,9,12
//   Group 2 (rows 8-11): chars at cols 0,3,6,9,12
//   Group 3 (rows 12-15): chars at cols 0,3,6,9,12
const NPC_CHARS = {
  // Player uses cols 0-2, rows 0-3 (group 0, char 1)
  mentor:   { startCol: 3,  baseRow: 0 },  // group 0, char 2
  villager: { startCol: 0,  baseRow: 8 },  // group 2, char 1
  warrior:  { startCol: 9,  baseRow: 0 },  // group 0, char 4
  sage:     { startCol: 12, baseRow: 0 },  // group 0, char 5
  old:      { startCol: 6,  baseRow: 8 },  // group 2, char 3
  trader:   { startCol: 3,  baseRow: 8 },  // group 2, char 2
}

// Direction offsets: each direction = 1 row (16x16 complete sprites)
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
  const [overworld, character, npc, objects] = await Promise.all([
    loadImage('/assets/overworld.png'),
    loadImage('/assets/character.png'),
    loadImage('/assets/npc.png'),
    loadImage('/assets/objects.png'),
  ])
  return { overworld, character, npc, objects, S }
}

function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

function blitTile(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

function pickCoord(coords, px, py) {
  if (Array.isArray(coords)) {
    return coords[tileHash(px, py) % coords.length]
  }
  return coords
}

function drawBase(ctx, img, baseType, px, py) {
  const baseCoords = {
    grass: TILE_COORDS.grass[0],
    water: TILE_COORDS.water[0],
    path: TILE_COORDS.path[0],
  }
  const base = baseCoords[baseType]
  if (base) blitTile(ctx, img, base, px, py)
}

export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const img = atlas.overworld
  const tc = TILE_COORDS

  switch (tileType) {
    case 0: // GRASS
      blitTile(ctx, img, pickCoord(tc.grass, px, py), px, py)
      break
    case 9: // DARK_GRASS
      blitTile(ctx, img, pickCoord(tc.darkGrass, px, py), px, py)
      break
    case 17: // TALL_GRASS
      blitTile(ctx, img, pickCoord(tc.tallGrass, px, py), px, py)
      break
    case 1: // PATH
      blitTile(ctx, img, pickCoord(tc.path, px, py), px, py)
      break
    case 2: { // WATER (animated)
      const frame = Math.floor(tick / 15) % tc.water.length
      blitTile(ctx, img, tc.water[frame], px, py)
      break
    }
    case 3: // TREE
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.tree, px, py)
      break
    case 5: // MOUNTAIN
      blitTile(ctx, img, pickCoord(tc.mountain, px, py), px, py)
      break
    case 6: // FLOWER
      blitTile(ctx, img, pickCoord(tc.flower, px, py), px, py)
      break
    case 7: // BRIDGE (wooden planks over water)
      drawBase(ctx, img, 'water', px, py)
      // Draw wooden planks procedurally for a clear bridge
      ctx.fillStyle = '#8B6E4E'
      ctx.fillRect(Math.floor(px) + 1, Math.floor(py), 14, 16)
      ctx.fillStyle = '#A0825E'
      ctx.fillRect(Math.floor(px) + 2, Math.floor(py) + 1, 12, 3)
      ctx.fillRect(Math.floor(px) + 2, Math.floor(py) + 5, 12, 3)
      ctx.fillRect(Math.floor(px) + 2, Math.floor(py) + 9, 12, 3)
      ctx.fillRect(Math.floor(px) + 2, Math.floor(py) + 13, 12, 3)
      // Plank gaps
      ctx.fillStyle = '#6B5030'
      ctx.fillRect(Math.floor(px) + 1, Math.floor(py) + 4, 14, 1)
      ctx.fillRect(Math.floor(px) + 1, Math.floor(py) + 8, 14, 1)
      ctx.fillRect(Math.floor(px) + 1, Math.floor(py) + 12, 14, 1)
      // Side rails
      ctx.fillStyle = '#5B3E1E'
      ctx.fillRect(Math.floor(px), Math.floor(py), 2, 16)
      ctx.fillRect(Math.floor(px) + 14, Math.floor(py), 2, 16)
      break
    case 8: // FENCE
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.fence, px, py)
      break

    // House tiles - from overworld.png tileset (cols 7-9, rows 0-3)
    case 30: // ROOF_TL
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.houseRoofTL, px, py)
      break
    case 31: // ROOF_TC
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.houseRoofTC, px, py)
      break
    case 32: // ROOF_TR
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.houseRoofTR, px, py)
      break
    case 33: // ROOF_ML
      blitTile(ctx, img, tc.houseRoofML, px, py)
      break
    case 34: // ROOF_MC
      blitTile(ctx, img, tc.houseRoofMC, px, py)
      break
    case 35: // ROOF_MR
      blitTile(ctx, img, tc.houseRoofMR, px, py)
      break
    case 36: // WALL_L
      blitTile(ctx, img, tc.houseWallL, px, py)
      break
    case 37: // WALL_WIN
      blitTile(ctx, img, tc.houseWallWin, px, py)
      break
    case 38: // WALL_R
      blitTile(ctx, img, tc.houseWallR, px, py)
      break
    case 39: // WALL_DL
      blitTile(ctx, img, tc.houseWallDL, px, py)
      break
    case 40: // DOOR
      blitTile(ctx, img, tc.houseDoor, px, py)
      break
    case 41: // WALL_DR
      blitTile(ctx, img, tc.houseWallDR, px, py)
      break

    case 14: // SIGN
      drawBase(ctx, img, 'path', px, py)
      blitTile(ctx, img, tc.sign, px, py)
      break
    case 10: // SAND
      blitTile(ctx, img, pickCoord(tc.sand, px, py), px, py)
      break
    default:
      blitTile(ctx, img, tc.grass[0], px, py)
  }
}

// Character render size (draw 16x16 source at larger dest for visibility)
const CHAR_DRAW = 22 // destination size in tile-space (22px = 66px on screen at SCALE=3)
const CHAR_OFF = (CHAR_DRAW - S) / 2 // centering offset

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
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(Math.floor(px) + S + 2, Math.floor(py) + S - 2, 6, 3, 0.3, 0, Math.PI * 2)
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
  // Shadow behind right side of house
  ctx.fillRect(px + S * 3, py + S, 4, S * 3)
  // Shadow below house
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

// Draw player (16x16 chibi sprite, cols 0-2 of character.png)
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

// Draw NPC using character.png (16x16 chibi sprite, rendered larger)
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    drawPlayerSprite(ctx, atlas, direction || 'down', 1, px, py)
    return
  }

  const img = atlas.character
  // NPCs use frame 1 (standing/neutral pose)
  const frameIdx = 1

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
    case 50: { // FLOOR — wooden planks with grain
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Plank lines with slight color variation
      const h = tileHash(px, py)
      ctx.fillStyle = h % 3 === 0 ? IC.floorLight : IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4)
      ctx.moveTo(px, py + 10); ctx.lineTo(px + T, py + 10)
      ctx.stroke()
      // Wood grain dots
      ctx.fillStyle = IC.floorDark
      if (h % 5 === 0) ctx.fillRect(px + 3, py + 2, 1, 1)
      if (h % 7 === 0) ctx.fillRect(px + 10, py + 7, 1, 1)
      if (h % 11 === 0) ctx.fillRect(px + 6, py + 12, 1, 1)
      // Subtle highlight on top edge of each plank
      ctx.fillStyle = IC.floorLight
      ctx.globalAlpha = 0.3
      ctx.fillRect(px, py, T, 1)
      ctx.fillRect(px, py + 5, T, 1)
      ctx.fillRect(px, py + 11, T, 1)
      ctx.globalAlpha = 1
      break
    }

    case 51: { // WALL — stone blocks with mortar and depth
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      // Top section lighter (capstone)
      ctx.fillStyle = IC.wallTop
      ctx.fillRect(px, py, T, 6)
      // Highlight along very top
      ctx.fillStyle = IC.wallHighlight
      ctx.fillRect(px, py, T, 1)
      // Stone block lines (mortar)
      ctx.strokeStyle = '#4A4035'
      ctx.lineWidth = 0.4
      ctx.beginPath()
      // Horizontal mortar lines
      ctx.moveTo(px, py + 6); ctx.lineTo(px + T, py + 6)
      ctx.moveTo(px, py + 11); ctx.lineTo(px + T, py + 11)
      // Vertical mortar lines (offset pattern like bricks)
      ctx.moveTo(px + 5, py); ctx.lineTo(px + 5, py + 6)
      ctx.moveTo(px + 11, py); ctx.lineTo(px + 11, py + 6)
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 3, py + 11)
      ctx.moveTo(px + 8, py + 6); ctx.lineTo(px + 8, py + 11)
      ctx.moveTo(px + 13, py + 6); ctx.lineTo(px + 13, py + 11)
      ctx.moveTo(px + 6, py + 11); ctx.lineTo(px + 6, py + T)
      ctx.moveTo(px + 11, py + 11); ctx.lineTo(px + 11, py + T)
      ctx.stroke()
      // Shadow at bottom
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(px, py + T - 1, T, 1)
      break
    }

    case 52: { // TABLE — with shadow and wood grain
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Floor detail
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Table shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(px + 3, py + 13, 12, 2)
      // Legs
      ctx.fillStyle = IC.tableLeg
      ctx.fillRect(px + 2, py + 11, 2, 4)
      ctx.fillRect(px + 12, py + 11, 2, 4)
      // Table top
      ctx.fillStyle = IC.table
      ctx.fillRect(px + 1, py + 3, 14, 9)
      // Table top highlight
      ctx.fillStyle = IC.tableHighlight
      ctx.fillRect(px + 1, py + 3, 14, 2)
      // Wood grain
      ctx.strokeStyle = IC.tableLeg
      ctx.lineWidth = 0.3
      ctx.beginPath()
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 13, py + 6)
      ctx.moveTo(px + 3, py + 9); ctx.lineTo(px + 13, py + 9)
      ctx.stroke()
      break
    }

    case 53: { // CHAIR — with shadow and depth
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(px + 5, py + 13, 8, 2)
      // Legs
      ctx.fillStyle = IC.tableLeg
      ctx.fillRect(px + 4, py + 12, 2, 3)
      ctx.fillRect(px + 10, py + 12, 2, 3)
      // Seat
      ctx.fillStyle = IC.chair
      ctx.fillRect(px + 4, py + 5, 8, 7)
      // Back
      ctx.fillStyle = IC.chairHighlight
      ctx.fillRect(px + 3, py + 2, 10, 3)
      // Back detail (slats)
      ctx.fillStyle = IC.chair
      ctx.fillRect(px + 5, py + 2, 1, 3)
      ctx.fillRect(px + 8, py + 2, 1, 3)
      ctx.fillRect(px + 11, py + 2, 1, 3)
      break
    }

    case 54: { // BOOKSHELF — with more books and better detail
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      // Shelf body
      ctx.fillStyle = IC.shelf
      ctx.fillRect(px + 1, py + 1, 14, 14)
      // Shelf highlight
      ctx.fillStyle = IC.tableHighlight
      ctx.fillRect(px + 1, py + 1, 14, 1)
      // Shelf dividers
      ctx.fillStyle = IC.floorDark
      ctx.fillRect(px + 1, py + 5, 14, 1)
      ctx.fillRect(px + 1, py + 10, 14, 1)
      // Books (varied heights and colors)
      const books = [IC.book1, IC.book2, IC.book3, IC.book4, IC.shelfItem]
      // Top shelf
      ctx.fillStyle = books[0]; ctx.fillRect(px + 2, py + 2, 2, 3)
      ctx.fillStyle = books[1]; ctx.fillRect(px + 4, py + 3, 2, 2)
      ctx.fillStyle = books[2]; ctx.fillRect(px + 7, py + 2, 3, 3)
      ctx.fillStyle = books[3]; ctx.fillRect(px + 11, py + 2, 2, 3)
      // Middle shelf
      ctx.fillStyle = books[2]; ctx.fillRect(px + 2, py + 6, 3, 4)
      ctx.fillStyle = books[0]; ctx.fillRect(px + 6, py + 7, 2, 3)
      ctx.fillStyle = books[4]; ctx.fillRect(px + 9, py + 6, 2, 4)
      ctx.fillStyle = books[1]; ctx.fillRect(px + 12, py + 7, 2, 3)
      // Bottom shelf
      ctx.fillStyle = books[3]; ctx.fillRect(px + 2, py + 11, 2, 3)
      ctx.fillStyle = books[0]; ctx.fillRect(px + 5, py + 12, 3, 2)
      ctx.fillStyle = IC.shelfItem; ctx.fillRect(px + 9, py + 11, 4, 3)
      // Side shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(px + 14, py + 1, 1, 14)
      break
    }

    case 55: { // CARPET — ornate with border pattern
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Carpet base
      ctx.fillStyle = IC.carpet
      ctx.fillRect(px + 1, py + 1, 14, 14)
      // Inner border
      ctx.fillStyle = IC.carpetBorder
      ctx.fillRect(px + 1, py + 1, 14, 1)
      ctx.fillRect(px + 1, py + 14, 14, 1)
      ctx.fillRect(px + 1, py + 1, 1, 14)
      ctx.fillRect(px + 14, py + 1, 1, 14)
      // Inner area
      ctx.fillStyle = IC.carpetB
      ctx.fillRect(px + 3, py + 3, 10, 10)
      // Ornate diamond pattern
      ctx.fillStyle = IC.carpet
      ctx.fillRect(px + 7, py + 4, 2, 2)
      ctx.fillRect(px + 6, py + 5, 4, 2)
      ctx.fillRect(px + 5, py + 6, 6, 2)
      ctx.fillRect(px + 6, py + 8, 4, 2)
      ctx.fillRect(px + 7, py + 10, 2, 2)
      // Gold thread accents
      ctx.fillStyle = '#C7A755'
      ctx.fillRect(px + 8, py + 7, 1, 1)
      ctx.fillRect(px + 7, py + 8, 1, 1)
      break
    }

    case 56: { // QUEST_ALTAR — glowing pedestal with magical aura
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Pulsing glow aura
      const glow = 0.5 + Math.sin(tick * 0.08) * 0.3
      const auraSize = 2 + Math.sin(tick * 0.06) * 1
      ctx.save()
      ctx.globalAlpha = glow * 0.25
      ctx.fillStyle = '#FFE0A0'
      ctx.beginPath()
      ctx.arc(px + T / 2, py + T / 2, T * 0.7 + auraSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      // Floor glow circle
      ctx.save()
      ctx.globalAlpha = glow * 0.15
      const floorGrad = ctx.createRadialGradient(px + T / 2, py + T - 2, 0, px + T / 2, py + T - 2, T * 0.8)
      floorGrad.addColorStop(0, '#FFE0A0')
      floorGrad.addColorStop(1, 'rgba(255,224,160,0)')
      ctx.fillStyle = floorGrad
      ctx.fillRect(px - 4, py, T + 8, T + 4)
      ctx.restore()
      // Pedestal base
      ctx.fillStyle = '#777'
      ctx.fillRect(px + 2, py + 10, 12, 5)
      // Pedestal top
      ctx.fillStyle = '#999'
      ctx.fillRect(px + 3, py + 5, 10, 6)
      // Pedestal highlight
      ctx.fillStyle = '#aaa'
      ctx.fillRect(px + 3, py + 5, 10, 1)
      // Glowing book/scroll
      ctx.fillStyle = IC.altarGlow
      ctx.fillRect(px + 4, py + 2, 8, 5)
      ctx.fillStyle = IC.altar
      ctx.fillRect(px + 5, py + 3, 6, 3)
      // Page lines
      ctx.strokeStyle = '#BBA866'
      ctx.lineWidth = 0.3
      ctx.beginPath()
      ctx.moveTo(px + 6, py + 4); ctx.lineTo(px + 10, py + 4)
      ctx.moveTo(px + 6, py + 5); ctx.lineTo(px + 10, py + 5)
      ctx.stroke()
      // Animated sparkles
      const spark1 = Math.sin(tick * 0.12) > 0.3
      const spark2 = Math.sin(tick * 0.12 + 2) > 0.3
      const spark3 = Math.sin(tick * 0.12 + 4) > 0.3
      ctx.fillStyle = '#fff'
      if (spark1) ctx.fillRect(px + 3, py + 1, 1, 1)
      if (spark2) ctx.fillRect(px + 11, py + 2, 1, 1)
      if (spark3) ctx.fillRect(px + 7, py, 1, 1)
      break
    }

    case 57: { // BARREL — rounded with better bands and shadow
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      // Barrel body
      ctx.fillStyle = IC.barrel
      ctx.fillRect(px + 4, py + 2, 8, 12)
      // Wider middle (barrel shape)
      ctx.fillRect(px + 3, py + 5, 10, 6)
      // Highlight
      ctx.fillStyle = IC.barrelHighlight
      ctx.fillRect(px + 4, py + 2, 3, 12)
      // Metal bands
      ctx.fillStyle = IC.barrelBand
      ctx.fillRect(px + 3, py + 4, 10, 1)
      ctx.fillRect(px + 3, py + 8, 10, 1)
      ctx.fillRect(px + 3, py + 12, 10, 1)
      // Top rim
      ctx.fillStyle = '#6A5838'
      ctx.fillRect(px + 4, py + 2, 8, 1)
      break
    }

    case 58: { // BED — with shadow, pillow detail, blanket folds
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(px + 2, py + 14, 12, 1)
      // Frame
      ctx.fillStyle = IC.table
      ctx.fillRect(px + 1, py + 1, 14, 14)
      // Frame highlight
      ctx.fillStyle = IC.tableHighlight
      ctx.fillRect(px + 1, py + 1, 14, 1)
      // Pillow
      ctx.fillStyle = IC.bed
      ctx.fillRect(px + 3, py + 2, 10, 4)
      // Pillow highlight
      ctx.fillStyle = '#D8C8B0'
      ctx.fillRect(px + 4, py + 3, 4, 2)
      // Blanket
      ctx.fillStyle = IC.bedBlanket
      ctx.fillRect(px + 2, py + 6, 12, 8)
      // Blanket highlight
      ctx.fillStyle = IC.bedBlanketHighlight
      ctx.fillRect(px + 2, py + 6, 12, 2)
      // Blanket fold lines
      ctx.strokeStyle = '#1B5A9A'
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(px + 4, py + 10); ctx.lineTo(px + 12, py + 10)
      ctx.stroke()
      break
    }

    case 59: { // DOOR_MAT — with welcome pattern and arrow
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Mat border
      ctx.fillStyle = IC.rugBorder
      ctx.fillRect(px + 1, py + 3, 14, 10)
      // Mat inner
      ctx.fillStyle = IC.rug
      ctx.fillRect(px + 2, py + 4, 12, 8)
      // Inner pattern
      ctx.fillStyle = '#AA4444'
      ctx.fillRect(px + 3, py + 5, 10, 6)
      // Exit arrow
      ctx.fillStyle = IC.rugBorder
      ctx.fillRect(px + 7, py + 6, 2, 4)
      ctx.fillRect(px + 5, py + 8, 6, 2)
      break
    }

    case 60: { // TORCH_WALL — with warm light pool
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.wallTop
      ctx.fillRect(px, py, T, 6)
      // Highlight
      ctx.fillStyle = IC.wallHighlight
      ctx.fillRect(px, py, T, 1)
      // Warm light pool on wall
      ctx.save()
      const lightPulse = 0.3 + Math.sin(tick * 0.1 + px) * 0.1
      ctx.globalAlpha = lightPulse
      const lightGrad = ctx.createRadialGradient(px + 8, py + 5, 0, px + 8, py + 5, 10)
      lightGrad.addColorStop(0, '#FF882244')
      lightGrad.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = lightGrad
      ctx.fillRect(px - 4, py - 4, T + 8, T + 8)
      ctx.restore()
      // Torch bracket
      ctx.fillStyle = IC.torchBase
      ctx.fillRect(px + 6, py + 7, 4, 6)
      ctx.fillStyle = '#666'
      ctx.fillRect(px + 6, py + 7, 4, 1)
      // Flame — animated with multiple colors
      const flicker = Math.sin(tick * 0.15 + px) * 0.8
      const flicker2 = Math.cos(tick * 0.2 + px) * 0.5
      // Outer flame
      ctx.fillStyle = '#FF4400'
      ctx.fillRect(px + 5 + flicker, py + 3, 6, 5)
      // Inner flame
      ctx.fillStyle = IC.torch
      ctx.fillRect(px + 6 + flicker2, py + 3, 4, 4)
      // Core
      ctx.fillStyle = '#FFDD44'
      ctx.fillRect(px + 7, py + 4, 2, 2)
      // Tip
      ctx.fillStyle = '#FFEE88'
      ctx.fillRect(px + 7 + flicker2 * 0.5, py + 2, 2, 2)
      break
    }

    case 61: { // POT/VASE — with shadow and highlight
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.beginPath()
      ctx.ellipse(px + 8, py + 14, 4, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      // Pot body
      ctx.fillStyle = IC.pot
      ctx.fillRect(px + 4, py + 6, 8, 8)
      // Pot neck
      ctx.fillRect(px + 5, py + 4, 6, 3)
      // Pot rim
      ctx.fillStyle = '#BB8855'
      ctx.fillRect(px + 4, py + 4, 8, 1)
      // Highlight
      ctx.fillStyle = IC.potHighlight
      ctx.fillRect(px + 5, py + 6, 2, 6)
      // Band
      ctx.fillStyle = '#886633'
      ctx.fillRect(px + 4, py + 9, 8, 1)
      break
    }

    case 62: { // CHEST — with shadow, shine, and keyhole detail
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.strokeStyle = IC.floorDark; ctx.lineWidth = 0.3
      ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4); ctx.stroke()
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(px + 3, py + 14, 11, 1)
      // Chest body
      ctx.fillStyle = IC.chest
      ctx.fillRect(px + 2, py + 5, 12, 9)
      // Highlight (top surface)
      ctx.fillStyle = IC.chestHighlight
      ctx.fillRect(px + 2, py + 5, 12, 2)
      // Metal bands
      ctx.fillStyle = IC.chestBand
      ctx.fillRect(px + 2, py + 8, 12, 1)
      ctx.fillRect(px + 2, py + 12, 12, 1)
      ctx.fillRect(px + 7, py + 5, 2, 9)
      // Corner studs
      ctx.fillStyle = '#998800'
      ctx.fillRect(px + 2, py + 5, 1, 1)
      ctx.fillRect(px + 13, py + 5, 1, 1)
      ctx.fillRect(px + 2, py + 13, 1, 1)
      ctx.fillRect(px + 13, py + 13, 1, 1)
      // Lock/keyhole
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(px + 7, py + 9, 2, 2)
      ctx.fillStyle = '#CC9900'
      ctx.fillRect(px + 7, py + 10, 2, 1)
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

// Generate interior map for a zone — each house has unique layout
export function generateInterior(zone) {
  const W = 14, H = 12
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  // Walls on all edges
  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H-1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W-1] = IT.WALL }

  // Door mat at bottom center
  m[H-1][6] = IT.DOOR_MAT
  m[H-1][7] = IT.DOOR_MAT

  // Torches on top wall
  m[0][2] = IT.TORCH
  m[0][W-3] = IT.TORCH
  // Torches on side walls
  m[4][0] = IT.TORCH
  m[4][W-1] = IT.TORCH
  m[8][0] = IT.TORCH
  m[8][W-1] = IT.TORCH

  // Quest altar in center-top
  m[2][6] = IT.ALTAR
  m[2][7] = IT.ALTAR

  // Carpet leading from altar to door
  for (let y = 3; y <= H-2; y++) {
    m[y][6] = IT.CARPET
    m[y][7] = IT.CARPET
  }

  // Unique layouts per house
  if (zone.id === 1) {
    // Cabane de la Verite — warm study, writing room
    // Bookshelves along top
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][3] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF; m[1][W-4] = IT.BOOKSHELF
    // Writing tables left
    m[3][2] = IT.TABLE; m[3][3] = IT.TABLE
    m[4][2] = IT.CHAIR; m[4][3] = IT.CHAIR
    // Writing tables right
    m[3][W-3] = IT.TABLE; m[3][W-4] = IT.TABLE
    m[4][W-3] = IT.CHAIR; m[4][W-4] = IT.CHAIR
    // Cozy corner: bed and chest (rest area)
    m[7][1] = IT.BED; m[8][1] = IT.CHEST
    // Pots and barrels for ambiance
    m[6][1] = IT.POT
    m[9][W-2] = IT.POT
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL
    m[7][W-2] = IT.BARREL
    // Second row of bookshelves mid-left
    m[6][2] = IT.BOOKSHELF; m[6][3] = IT.BOOKSHELF
  } else if (zone.id === 2) {
    // Tour de l'Inventaire — organized archive, inventory room
    // Long bookshelves both sides
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    // Chests (storage) left
    m[3][1] = IT.CHEST; m[3][2] = IT.CHEST
    m[5][1] = IT.CHEST
    // Chests right
    m[3][W-2] = IT.CHEST; m[3][W-3] = IT.CHEST
    m[5][W-2] = IT.CHEST
    // Central work tables
    m[5][4] = IT.TABLE; m[5][5] = IT.TABLE
    m[5][8] = IT.TABLE; m[5][9] = IT.TABLE
    // Chairs at tables
    m[6][4] = IT.CHAIR; m[6][5] = IT.CHAIR
    m[6][8] = IT.CHAIR; m[6][9] = IT.CHAIR
    // Pots and barrels
    m[8][1] = IT.POT; m[9][1] = IT.BARREL
    m[8][W-2] = IT.POT; m[9][W-2] = IT.BARREL
    // More bookshelves lower
    m[8][2] = IT.BOOKSHELF; m[8][3] = IT.BOOKSHELF
    m[8][W-3] = IT.BOOKSHELF; m[8][W-4] = IT.BOOKSHELF
  } else if (zone.id === 3) {
    // Forge du Silence — meditation room, sparse and calm
    // Minimal furniture: emphasis on open space
    m[1][1] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF
    // Meditation pots around altar
    m[2][4] = IT.POT; m[2][9] = IT.POT
    m[3][1] = IT.POT; m[3][W-2] = IT.POT
    // Single table and chair (journaling spot)
    m[5][2] = IT.TABLE; m[5][3] = IT.TABLE
    m[6][2] = IT.CHAIR
    // Bed for rest
    m[8][W-2] = IT.BED; m[8][W-3] = IT.BED
    // Barrels for supplies
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL
    m[9][W-2] = IT.BARREL
    // Chest with tracking tools
    m[7][1] = IT.CHEST
  } else {
    // Default: generic layout
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[4][2] = IT.CHAIR
    m[3][W-3] = IT.TABLE; m[4][W-3] = IT.CHAIR
    m[7][1] = IT.BARREL; m[7][W-2] = IT.POT
  }

  return { map: m, width: W, height: H, spawnX: 6, spawnY: H - 2 }
}

export { S }
