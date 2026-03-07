// VDX Quest RPG Engine - Pokemon-style top-down RPG

const TILE = 32
const COLS = 40
const ROWS = 30

// Tile types
const T = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  ZONE: 4,
  MOUNTAIN: 5,
  FLOWER: 6,
  BRIDGE: 7,
  FENCE: 8,
  DARK_GRASS: 9,
}

// Which tiles block movement
const SOLID = new Set([T.WATER, T.TREE, T.MOUNTAIN, T.FENCE])

// Zone definitions (12 weeks)
const ZONES = [
  { id: 1, x: 6, y: 25, label: 'S1' },
  { id: 2, x: 14, y: 23, label: 'S2' },
  { id: 3, x: 22, y: 25, label: 'S3' },
  { id: 4, x: 30, y: 22, label: 'S4' },
  { id: 5, x: 34, y: 16, label: 'S5' },
  { id: 6, x: 27, y: 13, label: 'S6' },
  { id: 7, x: 19, y: 15, label: 'S7' },
  { id: 8, x: 11, y: 13, label: 'S8' },
  { id: 9, x: 7, y: 8, label: 'S9' },
  { id: 10, x: 15, y: 5, label: 'S10' },
  { id: 11, x: 25, y: 7, label: 'S11' },
  { id: 12, x: 20, y: 2, label: 'S12' },
]

// Generate the map
function generateMap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // Scatter flowers
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(Math.random() * COLS)
    const y = Math.floor(Math.random() * ROWS)
    if (map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Dark grass patches
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * COLS)
    const y = Math.floor(Math.random() * ROWS)
    if (map[y][x] === T.GRASS) map[y][x] = T.DARK_GRASS
  }

  // Water features
  // Pond bottom-left
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const nx = 3 + dx, ny = 21 + dy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
        if (Math.abs(dx) + Math.abs(dy) <= 3) map[ny][nx] = T.WATER
      }
    }
  }
  // River in middle
  for (let x = 0; x < 8; x++) {
    map[17][x] = T.WATER
    map[18][x] = T.WATER
  }

  // Trees - scatter around edges and between zones
  const treePositions = []
  // Border trees
  for (let x = 0; x < COLS; x++) {
    if (Math.random() > 0.3) { map[0][x] = T.TREE; treePositions.push([x, 0]) }
    if (Math.random() > 0.3) { map[ROWS - 1][x] = T.TREE }
  }
  for (let y = 0; y < ROWS; y++) {
    if (Math.random() > 0.3) map[y][0] = T.TREE
    if (Math.random() > 0.3) map[y][COLS - 1] = T.TREE
  }
  // Forest clusters
  const forests = [[2, 15], [35, 5], [37, 25], [1, 5], [33, 10]]
  for (const [fx, fy] of forests) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = fx + dx, ny = fy + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && Math.random() > 0.3) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // Mountains top area
  for (let x = 30; x < 38; x++) {
    for (let y = 0; y < 4; y++) {
      if (Math.random() > 0.4) map[y][x] = T.MOUNTAIN
    }
  }
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 3; y++) {
      if (Math.random() > 0.4) map[y][x] = T.MOUNTAIN
    }
  }

  // Draw paths between zones
  const pathPoints = [
    { x: 6, y: 27 }, // Start
    ...ZONES.map(z => ({ x: z.x, y: z.y })),
  ]
  for (let i = 0; i < pathPoints.length - 1; i++) {
    drawPath(map, pathPoints[i], pathPoints[i + 1])
  }

  // Place zone buildings (clear area around each zone)
  for (const zone of ZONES) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = zone.x + dx, ny = zone.y + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
          map[ny][nx] = T.PATH
        }
      }
    }
    map[zone.y][zone.x] = T.ZONE
  }

  // Bridge over river
  map[17][8] = T.BRIDGE
  map[18][8] = T.BRIDGE

  return map
}

function drawPath(map, from, to) {
  let x = from.x, y = from.y
  while (x !== to.x || y !== to.y) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      if (map[y][x] !== T.ZONE && map[y][x] !== T.BRIDGE) {
        map[y][x] = T.PATH
      }
      // Widen path
      if (x + 1 < COLS && map[y][x + 1] !== T.ZONE && map[y][x + 1] !== T.WATER) {
        map[y][x + 1] = T.PATH
      }
    }
    // Move horizontally first, then vertically
    if (Math.random() > 0.3) {
      if (x < to.x) x++
      else if (x > to.x) x--
      else if (y < to.y) y++
      else if (y > to.y) y--
    } else {
      if (y < to.y) y++
      else if (y > to.y) y--
      else if (x < to.x) x++
      else if (x > to.x) x--
    }
  }
}

// Tile colors and drawing
const COLORS = {
  [T.GRASS]: '#2d5a1e',
  [T.PATH]: '#c4a84d',
  [T.WATER]: '#1a5276',
  [T.TREE]: '#1a3d12',
  [T.ZONE]: '#c7b777',
  [T.MOUNTAIN]: '#5a5a6a',
  [T.FLOWER]: '#2d5a1e',
  [T.BRIDGE]: '#8b6914',
  [T.FENCE]: '#6b4a2a',
  [T.DARK_GRASS]: '#245018',
}

function drawTile(ctx, type, px, py) {
  const s = TILE
  ctx.fillStyle = COLORS[type] || '#2d5a1e'
  ctx.fillRect(px, py, s, s)

  switch (type) {
    case T.GRASS:
      ctx.fillStyle = '#347a24'
      ctx.fillRect(px + 4, py + 8, 2, 6)
      ctx.fillRect(px + 14, py + 4, 2, 5)
      ctx.fillRect(px + 24, py + 16, 2, 6)
      break

    case T.DARK_GRASS:
      ctx.fillStyle = '#1e4510'
      ctx.fillRect(px + 6, py + 6, 2, 8)
      ctx.fillRect(px + 18, py + 12, 2, 7)
      ctx.fillRect(px + 26, py + 4, 2, 8)
      break

    case T.PATH:
      ctx.fillStyle = '#b89a3d'
      ctx.fillRect(px + 2, py + 2, 4, 4)
      ctx.fillRect(px + 20, py + 18, 5, 4)
      break

    case T.WATER:
      ctx.fillStyle = '#2471a3'
      ctx.fillRect(px + 4, py + 10, 12, 2)
      ctx.fillRect(px + 16, py + 20, 10, 2)
      break

    case T.TREE:
      // Trunk
      ctx.fillStyle = '#5a3a1a'
      ctx.fillRect(px + 12, py + 18, 8, 14)
      // Canopy
      ctx.fillStyle = '#1e7a1e'
      ctx.beginPath()
      ctx.arc(px + 16, py + 14, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#2a9a2a'
      ctx.beginPath()
      ctx.arc(px + 14, py + 12, 6, 0, Math.PI * 2)
      ctx.fill()
      break

    case T.ZONE:
      // Building base
      ctx.fillStyle = '#1a1a2a'
      ctx.fillRect(px + 2, py + 8, 28, 22)
      // Roof
      ctx.fillStyle = '#c7b777'
      ctx.beginPath()
      ctx.moveTo(px, py + 10)
      ctx.lineTo(px + 16, py)
      ctx.lineTo(px + 32, py + 10)
      ctx.fill()
      // Door
      ctx.fillStyle = '#c7b777'
      ctx.fillRect(px + 12, py + 18, 8, 12)
      // Window
      ctx.fillStyle = '#ffeebb'
      ctx.fillRect(px + 5, py + 12, 6, 5)
      ctx.fillRect(px + 21, py + 12, 6, 5)
      break

    case T.MOUNTAIN:
      ctx.fillStyle = '#7a7a8a'
      ctx.beginPath()
      ctx.moveTo(px, py + s)
      ctx.lineTo(px + s / 2, py)
      ctx.lineTo(px + s, py + s)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(px + s / 2 - 4, py + 6)
      ctx.lineTo(px + s / 2, py)
      ctx.lineTo(px + s / 2 + 4, py + 6)
      ctx.fill()
      break

    case T.FLOWER:
      // Grass base
      ctx.fillStyle = '#347a24'
      ctx.fillRect(px + 4, py + 8, 2, 6)
      ctx.fillRect(px + 24, py + 16, 2, 6)
      // Flowers
      const flowerColors = ['#ff6b6b', '#ffd93d', '#ff8cc8', '#69b4ff']
      ctx.fillStyle = flowerColors[((px + py) / TILE) % 4 | 0]
      ctx.beginPath()
      ctx.arc(px + 10, py + 12, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = flowerColors[((px + py) / TILE + 2) % 4 | 0]
      ctx.beginPath()
      ctx.arc(px + 22, py + 20, 3, 0, Math.PI * 2)
      ctx.fill()
      break

    case T.BRIDGE:
      ctx.fillStyle = '#a07828'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#c4982a'
      ctx.fillRect(px + 2, py + 2, s - 4, 4)
      ctx.fillRect(px + 2, py + s - 6, s - 4, 4)
      break
  }
}

// Draw character
function drawCharacter(ctx, px, py, direction, frame) {
  const s = TILE

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(px + s / 2, py + s - 2, 10, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillStyle = '#c7b777'
  ctx.fillRect(px + 10, py + 12, 12, 14)

  // Head
  ctx.fillStyle = '#f5d6a0'
  ctx.beginPath()
  ctx.arc(px + s / 2, py + 10, 8, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = '#3a2a1a'
  ctx.beginPath()
  ctx.arc(px + s / 2, py + 7, 8, Math.PI, Math.PI * 2)
  ctx.fill()

  // Eyes based on direction
  ctx.fillStyle = '#1a1a1a'
  if (direction === 'down' || direction === 'idle') {
    ctx.fillRect(px + 12, py + 9, 2, 2)
    ctx.fillRect(px + 18, py + 9, 2, 2)
  } else if (direction === 'up') {
    // Back of head, no eyes
  } else if (direction === 'left') {
    ctx.fillRect(px + 10, py + 9, 2, 2)
  } else if (direction === 'right') {
    ctx.fillRect(px + 20, py + 9, 2, 2)
  }

  // Legs with walking animation
  ctx.fillStyle = '#2a2a3a'
  const legOffset = Math.sin(frame * 0.3) * 3
  ctx.fillRect(px + 11, py + 26, 4, 6 + (direction !== 'idle' ? legOffset : 0))
  ctx.fillRect(px + 17, py + 26, 4, 6 + (direction !== 'idle' ? -legOffset : 0))

  // Cape/coat flap
  ctx.fillStyle = '#a89a5e'
  ctx.fillRect(px + 8, py + 14, 3, 10)
  ctx.fillRect(px + 21, py + 14, 3, 10)
}

// Draw zone label
function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const s = TILE

  // Label background
  ctx.fillStyle = completed ? '#c7b777' : unlocked ? '#2a2a3a' : '#1a1a1a'
  ctx.strokeStyle = completed ? '#e0d9a8' : unlocked ? '#c7b777' : '#555'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(px - 4, py - 20, s + 8, 16, 4)
  ctx.fill()
  ctx.stroke()

  // Label text
  ctx.fillStyle = completed ? '#1a1a1a' : unlocked ? '#c7b777' : '#666'
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(zone.label, px + s / 2, py - 8)

  // Lock icon for locked zones
  if (!unlocked) {
    ctx.fillStyle = '#555'
    ctx.font = '12px sans-serif'
    ctx.fillText('\u{1F512}', px + s / 2, py - 24)
  }

  // Checkmark for completed
  if (completed) {
    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('\u2713', px + s / 2, py - 24)
  }
}

// Camera
function getCamera(charX, charY, viewW, viewH) {
  const mapW = COLS * TILE
  const mapH = ROWS * TILE
  let cx = charX * TILE + TILE / 2 - viewW / 2
  let cy = charY * TILE + TILE / 2 - viewH / 2
  cx = Math.max(0, Math.min(cx, mapW - viewW))
  cy = Math.max(0, Math.min(cy, mapH - viewH))
  return { x: cx, y: cy }
}

// Check if character is next to a zone
function getAdjacentZone(charX, charY) {
  for (const zone of ZONES) {
    const dx = Math.abs(charX - zone.x)
    const dy = Math.abs(charY - zone.y)
    if (dx <= 1 && dy <= 1) return zone
  }
  return null
}

// Check if movement is valid
function canMove(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
  const tile = map[y][x]
  return !SOLID.has(tile) && tile !== T.ZONE
}

export {
  TILE, COLS, ROWS, T, ZONES,
  generateMap, drawTile, drawCharacter, drawZoneLabel,
  getCamera, getAdjacentZone, canMove,
}
