// VDX Quest RPG Engine - Village-based week structure

const TILE = 16
const COLS = 40
const ROWS = 32

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

// Semaine 1 village: 3 missions (zones) — each house = 1 action non negociable
const ZONES = [
  { id: 1, weekId: 1, questId: 'w1q1', requiredQuest: null,
    houseX: 6, houseY: 5, name: 'Cabane de la Verite', region: 1,
    desc: 'Ecrire noir sur blanc : ta raison profonde.',
    guardian: {
      sprite: 'old', name: 'Gardien Alain',
      dialog: [
        'Felicitations, aventurier !',
        'Tu as ecrit ta verite. Ce texte, c\'est ton ancre.',
        'Quand le doute arrivera — et il arrivera — relis ce que tu as ecrit.',
        'Voici ton Badge de Verite. +100 XP. Tu peux maintenant acceder a la prochaine maison.',
        'Continue. La clarte est un muscle. Plus tu ecris, plus tu vois.',
      ],
      badge: 'Badge de Verite',
      xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h1_sage', x: 4, y: 7, sprite: 'sage', name: 'Maeva', dialog: [
        'Bienvenue dans la Cabane de la Verite.',
        'Ta premiere mission : ecrire noir sur blanc pourquoi tu veux entreprendre.',
        'Pas 3 lignes. Un texte brut, long, sans chercher le style.',
        '5 blocs a ecrire : ta raison reelle, ce que tu refuses, tes plus jamais, ta honte silencieuse, ta promesse.',
        'Ecris en "je". Mets des exemples concrets. Pas de generalites.',
        'Termine par une seule phrase : "Je fais ca parce que..."',
      ]},
      { id: 'h1_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Victor', dialog: [
        'Tant que tu restes dans le mental, tu es intouchable.',
        'Des que tu ecris vrai, tu deviens responsable.',
        'C\'est ca, le seuil. Et c\'est exactement ce qu\'on cherche.',
        'Accepte de ne plus chercher la reponse parfaite.',
        'Chercher la reponse parfaite, c\'est souvent une strategie pour eviter de choisir.',
      ]},
      { id: 'h1_helper', x: 9, y: 9, sprite: 'villager', name: 'Camille', dialog: [
        'Ton livrable : un document de minimum 2 pages.',
        'Une phrase de synthese : "Je fais ca parce que..."',
        'Et une liste "plus jamais" de 10 lignes.',
        'Va a l\'autel au fond pour valider ta mission quand c\'est fait.',
      ]},
    ],
  },
  { id: 2, weekId: 1, questId: 'w1q2', requiredQuest: 'w1q1',
    houseX: 24, houseY: 5, name: 'Tour de l\'Inventaire', region: 1,
    desc: 'Inventaire honnete : ce que tu sais faire.',
    guardian: {
      sprite: 'trader', name: 'Gardien Selma',
      dialog: [
        'Bravo ! Tu as fait l\'inventaire de tes competences.',
        'Tu sais maintenant ce que tu SAIS faire. Pas ce que tu imagines.',
        'Cette lucidite, c\'est ton arme. Elle te protege du syndrome de l\'imposteur.',
        'Voici ton Badge d\'Inventaire. +100 XP.',
        'La prochaine maison t\'attend. Le silence va te reveler des choses.',
      ],
      badge: 'Badge d\'Inventaire',
      xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h2_sage', x: 4, y: 7, sprite: 'sage', name: 'Raphael', dialog: [
        'Bienvenue dans la Tour de l\'Inventaire.',
        'Ta mission : inventorier ce que tu sais VRAIMENT faire.',
        'Pas ce que tu "pourrais" faire. Ce que tu as PROUVE.',
        '4 listes : competences techniques, competences humaines, experiences vecues, ce que les autres cherchent chez toi.',
        'Tu ecris TOUT. Meme ce que tu juges banal.',
      ]},
      { id: 'h2_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Nadia', dialog: [
        'Le banal, quand c\'est maitrise, devient monetisable.',
        'Pour chaque competence, ajoute une preuve concrete.',
        '"Je sais organiser" devient : "J\'ai coordonne une equipe de 3 pendant 6 mois avec des deadlines hebdo."',
        'Tu veux de la matiere qui resiste a la realite.',
      ]},
      { id: 'h2_helper', x: 9, y: 9, sprite: 'villager', name: 'Theo', dialog: [
        'A la fin, extrais 3 piliers de valeur :',
        '1. Ce que tu maitrises et peux delivrer vite.',
        '2. Ce que tu comprends profondement et peux expliquer.',
        '3. Ce que tu as deja resolu et peux reproduire.',
        'Livrable : 4 listes + 3 piliers + 10 preuves ecrites.',
      ]},
    ],
  },
  { id: 3, weekId: 1, questId: 'w1q3', requiredQuest: 'w1q2',
    houseX: 6, houseY: 17, name: 'Forge du Silence', region: 1,
    desc: '7 jours sans surconsommation.',
    guardian: {
      sprite: 'sage', name: 'Gardien Yuki',
      dialog: [
        'Impressionnant. 7 jours de silence. Tu as recupere ton attention.',
        'La plupart des gens ne tiennent pas 24 heures. Toi, tu as tenu une semaine.',
        'Ton esprit est plus clair maintenant. Tu peux sentir la difference.',
        'Voici ton Badge du Silence. +100 XP.',
        'La Semaine 1 est terminee. Tu as prouve que tu peux agir.',
        'Prepare-toi pour la suite : choisir un probleme reel a resoudre.',
      ],
      badge: 'Badge du Silence',
      xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h3_sage', x: 4, y: 7, sprite: 'sage', name: 'Eliane', dialog: [
        'Bienvenue dans la Forge du Silence.',
        'Ta mission : 7 jours de silence informationnel.',
        'Bloque YouTube, les formations, les podcasts business, les threads sans fin.',
        'Ton energie va dans la production de reel, pas dans l\'absorption de contenu.',
        'Autorise uniquement : notes, ecriture, inventaire, conversations reelles.',
      ]},
      { id: 'h3_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Axel', dialog: [
        'La clarte arrive quand le bruit descend.',
        'Ta tete recevra un signal fort : mon futur depend de mes decisions, pas de ma prochaine video.',
        'Tu recuperes ton attention. Et ton attention, c\'est ton actif le plus precieux.',
        'Quand ton attention se stabilise, ta trajectoire gagne en puissance.',
      ]},
      { id: 'h3_helper', x: 9, y: 9, sprite: 'villager', name: 'Ines', dialog: [
        'Remplace la consommation par un rituel minimal :',
        '30 min/jour : ecrire, clarifier, structurer ton inventaire.',
        '15 min/jour : relire ce que tu as ecrit et surligner les phrases vraies.',
        'Tracking simple : 7 cases a cocher. Un rituel quotidien fixe (horaire + duree).',
      ]},
    ],
  },
]

// Computed door positions (bottom center of house)
ZONES.forEach(z => {
  z.doorX = z.houseX + 1
  z.doorY = z.houseY + 3
})

// NPCs on the overworld — with wander support
const NPCS = [
  {
    id: 'mentor', x: 19, y: 26, sprite: 'mentor', name: 'Laurent', wander: 2,
    dialog: [
      'Bienvenue, aventurier. Je suis Laurent, ton guide pour les 90 prochains jours.',
      'L\'objectif du Niveau 0 : passer de quelqu\'un qui pense a entreprendre... a quelqu\'un qui agit.',
      'Ce premier mois, on va te sortir du flou et t\'ancrer dans le reel.',
      'Cette semaine — Semaine 1 : Arreter la fuite mentale.',
      'Tu as 3 missions. Chaque maison contient une epreuve avec des conseillers.',
      'Cabane de la Verite au nord-ouest : ecrire ta raison profonde.',
      'Tour de l\'Inventaire au nord-est : identifier ce que tu sais faire.',
      'Forge du Silence au sud-ouest : couper le bruit pendant 7 jours.',
      'Entre dans chaque maison, parle aux conseillers, puis valide ta mission a l\'autel.',
      'A la fin de cette semaine, tu dois pouvoir dire : "Voila pourquoi je fais ca."',
      'Bonne route, entrepreneur.',
    ]
  },
  {
    id: 'guide1', x: 15, y: 13, sprite: 'villager', name: 'Elise', wander: 3,
    dialog: [
      'Salut ! Bienvenue dans le Village de la Clarte.',
      'Les 3 maisons sont les 3 epreuves de la Semaine 1.',
      'Chaque maison a des conseillers qui t\'expliquent ta mission.',
      'Parle-leur, puis va a l\'autel pour valider quand c\'est fait.',
    ]
  },
  {
    id: 'old1', x: 27, y: 14, sprite: 'old', name: 'Ancien', wander: 1,
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
      'Au niveau 0, le vrai probleme n\'est pas le manque de competences.',
      'C\'est la dispersion mentale. Trop de pistes, trop de scenarios.',
      'Reste concentre. Une mission a la fois.',
    ]
  },
  {
    id: 'trader1', x: 22, y: 12, sprite: 'trader', name: 'Marc', wander: 2,
    dialog: [
      'Je suis Marc, ancien entrepreneur.',
      'Mon premier business a echoue. Le deuxieme aussi.',
      'Mais j\'ai appris une chose : le passage a l\'action bat la reflexion.',
      'Chaque echec est une donnee. Pas un verdict.',
    ]
  },
  {
    id: 'villager2', x: 8, y: 24, sprite: 'villager', name: 'Sophie', wander: 3,
    dialog: [
      'Tu vois ce jardin ? Je l\'ai plante graine par graine.',
      'L\'entrepreneuriat, c\'est pareil. Une action a la fois.',
      'Ne regarde pas la montagne. Regarde le prochain pas.',
    ]
  },
  {
    id: 'warrior1', x: 17, y: 16, sprite: 'warrior', name: 'Karim', wander: 2,
    dialog: [
      'J\'etais paralyse par la peur de me tromper.',
      'Puis j\'ai compris : ne rien faire, c\'est deja se tromper.',
      'La peur ne disparait jamais. On apprend a agir avec.',
      'Le courage, c\'est pas l\'absence de peur. C\'est le choix d\'avancer malgre elle.',
    ]
  },
  {
    id: 'sage1', x: 32, y: 13, sprite: 'sage', name: 'Aiko', wander: 2,
    dialog: [
      'L\'eau de ce lac est calme... comme ton esprit devrait l\'etre.',
      'La clarte ne vient pas en cherchant plus.',
      'Elle vient quand tu arretes de fuir le silence.',
      'Pose-toi. Ecris. Observe ce qui monte.',
    ]
  },
]

// Initialize NPC wandering state
NPCS.forEach(npc => {
  npc.homeX = npc.x
  npc.homeY = npc.y
  npc.direction = 'down'
  npc.walkFrame = 0
  npc.walkTick = 0
  npc.moving = false
  npc.tx = npc.x
  npc.ty = npc.y
  npc.moveFrame = 0
  npc.ox = 0
  npc.oy = 0
  npc.wanderTimer = Math.floor(Math.random() * 120) + 60
})

const NPC_MOVE_FRAMES = 12
const DIRS = [
  { dx: 0, dy: -1, dir: 'up' },
  { dx: 0, dy: 1, dir: 'down' },
  { dx: -1, dy: 0, dir: 'left' },
  { dx: 1, dy: 0, dir: 'right' },
]

function updateNPCs(map, playerX, playerY) {
  for (const npc of NPCS) {
    if (npc.moving) {
      npc.moveFrame++
      const progress = npc.moveFrame / NPC_MOVE_FRAMES
      npc.ox = (npc.tx - npc.x) * TILE * progress
      npc.oy = (npc.ty - npc.y) * TILE * progress
      npc.walkTick++
      if (npc.walkTick % 6 === 0) npc.walkFrame = (npc.walkFrame + 1) % 3
      if (npc.moveFrame >= NPC_MOVE_FRAMES) {
        npc.x = npc.tx
        npc.y = npc.ty
        npc.ox = 0
        npc.oy = 0
        npc.moving = false
        npc.moveFrame = 0
        npc.wanderTimer = 40 + Math.floor(Math.random() * 100)
      }
    } else {
      npc.walkFrame = 0
      npc.wanderTimer--
      if (npc.wanderTimer <= 0 && npc.wander) {
        // Pick a random direction
        const d = DIRS[Math.floor(Math.random() * DIRS.length)]
        const nx = npc.x + d.dx
        const ny = npc.y + d.dy
        // Stay within wander radius of home
        const dist = Math.abs(nx - npc.homeX) + Math.abs(ny - npc.homeY)
        if (dist <= npc.wander && canMove(map, nx, ny)) {
          // Don't walk into player
          if (nx !== playerX || ny !== playerY) {
            // Don't walk into other NPCs
            let blocked = false
            for (const other of NPCS) {
              if (other !== npc && other.x === nx && other.y === ny) { blocked = true; break }
            }
            if (!blocked) {
              npc.direction = d.dir
              npc.tx = nx
              npc.ty = ny
              npc.moving = true
              npc.moveFrame = 0
            }
          }
        }
        npc.wanderTimer = 60 + Math.floor(Math.random() * 120)
      }
    }
  }
}

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

  // ============ NATURAL TERRAIN ============

  // Scattered flowers
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(rng() * COLS)
    const y = Math.floor(rng() * ROWS)
    if (map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Dark grass patches (variety)
  for (const [cx, cy] of [[8, 20], [30, 5], [35, 22], [3, 8], [25, 28]]) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.35) {
          if (map[ny][nx] === T.GRASS) map[ny][nx] = T.DARK_GRASS
        }
      }
    }
  }

  // Tall grass patches
  for (const [cx, cy] of [[2, 15], [36, 8], [36, 25], [15, 28], [28, 3], [8, 5]]) {
    const size = 1 + Math.floor(rng() * 2)
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size - 1; dx <= size + 1; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.25) {
          if (map[ny][nx] === T.GRASS || map[ny][nx] === T.DARK_GRASS) map[ny][nx] = T.TALL_GRASS
        }
      }
    }
  }

  // ============ DENSE FOREST BORDERS ============
  // Two rows of trees on all edges
  for (let x = 0; x < COLS; x++) {
    map[0][x] = T.TREE
    if (rng() > 0.15) map[1][x] = T.TREE
    map[ROWS - 1][x] = T.TREE
    if (rng() > 0.15) map[ROWS - 2][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    map[y][0] = T.TREE
    if (rng() > 0.15) map[y][1] = T.TREE
    map[y][COLS - 1] = T.TREE
    if (rng() > 0.15) map[y][COLS - 2] = T.TREE
  }

  // Interior forest clusters (scenic)
  const forestClusters = [
    [37, 4, 2], [2, 24, 2], [37, 26, 2], [14, 2, 1],
    [26, 2, 1], [2, 10, 1], [37, 15, 1], [30, 20, 2],
    [10, 26, 1], [33, 10, 1],
  ]
  for (const [fx, fy, rad] of forestClusters) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const nx = fx + dx, ny = fy + dy
        if (nx > 1 && ny > 1 && nx < COLS - 2 && ny < ROWS - 2 && rng() > 0.15) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // ============ WATER: LAKE + RIVER ============
  // Main lake (east side)
  const lakeCX = 30, lakeCY = 14
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.sqrt(dx * dx * 0.8 + dy * dy * 1.2)
      if (dist < 3.5 && lakeCX + dx > 2 && lakeCY + dy > 2 && lakeCX + dx < COLS - 2 && lakeCY + dy < ROWS - 2) {
        map[lakeCY + dy][lakeCX + dx] = T.WATER
      }
    }
  }

  // Small stream flowing south from lake
  for (let y = 17; y <= 22; y++) {
    map[y][29] = T.WATER
    if (rng() > 0.4) map[y][30] = T.WATER
  }

  // Small pond south
  for (const [wx, wy] of [[29, 23], [30, 23], [29, 24], [30, 24]]) {
    if (wy < ROWS - 2) map[wy][wx] = T.WATER
  }

  // Bridge over stream (3 tiles wide for a real bridge feel)
  for (let bx = 28; bx <= 31; bx++) {
    if (map[19][bx] === T.WATER || map[19][bx] === T.SAND) map[19][bx] = T.BRIDGE
    if (map[18][bx] === T.WATER || map[18][bx] === T.SAND) map[18][bx] = T.BRIDGE
  }
  // Fences as bridge railings
  map[17][28] = T.FENCE; map[17][31] = T.FENCE
  map[20][28] = T.FENCE; map[20][31] = T.FENCE

  // Sand shores around all water
  for (let y = 2; y < ROWS - 2; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      if (map[y][x] !== T.WATER) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
            const t = map[ny][nx]
            if (t === T.GRASS || t === T.FLOWER || t === T.DARK_GRASS || t === T.TALL_GRASS) {
              map[ny][nx] = T.SAND
            }
          }
        }
      }
    }
  }

  // ============ MOUNTAINS (north-east corner) ============
  for (const [mx, my] of [[34, 4], [35, 4], [36, 5], [34, 5], [35, 5], [33, 5]]) {
    if (mx < COLS - 2 && my < ROWS - 2) map[my][mx] = T.MOUNTAIN
  }

  // ============ VILLAGE PATH NETWORK ============
  // Main crossroads at center (y=13, x=20)
  // Horizontal main road
  for (let x = 2; x < COLS - 2; x++) {
    map[13][x] = T.PATH
    map[14][x] = T.PATH
  }
  // Vertical main road
  for (let y = 2; y < ROWS - 2; y++) {
    map[y][19] = T.PATH
    map[y][20] = T.PATH
  }

  // Secondary paths to houses
  for (const zone of ZONES) {
    const doorX = zone.doorX
    const doorY = zone.doorY + 1

    // Vertical path from door to horizontal main road
    const targetY = 13
    const minY = Math.min(doorY, targetY)
    const maxY = Math.max(doorY, targetY)
    for (let y = minY; y <= maxY; y++) {
      const t = map[y][doorX]
      if (t !== T.PATH && t !== T.WATER && t !== T.BRIDGE) map[y][doorX] = T.PATH
    }

    // Horizontal path from door to vertical main road
    const minX = Math.min(doorX, 19)
    const maxX = Math.max(doorX, 20)
    for (let x = minX; x <= maxX; x++) {
      const t = map[doorY][x]
      if (t !== T.PATH && t !== T.WATER && t !== T.BRIDGE) map[doorY][x] = T.PATH
    }
  }

  // Path to lake area
  for (let x = 20; x <= 27; x++) { map[14][x] = T.PATH }
  // Path to south area
  for (let y = 14; y <= 26; y++) { map[y][20] = T.PATH }
  // Circular village square path
  for (let x = 16; x <= 23; x++) { map[11][x] = T.PATH; map[16][x] = T.PATH }
  for (let y = 11; y <= 16; y++) { map[y][16] = T.PATH; map[y][23] = T.PATH }

  // ============ PLACE HOUSES ============
  for (const zone of ZONES) {
    const hx = zone.houseX
    const hy = zone.houseY

    // Clear area around house
    for (let dy = -1; dy <= 4; dy++) {
      for (let dx = -1; dx <= 3; dx++) {
        const nx = hx + dx, ny = hy + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
          if (map[ny][nx] !== T.PATH) map[ny][nx] = T.GRASS
        }
      }
    }

    // House structure (3 wide x 4 tall)
    map[hy][hx]     = T.HOUSE_ROOF_TL
    map[hy][hx + 1] = T.HOUSE_ROOF_TC
    map[hy][hx + 2] = T.HOUSE_ROOF_TR
    map[hy + 1][hx]     = T.HOUSE_ROOF_ML
    map[hy + 1][hx + 1] = T.HOUSE_ROOF_MC
    map[hy + 1][hx + 2] = T.HOUSE_ROOF_MR
    map[hy + 2][hx]     = T.HOUSE_WALL_L
    map[hy + 2][hx + 1] = T.HOUSE_WALL_WIN
    map[hy + 2][hx + 2] = T.HOUSE_WALL_R
    map[hy + 3][hx]     = T.HOUSE_WALL_DL
    map[hy + 3][hx + 1] = T.HOUSE_DOOR
    map[hy + 3][hx + 2] = T.HOUSE_WALL_DR

    // Path in front of door
    map[hy + 4][hx + 1] = T.PATH
    // Sign next to house
    if (hx + 3 < COLS) map[hy + 3][hx + 3] = T.SIGN
  }

  // ============ GARDEN AREA (south-west) ============
  for (let y = 22; y <= 26; y++) {
    for (let x = 5; x <= 12; x++) {
      if (map[y][x] === T.GRASS || map[y][x] === T.DARK_GRASS) {
        map[y][x] = rng() > 0.4 ? T.FLOWER : T.GRASS
      }
    }
  }
  // Garden fences
  for (let x = 4; x <= 13; x++) { map[21][x] = T.FENCE; map[27][x] = T.FENCE }
  for (let y = 21; y <= 27; y++) { map[y][4] = T.FENCE; map[y][13] = T.FENCE }
  // Garden entrances
  map[21][8] = T.PATH; map[21][9] = T.PATH
  map[27][8] = T.PATH; map[27][9] = T.PATH

  // ============ VILLAGE DECORATIONS ============
  // Fences near village square
  for (let x = 13; x <= 15; x++) { map[11][x] = T.FENCE }
  for (let x = 24; x <= 26; x++) { map[11][x] = T.FENCE }

  // Flower garden near crossroads
  for (const [fx, fy] of [[17, 12], [18, 12], [21, 12], [22, 12], [17, 15], [18, 15], [21, 15], [22, 15]]) {
    map[fy][fx] = T.FLOWER
  }

  // ============ ENSURE WALKABILITY ============
  for (const npc of NPCS) {
    if (npc.y < ROWS && npc.x < COLS) {
      if (map[npc.y][npc.x] !== T.PATH) map[npc.y][npc.x] = T.PATH
    }
  }

  return map
}

// ============ ZONE/NPC LABELS ============

function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  // px/py in screen-space. House is 3 tiles wide = 3*48 = 144px
  const tileScreen = TILE * 3
  const cx = px + tileScreen * 1.5  // center of 3-tile-wide house
  const bw = zone.name.length * 4.5 + 16
  const bx = cx - bw / 2
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
  ctx.fillText(zone.name, cx, by + 11)

  if (!unlocked) {
    ctx.fillStyle = '#666'
    ctx.font = '8px sans-serif'
    ctx.fillText('\u{1F512}', cx, by - 2)
  }
  if (completed) {
    ctx.fillStyle = '#2a6a1e'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('\u2713', cx, by - 1)
  }
}

function drawNPCLabel(ctx, npc, px, py, tick) {
  // px/py are in screen-space (npc.x * TILE * SCALE)
  // Characters are 16x16 single-tile sprites (SCALE=3 → 48x48 on screen)
  const tileScreen = TILE * 3  // 48px
  const cx = px + tileScreen / 2
  const bob = Math.sin(tick * 0.05) * 2

  ctx.fillStyle = '#c7b777'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', cx, py - 6 + bob)

  const nameW = npc.name.length * 4.5 + 8
  const nameX = cx - nameW / 2
  const nameY = py - 16 + bob

  ctx.fillStyle = 'rgba(5,5,15,0.75)'
  ctx.beginPath()
  ctx.roundRect(nameX, nameY, nameW, 10, 3)
  ctx.fill()

  ctx.fillStyle = '#c7b777'
  ctx.font = '6px monospace'
  ctx.fillText(npc.name, cx, nameY + 7)
}

// ============ CAMERA & COLLISION ============

function getAdjacentZone(tileX, tileY) {
  for (const zone of ZONES) {
    // Check if player is near the door — generous detection zone
    const dx = Math.abs(tileX - zone.doorX)
    const dy = tileY - zone.doorY
    if (dx <= 1 && dy >= 0 && dy <= 2) return zone
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

function getAdjacentInteriorNPC(tileX, tileY, interiorNpcs) {
  if (!interiorNpcs) return null
  for (const npc of interiorNpcs) {
    const dx = Math.abs(tileX - npc.x)
    const dy = Math.abs(tileY - npc.y)
    if (dx <= 1 && dy <= 1) return npc
  }
  return null
}

export {
  TILE, COLS, ROWS, T, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, getAdjacentInteriorNPC, canMove, updateNPCs,
}
