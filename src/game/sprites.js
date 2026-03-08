// VDX Quest Sprite System — Procedural + Tileset hybrid
// Procedural: grass, trees, water, flowers, paths, sand, mountains, fences, bridges
// Tileset: houses (from overworld.png cols 7-9, rows 0-3)
// Characters: from character.png with corrected frame indices

const S = 16 // tile size

// House tile coordinates from overworld.png tileset (these look good)
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
  sign:         { x: 30, y: 0 },
}

// character.png layout — VERIFIED via pixel analysis:
// Col 4 and col 8 are EMPTY in rows 0-3. Use frame 0 (first frame) for NPCs.
// Group 0 (rows 0-3): player=cols0-2, mentor=cols3-5(gap@4), char3=cols6-8(gap@8), warrior=cols9-11, sage=cols12-14
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

// ==================== PROCEDURAL TILE COLORS ====================
const GRASS_COLORS = ['#5ABF3E', '#52B536', '#4DAD32', '#58C23C']
const GRASS_DARK = ['#3E8A2A', '#3C8528', '#3A8026']
const GRASS_LIGHT = ['#6ECD4E', '#72D152', '#7DD85A']

// ==================== PROCEDURAL TILE DRAWING ====================
function drawGrass(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  // Base
  ctx.fillStyle = GRASS_COLORS[h % GRASS_COLORS.length]
  ctx.fillRect(x, y, S, S)
  // Subtle variation patches
  ctx.fillStyle = GRASS_LIGHT[h % GRASS_LIGHT.length]
  ctx.globalAlpha = 0.25
  if (h % 3 === 0) ctx.fillRect(x + 2, y + 1, 5, 4)
  if (h % 5 === 0) ctx.fillRect(x + 8, y + 9, 6, 5)
  if (h % 7 === 0) ctx.fillRect(x + 1, y + 10, 4, 4)
  ctx.globalAlpha = 1
  // Small blade marks (darker)
  ctx.fillStyle = GRASS_DARK[h % GRASS_DARK.length]
  ctx.globalAlpha = 0.35
  if (h % 4 === 0) { ctx.fillRect(x + 3, y + 5, 1, 2); ctx.fillRect(x + 11, y + 2, 1, 2) }
  if (h % 6 === 0) { ctx.fillRect(x + 7, y + 11, 1, 2); ctx.fillRect(x + 14, y + 7, 1, 2) }
  ctx.globalAlpha = 1
}

function drawDarkGrass(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  ctx.fillStyle = GRASS_DARK[h % GRASS_DARK.length]
  ctx.fillRect(x, y, S, S)
  // Darker patches
  ctx.fillStyle = '#2D6F1E'
  ctx.globalAlpha = 0.3
  if (h % 3 === 0) ctx.fillRect(x + 1, y + 2, 6, 5)
  if (h % 5 === 0) ctx.fillRect(x + 7, y + 8, 5, 6)
  ctx.globalAlpha = 1
  // Light accent
  ctx.fillStyle = '#4DA832'
  ctx.globalAlpha = 0.2
  if (h % 4 === 0) ctx.fillRect(x + 4, y + 1, 3, 2)
  ctx.globalAlpha = 1
}

function drawTallGrass(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  // Base grass
  drawGrass(ctx, px, py)
  // Tall grass tufts on top
  ctx.fillStyle = '#3E8A2A'
  ctx.fillRect(x + 2, y, 2, 6)
  ctx.fillRect(x + 6, y + 1, 2, 7)
  ctx.fillRect(x + 10, y, 2, 5)
  ctx.fillRect(x + 13, y + 2, 2, 6)
  // Tips (lighter)
  ctx.fillStyle = '#5DBF40'
  ctx.fillRect(x + 2, y, 2, 2)
  ctx.fillRect(x + 6, y + 1, 2, 2)
  ctx.fillRect(x + 10, y, 2, 2)
  ctx.fillRect(x + 13, y + 2, 2, 2)
  // Variation
  if (h % 3 === 0) {
    ctx.fillStyle = '#357A22'
    ctx.fillRect(x + 4, y + 3, 2, 5)
    ctx.fillStyle = '#4DA832'
    ctx.fillRect(x + 4, y + 3, 2, 2)
  }
}

function drawPath(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  // Base dirt
  ctx.fillStyle = '#C4A46C'
  ctx.fillRect(x, y, S, S)
  // Variation
  const pathColors = ['#CAAA72', '#BDA066', '#C8A86E']
  ctx.fillStyle = pathColors[h % pathColors.length]
  ctx.fillRect(x, y, S, S)
  // Small stones/pebbles
  ctx.fillStyle = '#B89858'
  ctx.globalAlpha = 0.4
  if (h % 3 === 0) ctx.fillRect(x + 3, y + 4, 2, 2)
  if (h % 5 === 0) ctx.fillRect(x + 9, y + 10, 2, 1)
  if (h % 7 === 0) ctx.fillRect(x + 12, y + 3, 1, 2)
  if (h % 4 === 0) ctx.fillRect(x + 6, y + 12, 2, 1)
  ctx.globalAlpha = 1
  // Slight lighter edge
  ctx.fillStyle = '#D4B47C'
  ctx.globalAlpha = 0.15
  ctx.fillRect(x, y, S, 1)
  ctx.globalAlpha = 1
}

function drawWater(ctx, px, py, tick) {
  const x = Math.floor(px), y = Math.floor(py)
  // Base water
  ctx.fillStyle = '#3A8DD4'
  ctx.fillRect(x, y, S, S)
  // Deeper center
  ctx.fillStyle = '#2E7BC0'
  ctx.fillRect(x + 2, y + 2, S - 4, S - 4)
  // Animated wave lines
  const wave = Math.sin(tick * 0.08 + px * 0.3) * 2
  const wave2 = Math.sin(tick * 0.06 + py * 0.4 + 1) * 2
  ctx.fillStyle = '#5CA8E8'
  ctx.globalAlpha = 0.5
  ctx.fillRect(x + 1 + wave, y + 4, 8, 1)
  ctx.fillRect(x + 5 + wave2, y + 10, 7, 1)
  ctx.globalAlpha = 1
  // Highlight sparkle
  ctx.fillStyle = '#9AD4FF'
  ctx.globalAlpha = 0.3 + Math.sin(tick * 0.12 + px + py) * 0.2
  ctx.fillRect(x + 4 + Math.floor(wave * 0.5), y + 2, 2, 1)
  ctx.fillRect(x + 10, y + 7 + Math.floor(wave2 * 0.3), 2, 1)
  ctx.globalAlpha = 1
}

function drawTree(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  // Grass base under tree
  drawGrass(ctx, px, py)
  // Trunk (brown, centered)
  ctx.fillStyle = '#6B4423'
  ctx.fillRect(x + 6, y + 11, 4, 5)
  // Trunk highlight
  ctx.fillStyle = '#7D5533'
  ctx.fillRect(x + 6, y + 11, 2, 5)
  // Canopy — outer shadow/outline (dark green circle)
  ctx.fillStyle = '#2B5A1B'
  ctx.beginPath()
  ctx.arc(x + 8, y + 7, 7.5, 0, Math.PI * 2)
  ctx.fill()
  // Canopy — main body (medium green)
  ctx.fillStyle = '#3D8B2B'
  ctx.beginPath()
  ctx.arc(x + 8, y + 7, 6.5, 0, Math.PI * 2)
  ctx.fill()
  // Canopy — highlight area (lighter, offset top-left)
  ctx.fillStyle = '#55B83E'
  ctx.beginPath()
  ctx.arc(x + 6, y + 5, 4, 0, Math.PI * 2)
  ctx.fill()
  // Canopy — bright spot (very light, small)
  ctx.fillStyle = '#72D054'
  ctx.beginPath()
  ctx.arc(x + 5, y + 4, 2, 0, Math.PI * 2)
  ctx.fill()
  // Subtle variation based on hash
  if (h % 3 === 0) {
    ctx.fillStyle = '#4AA535'
    ctx.beginPath()
    ctx.arc(x + 10, y + 9, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawMountain(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  // Base
  ctx.fillStyle = '#8A8A8A'
  ctx.fillRect(x, y, S, S)
  // Mountain shape (triangular)
  ctx.fillStyle = '#9A9A9A'
  ctx.beginPath()
  ctx.moveTo(x + 8, y + 1)
  ctx.lineTo(x + 15, y + 15)
  ctx.lineTo(x + 1, y + 15)
  ctx.closePath()
  ctx.fill()
  // Darker side
  ctx.fillStyle = '#707070'
  ctx.beginPath()
  ctx.moveTo(x + 8, y + 1)
  ctx.lineTo(x + 15, y + 15)
  ctx.lineTo(x + 8, y + 15)
  ctx.closePath()
  ctx.fill()
  // Snow cap
  ctx.fillStyle = '#E8E8F0'
  ctx.beginPath()
  ctx.moveTo(x + 8, y + 1)
  ctx.lineTo(x + 11, y + 5)
  ctx.lineTo(x + 5, y + 5)
  ctx.closePath()
  ctx.fill()
}

function drawFlower(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  drawGrass(ctx, px, py)
  // Flower clusters (colorful dots)
  const flowerColors = ['#E84040', '#E8D040', '#D040D0', '#4080E8', '#E87040', '#E840A0']
  const c1 = flowerColors[h % flowerColors.length]
  const c2 = flowerColors[(h + 2) % flowerColors.length]
  const c3 = flowerColors[(h + 4) % flowerColors.length]
  // Flower petals (larger, visible)
  ctx.fillStyle = c1
  ctx.fillRect(x + 3, y + 3, 3, 3)
  ctx.fillStyle = '#FFE855'
  ctx.fillRect(x + 4, y + 4, 1, 1) // center
  ctx.fillStyle = c2
  ctx.fillRect(x + 10, y + 7, 3, 3)
  ctx.fillStyle = '#FFE855'
  ctx.fillRect(x + 11, y + 8, 1, 1)
  ctx.fillStyle = c3
  ctx.fillRect(x + 5, y + 11, 3, 3)
  ctx.fillStyle = '#FFE855'
  ctx.fillRect(x + 6, y + 12, 1, 1)
  // Extra smaller flower if hash permits
  if (h % 3 === 0) {
    ctx.fillStyle = c1
    ctx.fillRect(x + 12, y + 2, 2, 2)
  }
}

function drawSand(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  const h = tileHash(px, py)
  const sandColors = ['#E8D8A8', '#E0D0A0', '#DCC898']
  ctx.fillStyle = sandColors[h % sandColors.length]
  ctx.fillRect(x, y, S, S)
  // Subtle dots
  ctx.fillStyle = '#D4C490'
  ctx.globalAlpha = 0.3
  if (h % 4 === 0) ctx.fillRect(x + 5, y + 3, 1, 1)
  if (h % 6 === 0) ctx.fillRect(x + 11, y + 10, 1, 1)
  ctx.globalAlpha = 1
}

function drawFence(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  drawGrass(ctx, px, py)
  // Fence posts
  ctx.fillStyle = '#7A5C32'
  ctx.fillRect(x + 1, y + 4, 3, 10)
  ctx.fillRect(x + 12, y + 4, 3, 10)
  // Horizontal rails
  ctx.fillStyle = '#8B6E42'
  ctx.fillRect(x, y + 5, S, 2)
  ctx.fillRect(x, y + 10, S, 2)
  // Rail highlights
  ctx.fillStyle = '#9B7E52'
  ctx.fillRect(x, y + 5, S, 1)
  ctx.fillRect(x, y + 10, S, 1)
  // Post caps
  ctx.fillStyle = '#9B7E52'
  ctx.fillRect(x + 1, y + 3, 3, 2)
  ctx.fillRect(x + 12, y + 3, 3, 2)
}

function drawBridge(ctx, px, py, tick) {
  const x = Math.floor(px), y = Math.floor(py)
  drawWater(ctx, px, py, tick)
  // Wooden planks
  ctx.fillStyle = '#8B6E4E'
  ctx.fillRect(x + 1, y, 14, S)
  // Individual planks
  ctx.fillStyle = '#A0825E'
  ctx.fillRect(x + 2, y + 1, 12, 3)
  ctx.fillRect(x + 2, y + 5, 12, 3)
  ctx.fillRect(x + 2, y + 9, 12, 3)
  ctx.fillRect(x + 2, y + 13, 12, 3)
  // Plank gaps
  ctx.fillStyle = '#6B5030'
  ctx.fillRect(x + 1, y + 4, 14, 1)
  ctx.fillRect(x + 1, y + 8, 14, 1)
  ctx.fillRect(x + 1, y + 12, 14, 1)
  // Side rails
  ctx.fillStyle = '#5B3E1E'
  ctx.fillRect(x, y, 2, S)
  ctx.fillRect(x + 14, y, 2, S)
}

function drawSign(ctx, px, py) {
  const x = Math.floor(px), y = Math.floor(py)
  drawPath(ctx, px, py)
  // Post
  ctx.fillStyle = '#6B4423'
  ctx.fillRect(x + 7, y + 7, 2, 9)
  // Sign board
  ctx.fillStyle = '#8B6E42'
  ctx.fillRect(x + 3, y + 2, 10, 6)
  // Board outline
  ctx.fillStyle = '#6B4E22'
  ctx.fillRect(x + 3, y + 2, 10, 1)
  ctx.fillRect(x + 3, y + 7, 10, 1)
  ctx.fillRect(x + 3, y + 2, 1, 6)
  ctx.fillRect(x + 12, y + 2, 1, 6)
  // Text lines
  ctx.fillStyle = '#4A3A1A'
  ctx.fillRect(x + 5, y + 4, 6, 1)
  ctx.fillRect(x + 5, y + 6, 4, 1)
}

// ==================== MAIN TILE DRAW ====================
export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const img = atlas.overworld

  switch (tileType) {
    case 0: drawGrass(ctx, px, py); break
    case 9: drawDarkGrass(ctx, px, py); break
    case 17: drawTallGrass(ctx, px, py); break
    case 1: drawPath(ctx, px, py); break
    case 2: drawWater(ctx, px, py, tick); break
    case 3: drawTree(ctx, px, py); break
    case 5: drawMountain(ctx, px, py); break
    case 6: drawFlower(ctx, px, py); break
    case 7: drawBridge(ctx, px, py, tick); break
    case 8: drawFence(ctx, px, py); break
    case 10: drawSand(ctx, px, py); break
    case 14: drawSign(ctx, px, py); break

    // House tiles — keep from tileset (they look good)
    case 30: drawGrass(ctx, px, py); blitTile(ctx, img, HOUSE_TILES.houseRoofTL, px, py); break
    case 31: drawGrass(ctx, px, py); blitTile(ctx, img, HOUSE_TILES.houseRoofTC, px, py); break
    case 32: drawGrass(ctx, px, py); blitTile(ctx, img, HOUSE_TILES.houseRoofTR, px, py); break
    case 33: blitTile(ctx, img, HOUSE_TILES.houseRoofML, px, py); break
    case 34: blitTile(ctx, img, HOUSE_TILES.houseRoofMC, px, py); break
    case 35: blitTile(ctx, img, HOUSE_TILES.houseRoofMR, px, py); break
    case 36: blitTile(ctx, img, HOUSE_TILES.houseWallL, px, py); break
    case 37: blitTile(ctx, img, HOUSE_TILES.houseWallWin, px, py); break
    case 38: blitTile(ctx, img, HOUSE_TILES.houseWallR, px, py); break
    case 39: blitTile(ctx, img, HOUSE_TILES.houseWallDL, px, py); break
    case 40: blitTile(ctx, img, HOUSE_TILES.houseDoor, px, py); break
    case 41: blitTile(ctx, img, HOUSE_TILES.houseWallDR, px, py); break

    default: drawGrass(ctx, px, py)
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

// Draw player (cols 0-2 of character.png)
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

// Draw NPC using character.png — FIXED: use frame 0 (frame 1 is empty for some chars!)
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    drawPlayerSprite(ctx, atlas, direction || 'down', 0, px, py)
    return
  }

  const img = atlas.character
  // CRITICAL FIX: Use frame 0 instead of frame 1.
  // Pixel analysis showed col 4 (mentor frame 1) and col 8 are EMPTY in rows 0-3.
  // Frame 0 always has the best pixel content (100+ pixels vs 0-54 for frame 1).
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
