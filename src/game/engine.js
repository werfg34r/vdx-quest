// VDX Quest RPG Engine - Pokemon-style top-down RPG

const TILE = 32
const COLS = 50
const ROWS = 40

// Tile types
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3, ZONE: 4, MOUNTAIN: 5,
  FLOWER: 6, BRIDGE: 7, FENCE: 8, DARK_GRASS: 9, SAND: 10,
  ROOF: 11, WALL: 12, DOOR: 13, SIGN: 14, CHEST: 15,
  STONE_PATH: 16, TALL_GRASS: 17, WATER_EDGE: 18, HOUSE_WALL: 19,
}

const SOLID = new Set([T.WATER, T.TREE, T.MOUNTAIN, T.FENCE, T.WALL, T.ROOF, T.HOUSE_WALL, T.WATER_EDGE])

// Zone definitions (12 weeks) with names and region themes
const ZONES = [
  { id: 1, x: 8, y: 35, label: 'S1', name: 'Cabane de la Verite', region: 1 },
  { id: 2, x: 16, y: 33, label: 'S2', name: 'Tour du Choix', region: 1 },
  { id: 3, x: 25, y: 35, label: 'S3', name: 'Forge de l\'Offre', region: 1 },
  { id: 4, x: 35, y: 32, label: 'S4', name: 'Place Publique', region: 1 },
  { id: 5, x: 40, y: 25, label: 'S5', name: 'Arene des Voix', region: 2 },
  { id: 6, x: 33, y: 20, label: 'S6', name: 'Guilde du Courage', region: 2 },
  { id: 7, x: 24, y: 22, label: 'S7', name: 'Epreuve du Reel', region: 2 },
  { id: 8, x: 14, y: 20, label: 'S8', name: 'Bibliotheque Vivante', region: 2 },
  { id: 9, x: 10, y: 13, label: 'S9', name: 'Atelier de la Boucle', region: 3 },
  { id: 10, x: 20, y: 10, label: 'S10', name: 'Temple de la Constance', region: 3 },
  { id: 11, x: 32, y: 12, label: 'S11', name: 'Phare de la Posture', region: 3 },
  { id: 12, x: 25, y: 4, label: 'S12', name: 'Sommet VDX', region: 3 },
]

// NPCs
const NPCS = [
  {
    id: 'mentor', x: 8, y: 37, sprite: 'mentor', name: 'Laurent',
    dialog: [
      'Bienvenue, aventurier.',
      'Je suis Laurent, maitre de la methodologie Vendeur d\'Exception.',
      'Tu es ici pour une raison : transformer ton potentiel en realite.',
      'Devant toi s\'etend le Monde VDX. 3 regions, 12 epreuves, 90 jours.',
      'Region 1 : la Plaine de la Clarte. Ici tu apprendras a sortir du flou.',
      'Region 2 : la Cite du Courage. Tu affronteras le reel et les humains.',
      'Region 3 : le Sommet de la Structure. Tu batiras ton systeme.',
      'Commence par la Cabane de la Verite, juste au nord.',
      'Appuie sur ESPACE devant chaque batiment pour entrer.',
      'Bonne route, entrepreneur.',
    ]
  },
  {
    id: 'guide1', x: 12, y: 34, sprite: 'villager', name: 'Elise',
    dialog: [
      'Salut ! Ici c\'est la Plaine de la Clarte.',
      'Les 4 premiers batiments t\'aideront a sortir de ta tete.',
      'Prends le temps de faire chaque quete. Pas de raccourci.',
    ]
  },
  {
    id: 'guide2', x: 37, y: 22, sprite: 'warrior', name: 'Marc',
    dialog: [
      'Tu es arrive a la Cite du Courage. Bien joue.',
      'Ici, tu vas parler a de vrais humains, proposer ton offre, encaisser des refus.',
      'C\'est la que la plupart abandonnent. Pas toi.',
    ]
  },
  {
    id: 'guide3', x: 15, y: 12, sprite: 'sage', name: 'Sophie',
    dialog: [
      'Bienvenue au Sommet de la Structure.',
      'Tu as des preuves maintenant. Tu as vecu le reel.',
      'Il reste a transformer tout ca en systeme repetable.',
      'Tu n\'es plus un reveur. Tu es un entrepreneur.',
    ]
  },
  {
    id: 'old1', x: 20, y: 36, sprite: 'old', name: 'Ancien',
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
    ]
  },
  {
    id: 'trader', x: 30, y: 24, sprite: 'trader', name: 'Vendeur',
    dialog: [
      'Tu veux un conseil gratuit ? Propose. Annonce ton prix. Laisse le silence.',
      'Le marche ne repond pas aux idees. Il repond aux propositions.',
    ]
  },
]

// Generate the map
function generateMap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // Region backgrounds
  // Region 3 (top, y 0-15): darker grass, mountains
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < COLS; x++) {
      map[y][x] = Math.random() > 0.7 ? T.DARK_GRASS : T.GRASS
    }
  }

  // Scatter flowers in region 1
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(Math.random() * COLS)
    const y = 26 + Math.floor(Math.random() * 14)
    if (y < ROWS && map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Tall grass patches
  const tallGrassAreas = [[5, 30], [30, 28], [42, 18], [8, 16], [38, 8]]
  for (const [cx, cy] of tallGrassAreas) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && Math.random() > 0.3) {
          if (map[ny][nx] === T.GRASS || map[ny][nx] === T.DARK_GRASS) map[ny][nx] = T.TALL_GRASS
        }
      }
    }
  }

  // Water features
  // Lake in region 1
  const lake = [[2, 30], [3, 30], [4, 30], [2, 31], [3, 31], [4, 31], [5, 31], [3, 32], [4, 32]]
  for (const [lx, ly] of lake) {
    if (ly < ROWS && lx < COLS) map[ly][lx] = T.WATER
  }

  // River through region 2
  for (let x = 0; x < 12; x++) {
    map[26][x] = T.WATER
    map[27][x] = T.WATER
  }
  map[26][12] = T.BRIDGE
  map[27][12] = T.BRIDGE

  // Small pond region 3
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      map[6 + dy][40 + dx] = T.WATER
    }
  }

  // Mountains - region 3 borders and decoration
  const mtns = [[0, 0, 6, 3], [44, 0, 6, 5], [0, 0, 3, 8], [47, 0, 3, 10], [35, 2, 4, 3]]
  for (const [mx, my, mw, mh] of mtns) {
    for (let dy = 0; dy < mh; dy++) {
      for (let dx = 0; dx < mw; dx++) {
        const nx = mx + dx, ny = my + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.MOUNTAIN
      }
    }
  }

  // Trees - borders and forests
  for (let x = 0; x < COLS; x++) {
    if (Math.random() > 0.2) map[ROWS - 1][x] = T.TREE
    if (Math.random() > 0.4 && map[0][x] !== T.MOUNTAIN) map[0][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    if (Math.random() > 0.2 && map[y][0] !== T.MOUNTAIN) map[y][0] = T.TREE
    if (Math.random() > 0.2 && map[y][COLS - 1] !== T.MOUNTAIN) map[y][COLS - 1] = T.TREE
  }

  // Forest clusters
  const forests = [[44, 30, 3], [1, 18, 3], [45, 15, 2], [38, 35, 3], [20, 28, 2]]
  for (const [fx, fy, r] of forests) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = fx + dx, ny = fy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && Math.random() > 0.25) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // Fences around some areas
  for (let x = 6; x <= 10; x++) { map[38][x] = T.FENCE }
  for (let y = 36; y <= 38; y++) { map[y][6] = T.FENCE; map[y][10] = T.FENCE }

  // Draw paths between zones
  const waypoints = [
    { x: 8, y: 37 }, // Start near mentor
    ...ZONES.map(z => ({ x: z.x, y: z.y })),
  ]
  for (let i = 0; i < waypoints.length - 1; i++) {
    drawPath(map, waypoints[i], waypoints[i + 1])
  }

  // Place zones (clear area and mark)
  for (const zone of ZONES) {
    // Clear 3x3 area
    for (let dy = -1; dy <= 2; dy++) {
      for (let dx = -1; dx <= 2; dx++) {
        const nx = zone.x + dx, ny = zone.y + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
          map[ny][nx] = T.PATH
        }
      }
    }
    // Building structure
    map[zone.y - 1][zone.x] = T.ROOF
    map[zone.y - 1][zone.x + 1] = T.ROOF
    map[zone.y][zone.x] = T.WALL
    map[zone.y][zone.x + 1] = T.WALL
    map[zone.y + 1][zone.x] = T.DOOR // door
    map[zone.y + 1][zone.x + 1] = T.WALL
    // Sign next to door
    if (zone.x + 2 < COLS) map[zone.y + 1][zone.x + 2] = T.SIGN
  }

  // Clear NPC positions
  for (const npc of NPCS) {
    if (map[npc.y][npc.x] !== T.PATH) map[npc.y][npc.x] = T.PATH
  }

  return map
}

function drawPath(map, from, to) {
  let x = from.x, y = from.y
  while (x !== to.x || y !== to.y) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      const t = map[y][x]
      if (t !== T.ROOF && t !== T.WALL && t !== T.DOOR && t !== T.WATER && t !== T.BRIDGE) {
        map[y][x] = T.PATH
      }
    }
    if (Math.random() > 0.35) {
      if (x < to.x) x++; else if (x > to.x) x--
      else if (y < to.y) y++; else if (y > to.y) y--
    } else {
      if (y < to.y) y++; else if (y > to.y) y--
      else if (x < to.x) x++; else if (x > to.x) x--
    }
  }
}

// ============ RENDERING ============

function drawTile(ctx, type, px, py, tick) {
  const s = TILE
  switch (type) {
    case T.GRASS:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#45a030'
      ctx.fillRect(px + 5, py + 8, 2, 5)
      ctx.fillRect(px + 15, py + 3, 2, 4)
      ctx.fillRect(px + 25, py + 18, 2, 5)
      break
    case T.DARK_GRASS:
      ctx.fillStyle = '#2a6a1e'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#357a25'
      ctx.fillRect(px + 8, py + 5, 2, 6)
      ctx.fillRect(px + 20, py + 14, 2, 5)
      break
    case T.TALL_GRASS:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#2a7020'
      for (let i = 0; i < 5; i++) {
        const gx = px + 3 + i * 6
        const sway = Math.sin(tick * 0.03 + i + px * 0.1) * 2
        ctx.fillRect(gx + sway, py + 2, 3, 14)
        ctx.fillRect(gx + sway + 1, py, 2, 4)
      }
      break
    case T.PATH:
      ctx.fillStyle = '#d4b86a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#c4a85a'
      ctx.fillRect(px + 3, py + 3, 6, 6)
      ctx.fillRect(px + 18, py + 20, 8, 5)
      ctx.fillRect(px + 24, py + 6, 5, 7)
      ctx.fillStyle = '#b89848'
      ctx.fillRect(px + 12, py + 12, 4, 4)
      break
    case T.WATER: {
      ctx.fillStyle = '#1565a8'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#1e7ac0'
      const wo = Math.sin(tick * 0.04 + px * 0.15) * 3
      ctx.fillRect(px + 2 + wo, py + 8, 14, 3)
      ctx.fillRect(px + 14 - wo, py + 20, 12, 3)
      ctx.fillStyle = '#2090d8'
      ctx.fillRect(px + 8 + wo, py + 4, 6, 2)
      break
    }
    case T.TREE:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      // Trunk
      ctx.fillStyle = '#6a4420'
      ctx.fillRect(px + 12, py + 18, 8, 14)
      // Shadow
      ctx.fillStyle = '#1a5a12'
      ctx.beginPath()
      ctx.arc(px + 16, py + 15, 13, 0, Math.PI * 2)
      ctx.fill()
      // Canopy
      ctx.fillStyle = '#228822'
      ctx.beginPath()
      ctx.arc(px + 16, py + 13, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#2aa82a'
      ctx.beginPath()
      ctx.arc(px + 13, py + 10, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#35c535'
      ctx.beginPath()
      ctx.arc(px + 19, py + 8, 5, 0, Math.PI * 2)
      ctx.fill()
      break
    case T.MOUNTAIN:
      ctx.fillStyle = '#2a6a1e'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#6a6a7a'
      ctx.beginPath()
      ctx.moveTo(px - 2, py + s)
      ctx.lineTo(px + s / 2, py - 4)
      ctx.lineTo(px + s + 2, py + s)
      ctx.fill()
      ctx.fillStyle = '#8a8a9a'
      ctx.beginPath()
      ctx.moveTo(px + 4, py + s)
      ctx.lineTo(px + s / 2, py + 2)
      ctx.lineTo(px + s - 4, py + s)
      ctx.fill()
      // Snow cap
      ctx.fillStyle = '#e8e8f0'
      ctx.beginPath()
      ctx.moveTo(px + s / 2 - 6, py + 8)
      ctx.lineTo(px + s / 2, py - 4)
      ctx.lineTo(px + s / 2 + 6, py + 8)
      ctx.fill()
      break
    case T.FLOWER:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#45a030'
      ctx.fillRect(px + 14, py + 6, 2, 4)
      const fc = ['#ff5555', '#ffdd44', '#ff88cc', '#55aaff', '#ff8844']
      ctx.fillStyle = fc[(px * 7 + py * 13) % fc.length]
      ctx.beginPath()
      ctx.arc(px + 10, py + 14, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = fc[(px * 11 + py * 3) % fc.length]
      ctx.beginPath()
      ctx.arc(px + 22, py + 22, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffee88'
      ctx.beginPath()
      ctx.arc(px + 10, py + 14, 1.5, 0, Math.PI * 2)
      ctx.fill()
      break
    case T.BRIDGE:
      ctx.fillStyle = '#1565a8'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#8a6a28'
      ctx.fillRect(px, py + 2, s, s - 4)
      ctx.fillStyle = '#a07830'
      ctx.fillRect(px + 2, py + 4, s - 4, 4)
      ctx.fillRect(px + 2, py + s - 8, s - 4, 4)
      ctx.fillStyle = '#6a5020'
      ctx.fillRect(px, py + 2, 3, s - 4)
      ctx.fillRect(px + s - 3, py + 2, 3, s - 4)
      break
    case T.FENCE:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#8a6a3a'
      ctx.fillRect(px, py + 10, s, 4)
      ctx.fillRect(px, py + 22, s, 4)
      ctx.fillRect(px + 4, py + 6, 4, 22)
      ctx.fillRect(px + 24, py + 6, 4, 22)
      break
    case T.ROOF:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#c44a22'
      ctx.beginPath()
      ctx.moveTo(px - 4, py + s)
      ctx.lineTo(px + s / 2, py)
      ctx.lineTo(px + s + 4, py + s)
      ctx.fill()
      ctx.fillStyle = '#d45a32'
      ctx.beginPath()
      ctx.moveTo(px, py + s)
      ctx.lineTo(px + s / 2, py + 4)
      ctx.lineTo(px + s, py + s)
      ctx.fill()
      break
    case T.WALL:
      ctx.fillStyle = '#e8d8b8'
      ctx.fillRect(px, py, s, s)
      ctx.strokeStyle = '#c8b898'
      ctx.lineWidth = 1
      ctx.strokeRect(px + 2, py + 2, 12, 12)
      ctx.strokeRect(px + 18, py + 2, 12, 12)
      ctx.strokeRect(px + 8, py + 18, 12, 12)
      // Window
      ctx.fillStyle = '#88ccff'
      ctx.fillRect(px + 10, py + 4, 12, 8)
      ctx.strokeStyle = '#5a4a3a'
      ctx.strokeRect(px + 10, py + 4, 12, 8)
      ctx.beginPath()
      ctx.moveTo(px + 16, py + 4)
      ctx.lineTo(px + 16, py + 12)
      ctx.stroke()
      break
    case T.DOOR:
      ctx.fillStyle = '#e8d8b8'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#6a4a2a'
      ctx.fillRect(px + 8, py + 4, 16, 28)
      ctx.fillStyle = '#8a6a3a'
      ctx.fillRect(px + 10, py + 6, 12, 24)
      // Knob
      ctx.fillStyle = '#c7b777'
      ctx.beginPath()
      ctx.arc(px + 19, py + 18, 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case T.SIGN:
      ctx.fillStyle = '#d4b86a'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#6a4a2a'
      ctx.fillRect(px + 13, py + 16, 6, 16)
      ctx.fillStyle = '#c4a45a'
      ctx.fillRect(px + 6, py + 6, 20, 14)
      ctx.strokeStyle = '#6a4a2a'
      ctx.lineWidth = 2
      ctx.strokeRect(px + 6, py + 6, 20, 14)
      ctx.fillStyle = '#4a3a1a'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('!', px + 16, py + 17)
      break
    case T.SAND:
      ctx.fillStyle = '#e8d8a0'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#d8c890'
      ctx.fillRect(px + 5, py + 5, 4, 3)
      ctx.fillRect(px + 20, py + 22, 6, 3)
      break
    default:
      ctx.fillStyle = '#3a8a2a'
      ctx.fillRect(px, py, s, s)
  }
}

// ============ CHARACTER SPRITES ============

const CHAR_FRAMES = {
  down: [
    // Frame 0 (stand)
    (ctx, px, py) => {
      drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'down', 0)
    },
    // Frame 1 (walk left leg)
    (ctx, px, py) => {
      drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'down', 1)
    },
    // Frame 2 (walk right leg)
    (ctx, px, py) => {
      drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'down', 2)
    },
  ],
  up: [
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'up', 0) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'up', 1) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'up', 2) },
  ],
  left: [
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'left', 0) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'left', 1) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'left', 2) },
  ],
  right: [
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'right', 0) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'right', 1) },
    (ctx, px, py) => { drawCharBody(ctx, px, py, '#f0c880', '#c7b777', '#2a2a3a', 'right', 2) },
  ],
}

function drawCharBody(ctx, px, py, skin, shirt, pants, dir, frame) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(px + 16, py + 30, 9, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  const legOff = frame === 1 ? 3 : frame === 2 ? -3 : 0

  // Legs
  ctx.fillStyle = pants
  ctx.fillRect(px + 9, py + 22, 5, 8 + legOff)
  ctx.fillRect(px + 18, py + 22, 5, 8 - legOff)
  // Shoes
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(px + 8, py + 28 + legOff, 6, 3)
  ctx.fillRect(px + 18, py + 28 - legOff, 6, 3)

  // Body
  ctx.fillStyle = shirt
  ctx.fillRect(px + 8, py + 12, 16, 12)
  // Collar
  ctx.fillStyle = '#a89a5e'
  if (dir === 'down') ctx.fillRect(px + 12, py + 12, 8, 3)

  // Arms
  ctx.fillStyle = shirt
  const armSwing = frame === 1 ? 2 : frame === 2 ? -2 : 0
  if (dir === 'left') {
    ctx.fillRect(px + 4, py + 13 + armSwing, 5, 10)
    ctx.fillStyle = skin
    ctx.fillRect(px + 4, py + 21 + armSwing, 5, 3)
  } else if (dir === 'right') {
    ctx.fillRect(px + 23, py + 13 + armSwing, 5, 10)
    ctx.fillStyle = skin
    ctx.fillRect(px + 23, py + 21 + armSwing, 5, 3)
  } else {
    ctx.fillRect(px + 4, py + 13 - armSwing, 5, 10)
    ctx.fillRect(px + 23, py + 13 + armSwing, 5, 10)
    ctx.fillStyle = skin
    ctx.fillRect(px + 4, py + 21 - armSwing, 5, 3)
    ctx.fillRect(px + 23, py + 21 + armSwing, 5, 3)
  }

  // Head
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(px + 16, py + 8, 8, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = '#3a2a1a'
  if (dir === 'up') {
    ctx.beginPath()
    ctx.arc(px + 16, py + 7, 8, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(px + 16, py + 5, 8, Math.PI + 0.3, Math.PI * 2 - 0.3)
    ctx.fill()
    ctx.fillRect(px + 8, py + 2, 16, 5)
  }

  // Face
  if (dir !== 'up') {
    ctx.fillStyle = '#1a1a1a'
    if (dir === 'down') {
      ctx.fillRect(px + 12, py + 8, 2, 2)
      ctx.fillRect(px + 18, py + 8, 2, 2)
      // Mouth
      ctx.fillRect(px + 14, py + 12, 4, 1)
    } else if (dir === 'left') {
      ctx.fillRect(px + 10, py + 8, 2, 2)
      ctx.fillRect(px + 13, py + 12, 3, 1)
    } else if (dir === 'right') {
      ctx.fillRect(px + 20, py + 8, 2, 2)
      ctx.fillRect(px + 16, py + 12, 3, 1)
    }
  }
}

function drawNPC(ctx, npc, px, py, tick) {
  const colors = {
    mentor: { skin: '#d4a060', shirt: '#c7b777', pants: '#2a2a5a', hair: '#888' },
    villager: { skin: '#f0c880', shirt: '#55aa55', pants: '#5555aa', hair: '#8a4a2a' },
    warrior: { skin: '#c8a060', shirt: '#aa3333', pants: '#3a3a3a', hair: '#1a1a1a' },
    sage: { skin: '#f0d0a0', shirt: '#6644aa', pants: '#4a4a4a', hair: '#eee' },
    old: { skin: '#d8b888', shirt: '#7a7a6a', pants: '#4a4a3a', hair: '#ccc' },
    trader: { skin: '#e0b878', shirt: '#cc8833', pants: '#5a3a2a', hair: '#4a3a1a' },
  }
  const c = colors[npc.sprite] || colors.villager

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillStyle = c.pants
  ctx.fillRect(px + 10, py + 22, 5, 8)
  ctx.fillRect(px + 17, py + 22, 5, 8)
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(px + 9, py + 28, 6, 3)
  ctx.fillRect(px + 17, py + 28, 6, 3)

  ctx.fillStyle = c.shirt
  ctx.fillRect(px + 8, py + 12, 16, 12)
  ctx.fillRect(px + 4, py + 14, 5, 8)
  ctx.fillRect(px + 23, py + 14, 5, 8)

  // Head
  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(px + 16, py + 8, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.hair
  ctx.beginPath()
  ctx.arc(px + 16, py + 5, 8, Math.PI + 0.3, Math.PI * 2 - 0.3)
  ctx.fill()
  ctx.fillRect(px + 8, py + 2, 16, 5)

  // Eyes
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(px + 12, py + 8, 2, 2)
  ctx.fillRect(px + 18, py + 8, 2, 2)

  // Exclamation mark (floating)
  const bob = Math.sin(tick * 0.05) * 3
  ctx.fillStyle = '#c7b777'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', px + 16, py - 6 + bob)

  // Name
  ctx.fillStyle = '#c7b777'
  ctx.font = '9px monospace'
  ctx.fillText(npc.name, px + 16, py - 14 + bob)
}

// ============ ZONE LABELS ============

function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const bw = zone.name.length * 5.5 + 20
  const bx = px + TILE / 2 - bw / 2
  const by = py - 28

  ctx.fillStyle = completed ? 'rgba(199,183,119,0.9)' : unlocked ? 'rgba(20,20,30,0.85)' : 'rgba(10,10,15,0.7)'
  ctx.strokeStyle = completed ? '#e0d9a8' : unlocked ? '#c7b777' : '#444'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, 22, 6)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = completed ? '#1a1a2a' : unlocked ? '#c7b777' : '#555'
  ctx.font = 'bold 9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(zone.name, px + TILE / 2, by + 15)

  if (!unlocked) {
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.fillText('\u{1F512}', px + TILE / 2, by - 4)
  }
  if (completed) {
    ctx.fillStyle = '#2a6a1e'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('\u2713', px + TILE / 2, by - 2)
  }
}

// ============ DIALOG BOX ============

function drawDialogBox(ctx, viewW, viewH, speaker, text, charIndex) {
  const boxH = 100
  const boxY = viewH - boxH - 10
  const boxX = 10
  const boxW = viewW - 20

  // Box background
  ctx.fillStyle = 'rgba(5,5,15,0.92)'
  ctx.strokeStyle = '#c7b777'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.fill()
  ctx.stroke()

  // Inner border
  ctx.strokeStyle = 'rgba(199,183,119,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8, 8)
  ctx.stroke()

  // Speaker name
  if (speaker) {
    const nameW = speaker.length * 8 + 16
    ctx.fillStyle = '#c7b777'
    ctx.beginPath()
    ctx.roundRect(boxX + 12, boxY - 14, nameW, 22, 6)
    ctx.fill()
    ctx.fillStyle = '#0a0a0f'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(speaker, boxX + 20, boxY + 2)
  }

  // Text with typewriter effect
  const visibleText = text.substring(0, charIndex)
  ctx.fillStyle = '#f0f0f0'
  ctx.font = '13px monospace'
  ctx.textAlign = 'left'

  // Word wrap
  const maxW = boxW - 40
  const words = visibleText.split(' ')
  let line = ''
  let lineY = boxY + 28
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    if (ctx.measureText(testLine).width > maxW && line) {
      ctx.fillText(line, boxX + 20, lineY)
      line = word
      lineY += 20
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, boxX + 20, lineY)

  // Continue indicator
  if (charIndex >= text.length) {
    const blink = Math.sin(Date.now() * 0.008) > 0
    if (blink) {
      ctx.fillStyle = '#c7b777'
      ctx.beginPath()
      ctx.moveTo(boxX + boxW - 28, boxY + boxH - 20)
      ctx.lineTo(boxX + boxW - 22, boxY + boxH - 14)
      ctx.lineTo(boxX + boxW - 16, boxY + boxH - 20)
      ctx.fill()
    }
  }
}

// ============ CAMERA & COLLISION ============

function getCamera(charX, charY, viewW, viewH) {
  const mapW = COLS * TILE
  const mapH = ROWS * TILE
  let cx = charX - viewW / 2
  let cy = charY - viewH / 2
  cx = Math.max(0, Math.min(cx, mapW - viewW))
  cy = Math.max(0, Math.min(cy, mapH - viewH))
  return { x: cx, y: cy }
}

function getAdjacentZone(tileX, tileY) {
  for (const zone of ZONES) {
    // Check if near the door (zone.y + 1, zone.x)
    const dx = Math.abs(tileX - zone.x)
    const dy = Math.abs(tileY - (zone.y + 1))
    if (dx <= 1 && dy <= 1) return zone
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
  // Check NPC collision
  for (const npc of NPCS) {
    if (npc.x === x && npc.y === y) return false
  }
  return true
}

export {
  TILE, COLS, ROWS, T, ZONES, NPCS,
  generateMap, drawTile, drawZoneLabel, drawNPC, drawDialogBox,
  CHAR_FRAMES, getCamera, getAdjacentZone, getAdjacentNPC, canMove,
}
