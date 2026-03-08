// ============================================================
// VDX Quest — Game Engine (FROM ABSOLUTE ZERO)
// ============================================================
// Only: map generation, collision, houses, interiors
// No NPCs, no quests, no wandering AI

const S = 16
const COLS = 30
const ROWS = 24

// ============================================================
// TILE TYPES
// ============================================================
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3,
  FLOWER: 4, FENCE: 5, SAND: 7,
  DARK_GRASS: 8, BUSH: 9, TALL_GRASS: 11,
  HOUSE: 20, DOOR: 21,
}

const SOLID = new Set([T.WATER, T.TREE, T.FENCE, T.BUSH, T.HOUSE])

// ============================================================
// 3 HOUSES
// ============================================================
const HOUSES = [
  { id: 1, x: 3,  y: 3,  name: 'Maison Rouge' },
  { id: 2, x: 21, y: 3,  name: 'Maison Bleue' },
  { id: 3, x: 12, y: 14, name: 'Maison du Village' },
]
// Door = bottom-center of 5×4 house sprite
HOUSES.forEach(h => { h.doorX = h.x + 2; h.doorY = h.y + 4 })

// ============================================================
// TREES (2×2 blocks, stored as top-left corner)
// type: 1 = round tree, 2 = pine tree
// ============================================================
const TREES = []

function addTree(m, x, y, type) {
  if (x < 0 || y < 0 || x + 1 >= COLS || y + 1 >= ROWS) return false
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const t = m[y + dy][x + dx]
    if (t !== T.GRASS && t !== T.DARK_GRASS && t !== T.TALL_GRASS) return false
  }
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) m[y + dy][x + dx] = T.TREE
  TREES.push({ x, y, type })
  return true
}

// ============================================================
// MAP GENERATION — a clean, intentional village
// ============================================================
function generateMap() {
  TREES.length = 0
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // ---- FOREST BORDER (pine trees) ----
  for (let x = 0; x < COLS; x += 2) {
    addTree(m, x, 0, 2)
    addTree(m, x, ROWS - 2, 2)
  }
  for (let y = 0; y < ROWS; y += 2) {
    addTree(m, 0, y, 2)
    addTree(m, COLS - 2, y, 2)
  }
  // Extra border density
  for (let x = 0; x < COLS; x += 2) {
    if (x % 4 === 0) { addTree(m, x, 2, 2); addTree(m, x, ROWS - 4, 2) }
  }
  for (let y = 2; y < ROWS - 2; y += 2) {
    if (y % 4 === 0) { addTree(m, 2, y, 2); addTree(m, COLS - 4, y, 2) }
  }

  // ---- MAIN PATHS ----
  // Horizontal road at y=9,10 (main village road)
  for (let x = 4; x < COLS - 4; x++) { m[9][x] = T.PATH; m[10][x] = T.PATH }
  // Vertical road at x=14,15 (north-south)
  for (let y = 3; y < ROWS - 3; y++) { m[y][14] = T.PATH; m[y][15] = T.PATH }

  // Path from Red house door (5, 7) down to main road
  for (let y = 7; y <= 9; y++) { m[y][5] = T.PATH }
  // Path from Blue house door (23, 7) down to main road
  for (let y = 7; y <= 9; y++) { m[y][23] = T.PATH }
  // Path from Brown house door (14, 18) up to main road
  // Already covered by vertical road

  // ---- VILLAGE SQUARE (center, around intersection) ----
  for (let y = 8; y <= 11; y++) for (let x = 11; x <= 18; x++) {
    if (m[y][x] === T.GRASS) m[y][x] = T.PATH
  }

  // ---- PLACE HOUSES ----
  for (const h of HOUSES) {
    // Clear area around house
    for (let dy = -1; dy <= 5; dy++) for (let dx = -1; dx <= 6; dx++) {
      const nx = h.x + dx, ny = h.y + dy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
        if (m[ny][nx] === T.TREE) m[ny][nx] = T.GRASS
      }
    }
    // Remove any TREES entries that overlap
    for (let i = TREES.length - 1; i >= 0; i--) {
      const t = TREES[i]
      if (t.x >= h.x - 1 && t.x <= h.x + 5 && t.y >= h.y - 1 && t.y <= h.y + 5) TREES.splice(i, 1)
    }
    // House footprint (5×4)
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 5; dx++) {
      m[h.y + dy][h.x + dx] = T.HOUSE
    }
    // Door tile
    m[h.doorY][h.doorX] = T.DOOR
    // Flowers beside house
    const spots = [[- 1, 1], [- 1, 2], [5, 1], [5, 2], [0, 4], [4, 4]]
    for (const [fx, fy] of spots) {
      const nx = h.x + fx, ny = h.y + fy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && m[ny][nx] === T.GRASS) m[ny][nx] = T.FLOWER
    }
  }

  // ---- DECORATIVE TREES (round, inside village) ----
  const roundTrees = [
    [8, 5], [10, 5], [18, 5], [20, 5],   // Between houses
    [6, 12], [8, 14], [22, 12], [20, 14], // Sides of center
    [6, 18], [8, 20], [20, 18], [22, 20], // Bottom area
    [10, 16], [18, 16],                    // Near Brown house
  ]
  for (const [tx, ty] of roundTrees) addTree(m, tx, ty, 1)

  // ---- POND (east side) ----
  const px = 24, py = 17
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = px + dx, ny = py + dy
    if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
      if (Math.abs(dx) + Math.abs(dy) <= 1) m[ny][nx] = T.WATER
    }
  }
  m[py - 1][px + 1] = T.WATER; m[py + 1][px - 1] = T.WATER
  // Sand around pond
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = px + dx, ny = py + dy
    if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS &&
      m[ny][nx] === T.GRASS && Math.abs(dx) + Math.abs(dy) <= 3) m[ny][nx] = T.SAND
  }

  // ---- FLOWER GARDEN (south-west) ----
  for (let y = 18; y <= 20; y++) for (let x = 5; x <= 9; x++) {
    if (m[y][x] === T.GRASS && (x + y) % 2 === 0) m[y][x] = T.FLOWER
  }
  for (let x = 4; x <= 10; x++) {
    if (m[17][x] === T.GRASS) m[17][x] = T.FENCE
    if (m[21][x] === T.GRASS) m[21][x] = T.FENCE
  }
  for (let y = 17; y <= 21; y++) {
    if (m[y][4] === T.GRASS) m[y][4] = T.FENCE
    if (m[y][10] === T.GRASS) m[y][10] = T.FENCE
  }
  m[17][7] = T.PATH // Garden entrance

  // ---- DARK GRASS PATCHES ----
  for (const [cx, cy] of [[8, 8], [22, 16], [16, 20]]) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && m[ny][nx] === T.GRASS) m[ny][nx] = T.DARK_GRASS
    }
  }

  // ---- TALL GRASS ----
  for (const [cx, cy] of [[5, 12], [25, 8]]) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && m[ny][nx] === T.GRASS) m[ny][nx] = T.TALL_GRASS
    }
  }

  // ---- SCATTERED FLOWERS ----
  for (const [fx, fy] of [[12, 7], [17, 7], [9, 11], [20, 11], [7, 16], [22, 6], [16, 5]]) {
    if (fy >= 0 && fy < ROWS && fx >= 0 && fx < COLS && m[fy][fx] === T.GRASS) m[fy][fx] = T.FLOWER
  }

  return m
}

// ============================================================
// COLLISION
// ============================================================
function canMove(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
  return !SOLID.has(map[y][x])
}

function getHouseAt(x, y) {
  for (const h of HOUSES) {
    if (x === h.doorX && y === h.doorY) return h
  }
  return null
}

function isNearDoor(px, py) {
  for (const h of HOUSES) {
    if (Math.abs(px - h.doorX) <= 1 && Math.abs(py - h.doorY) <= 1) return h
  }
  return null
}

// ============================================================
// INTERIOR MAP GENERATION
// ============================================================
function generateInterior(house) {
  const W = 12, H = 10
  const I = { FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54, CARPET: 55, BARREL: 57, BED: 58, DOORMAT: 59, TORCH: 60, POT: 61, CHEST: 62 }
  const m = Array.from({ length: H }, () => Array(W).fill(I.FLOOR))

  // Walls
  for (let x = 0; x < W; x++) { m[0][x] = I.WALL; m[H - 1][x] = I.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = I.WALL; m[y][W - 1] = I.WALL }

  // Door
  m[H - 1][5] = I.DOORMAT; m[H - 1][6] = I.DOORMAT

  // Torches on walls
  m[0][2] = I.TORCH; m[0][W - 3] = I.TORCH
  m[4][0] = I.TORCH; m[4][W - 1] = I.TORCH

  if (house.id === 1) {
    // Bibliothèque / étude
    m[1][1] = I.BOOKSHELF; m[1][2] = I.BOOKSHELF; m[1][3] = I.BOOKSHELF; m[1][4] = I.BOOKSHELF
    m[1][W - 2] = I.BOOKSHELF; m[1][W - 3] = I.BOOKSHELF; m[1][W - 4] = I.BOOKSHELF; m[1][W - 5] = I.BOOKSHELF
    m[3][2] = I.TABLE; m[3][3] = I.TABLE; m[4][2] = I.CHAIR; m[4][3] = I.CHAIR
    m[3][W - 3] = I.TABLE; m[3][W - 4] = I.TABLE; m[4][W - 3] = I.CHAIR; m[4][W - 4] = I.CHAIR
    m[6][1] = I.POT; m[6][2] = I.BOOKSHELF; m[6][3] = I.BOOKSHELF
    m[7][1] = I.BED; m[7][2] = I.BED
    m[8][1] = I.CHEST
    m[7][W - 2] = I.BARREL; m[8][W - 2] = I.POT
    for (let y = 5; y < H - 1; y++) { m[y][5] = I.CARPET; m[y][6] = I.CARPET }
  } else if (house.id === 2) {
    // Entrepôt / stockage
    m[1][1] = I.BOOKSHELF; m[1][2] = I.BOOKSHELF; m[1][W - 2] = I.BOOKSHELF; m[1][W - 3] = I.BOOKSHELF
    m[2][1] = I.CHEST; m[2][2] = I.CHEST; m[2][3] = I.CHEST
    m[2][W - 2] = I.CHEST; m[2][W - 3] = I.CHEST; m[2][W - 4] = I.CHEST
    m[4][3] = I.TABLE; m[4][4] = I.TABLE; m[5][3] = I.CHAIR; m[5][4] = I.CHAIR
    m[4][W - 4] = I.TABLE; m[4][W - 5] = I.TABLE; m[5][W - 4] = I.CHAIR; m[5][W - 5] = I.CHAIR
    m[7][1] = I.BARREL; m[7][2] = I.BARREL; m[7][W - 2] = I.BARREL; m[7][W - 3] = I.BARREL
    m[8][1] = I.POT; m[8][W - 2] = I.POT
    for (let y = 3; y < H - 1; y++) { m[y][5] = I.CARPET; m[y][6] = I.CARPET }
  } else {
    // Maison de vie
    m[1][1] = I.BOOKSHELF; m[1][2] = I.POT; m[1][W - 2] = I.POT; m[1][W - 3] = I.BOOKSHELF
    m[2][1] = I.BED; m[2][2] = I.BED; m[2][W - 2] = I.BED; m[2][W - 3] = I.BED
    m[4][3] = I.TABLE; m[4][4] = I.TABLE; m[5][3] = I.CHAIR; m[5][4] = I.CHAIR
    m[4][W - 4] = I.TABLE; m[4][W - 5] = I.TABLE; m[5][W - 4] = I.CHAIR; m[5][W - 5] = I.CHAIR
    m[7][1] = I.BARREL; m[7][W - 2] = I.CHEST
    m[6][1] = I.POT; m[6][W - 2] = I.POT
    for (let y = 3; y <= 7; y++) for (let x = 4; x <= 7; x++) m[y][x] = I.CARPET
  }

  return { map: m, width: W, height: H, spawnX: 5, spawnY: H - 2 }
}

export { S, COLS, ROWS, T, HOUSES, TREES, generateMap, canMove, getHouseAt, isNearDoor, generateInterior }
