// VDX Quest RPG Engine - Village-based week structure

const TILE = 16
const COLS = 30
const ROWS = 24

// Tile types
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3,
  MOUNTAIN: 5, FLOWER: 6, BRIDGE: 7, FENCE: 8,
  DARK_GRASS: 9, SAND: 10, TALL_GRASS: 17,
  // House tiles (composed from overworld.png)
  HOUSE_ROOF_TL: 30, HOUSE_ROOF_TC: 31, HOUSE_ROOF_TR: 32,
  HOUSE_ROOF_ML: 33, HOUSE_ROOF_MC: 34, HOUSE_ROOF_MR: 35,
  HOUSE_WALL_L: 36, HOUSE_WALL_WIN: 37, HOUSE_WALL_R: 38,
  HOUSE_WALL_DL: 39, HOUSE_DOOR: 40, HOUSE_WALL_DR: 41,
  SIGN: 14,
}

const SOLID = new Set([
  T.WATER, T.TREE, T.MOUNTAIN, T.FENCE,
  T.HOUSE_ROOF_TL, T.HOUSE_ROOF_TC, T.HOUSE_ROOF_TR,
  T.HOUSE_ROOF_ML, T.HOUSE_ROOF_MC, T.HOUSE_ROOF_MR,
  T.HOUSE_WALL_L, T.HOUSE_WALL_WIN, T.HOUSE_WALL_R,
  T.HOUSE_WALL_DL, T.HOUSE_WALL_DR,
])

// Week 1 village: 4 quests (zones)
const ZONES = [
  { id: 1, houseX: 4, houseY: 4, name: 'Cabane de la Verite', region: 1,
    desc: 'Qui es-tu vraiment ? Identifie ta valeur unique.' },
  { id: 2, houseX: 16, houseY: 4, name: 'Tour du Choix', region: 1,
    desc: 'Choisis ta niche. A qui veux-tu parler ?' },
  { id: 3, houseX: 4, houseY: 14, name: 'Forge de l\'Offre', region: 1,
    desc: 'Construis ton offre irresistible.' },
  { id: 4, houseX: 16, houseY: 14, name: 'Place Publique', region: 1,
    desc: 'Fais ta premiere proposition de vente.' },
]

// Computed door positions (bottom center of house)
ZONES.forEach(z => {
  z.doorX = z.houseX + 1
  z.doorY = z.houseY + 3
})

// NPCs with proper positions in the village
const NPCS = [
  {
    id: 'mentor', x: 14, y: 20, sprite: 'mentor', name: 'Laurent',
    dialog: [
      'Bienvenue dans le Village de la Clarte, aventurier.',
      'Je suis Laurent, maitre de la methodologie VDX.',
      'Chaque maison contient une epreuve. Entre pour la decouvrir.',
      'Commence par la Cabane de la Verite au nord-ouest.',
      'Bonne route, entrepreneur.',
    ]
  },
  {
    id: 'guide1', x: 10, y: 10, sprite: 'villager', name: 'Elise',
    dialog: [
      'Salut ! Bienvenue dans notre village.',
      'Les 4 maisons sont les 4 epreuves de la semaine.',
      'Chaque quete te rapprochera de ton objectif.',
    ]
  },
  {
    id: 'old1', x: 24, y: 8, sprite: 'old', name: 'Ancien',
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
    ]
  },
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateMap() {
  const rng = seededRandom(42)
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // Flower patches for decoration
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rng() * COLS)
    const y = Math.floor(rng() * ROWS)
    if (map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Tall grass patches
  for (const [cx, cy] of [[2, 12], [26, 6], [26, 18], [12, 22]]) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.3) {
          if (map[ny][nx] === T.GRASS) map[ny][nx] = T.TALL_GRASS
        }
      }
    }
  }

  // Trees around edges
  for (let x = 0; x < COLS; x++) {
    if (rng() > 0.15) map[0][x] = T.TREE
    if (rng() > 0.15) map[ROWS - 1][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    if (rng() > 0.15) map[y][0] = T.TREE
    if (rng() > 0.15) map[y][COLS - 1] = T.TREE
  }

  // Tree clusters for decoration
  for (const [fx, fy] of [[28, 3], [1, 19], [28, 20], [12, 1]]) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = fx + dx, ny = fy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.2) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // Small pond
  for (const [wx, wy] of [[22, 11], [23, 11], [24, 11], [22, 12], [23, 12], [24, 12]]) {
    map[wy][wx] = T.WATER
  }
  // Sand shores
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (map[y][x] !== T.WATER) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
            if (map[ny][nx] === T.GRASS || map[ny][nx] === T.FLOWER) map[ny][nx] = T.SAND
          }
        }
      }
    }
  }

  // Main village paths
  // Central horizontal path
  for (let x = 1; x < COLS - 1; x++) {
    map[10][x] = T.PATH
    map[11][x] = T.PATH
  }
  // Central vertical path
  for (let y = 1; y < ROWS - 1; y++) {
    map[y][14] = T.PATH
    map[y][15] = T.PATH
  }
  // Paths to houses
  for (const zone of ZONES) {
    // Path from house door to nearest main path
    const doorX = zone.doorX
    const doorY = zone.doorY + 1
    // Vertical path from door down/up to horizontal path
    const targetY = 10
    const startY = Math.min(doorY, targetY)
    const endY = Math.max(doorY, targetY)
    for (let y = startY; y <= endY; y++) {
      if (map[y][doorX] === T.GRASS || map[y][doorX] === T.FLOWER || map[y][doorX] === T.TALL_GRASS) {
        map[y][doorX] = T.PATH
      }
    }
    // Horizontal path from door to vertical path
    const startX = Math.min(doorX, 14)
    const endX = Math.max(doorX, 15)
    for (let x = startX; x <= endX; x++) {
      if (map[doorY][x] === T.GRASS || map[doorY][x] === T.FLOWER || map[doorY][x] === T.TALL_GRASS) {
        map[doorY][x] = T.PATH
      }
    }
  }

  // Place houses (3 wide x 4 tall each)
  for (const zone of ZONES) {
    const hx = zone.houseX
    const hy = zone.houseY

    // Clear area around house
    for (let dy = -1; dy <= 4; dy++) {
      for (let dx = -1; dx <= 3; dx++) {
        const nx = hx + dx, ny = hy + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
          if (![T.PATH].includes(map[ny][nx])) map[ny][nx] = T.GRASS
        }
      }
    }

    // Row 0: Roof top
    map[hy][hx]     = T.HOUSE_ROOF_TL
    map[hy][hx + 1] = T.HOUSE_ROOF_TC
    map[hy][hx + 2] = T.HOUSE_ROOF_TR
    // Row 1: Roof middle
    map[hy + 1][hx]     = T.HOUSE_ROOF_ML
    map[hy + 1][hx + 1] = T.HOUSE_ROOF_MC
    map[hy + 1][hx + 2] = T.HOUSE_ROOF_MR
    // Row 2: Wall with windows
    map[hy + 2][hx]     = T.HOUSE_WALL_L
    map[hy + 2][hx + 1] = T.HOUSE_WALL_WIN
    map[hy + 2][hx + 2] = T.HOUSE_WALL_R
    // Row 3: Wall with door
    map[hy + 3][hx]     = T.HOUSE_WALL_DL
    map[hy + 3][hx + 1] = T.HOUSE_DOOR
    map[hy + 3][hx + 2] = T.HOUSE_WALL_DR

    // Path in front of door
    map[hy + 4][hx + 1] = T.PATH
    // Sign next to house
    if (hx + 3 < COLS) map[hy + 3][hx + 3] = T.SIGN
  }

  // Fences near village center
  for (let x = 10; x <= 13; x++) { map[9][x] = T.FENCE }
  for (let x = 16; x <= 19; x++) { map[9][x] = T.FENCE }

  // Make sure NPC positions are walkable
  for (const npc of NPCS) {
    if (map[npc.y][npc.x] !== T.PATH) map[npc.y][npc.x] = T.PATH
  }

  return map
}

// ============ ZONE/NPC LABELS ============

function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const bw = zone.name.length * 4.5 + 16
  const bx = px + TILE * 1.5 - bw / 2
  const by = py - 12

  ctx.fillStyle = completed ? 'rgba(199,183,119,0.92)' : unlocked ? 'rgba(12,12,25,0.88)' : 'rgba(10,10,15,0.65)'
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, 16, 4)
  ctx.fill()

  ctx.strokeStyle = completed ? '#e0d9a8' : unlocked ? '#c7b777' : '#444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, 16, 4)
  ctx.stroke()

  ctx.fillStyle = completed ? '#1a1a2a' : unlocked ? '#c7b777' : '#555'
  ctx.font = 'bold 7px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(zone.name, px + TILE * 1.5, by + 11)

  if (!unlocked) {
    ctx.fillStyle = '#666'
    ctx.font = '8px sans-serif'
    ctx.fillText('\u{1F512}', px + TILE * 1.5, by - 2)
  }
  if (completed) {
    ctx.fillStyle = '#2a6a1e'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('\u2713', px + TILE * 1.5, by - 1)
  }
}

function drawNPCLabel(ctx, npc, px, py, tick) {
  const bob = Math.sin(tick * 0.05) * 2

  ctx.fillStyle = '#c7b777'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', px + TILE / 2, py - TILE - 4 + bob)

  const nameW = npc.name.length * 4.5 + 8
  const nameX = px + TILE / 2 - nameW / 2
  const nameY = py - TILE - 14 + bob

  ctx.fillStyle = 'rgba(5,5,15,0.75)'
  ctx.beginPath()
  ctx.roundRect(nameX, nameY, nameW, 10, 3)
  ctx.fill()

  ctx.fillStyle = '#c7b777'
  ctx.font = '6px monospace'
  ctx.fillText(npc.name, px + TILE / 2, nameY + 7)
}

// ============ CAMERA & COLLISION ============

function getAdjacentZone(tileX, tileY) {
  for (const zone of ZONES) {
    // Check if player is near the door (doorX, doorY) or one tile below
    const dx = Math.abs(tileX - zone.doorX)
    const dy = tileY - zone.doorY
    if (dx <= 1 && dy >= 0 && dy <= 1) return zone
  }
  return null
}

function getAdjacentNPC(tileX, tileY) {
  for (const npc of NPCS) {
    const dx = Math.abs(tileX - npc.x)
    const dy = Math.abs(tileY - npc.y)
    if (dx <= 1 && dy <= 1) return npc
  }
  return null
}

function canMove(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
  const tile = map[y][x]
  if (SOLID.has(tile)) return false
  for (const npc of NPCS) {
    if (npc.x === x && npc.y === y) return false
  }
  return true
}

export {
  TILE, COLS, ROWS, T, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, canMove,
}
