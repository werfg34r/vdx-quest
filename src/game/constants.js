// ═══════════════════════════════════════════════════════
// SUNNYSIDE WORLD - Game Constants & Definitions
// ═══════════════════════════════════════════════════════

// ── Tile & Rendering ──
export const TILE = 16;
export const SCALE = 2;
export const RS = TILE * SCALE;

// Room dimensions from GameMaker Room1
export const ROOM_W = 1366;
export const ROOM_H = 768;
export const MAP_W = 86;
export const MAP_H = 48;

// ── Game modes ──
export const MODE = {
  WORLD: 0,
  INTERIOR: 1,
  DEAD: 2,
  SHOP: 3,
};

// ── Player stats ──
export const PLAYER_SPEED = 1.8;
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_START_GOLD = 50;
export const PLAYER_START_X = 35;
export const PLAYER_START_Y = 30;
export const PLAYER_INVULN_FRAMES = 45;

// ── Tools ──
export const TOOLS = {
  sword:   { name: 'Epee',       icon: 'sword',    action: 'spr_attack',   frames: 20, staminaCost: 5,  damage: 25 },
  axe:     { name: 'Hache',      icon: 'axe',      action: 'spr_axe',      frames: 25, staminaCost: 8,  damage: 0 },
  pickaxe: { name: 'Pioche',     icon: 'pickaxe',  action: 'spr_mining',   frames: 25, staminaCost: 8,  damage: 0 },
  shovel:  { name: 'Pelle',      icon: 'shovel',   action: 'spr_dig',      frames: 25, staminaCost: 5,  damage: 0 },
  water:   { name: 'Arrosoir',   icon: 'water',    action: 'spr_watering', frames: 20, staminaCost: 3,  damage: 0 },
  rod:     { name: 'Canne',      icon: 'rod',      action: 'spr_casting',  frames: 40, staminaCost: 4,  damage: 0 },
};

export const STARTER_TOOLS = ['sword', 'axe'];

// ── Items ──
export const ITEM_TYPES = {
  wood:       { name: 'Bois',        icon: 'wood',          stackable: true,  sellPrice: 5 },
  rock:       { name: 'Pierre',      icon: 'rock',          stackable: true,  sellPrice: 3 },
  fish:       { name: 'Poisson',     icon: 'fish',          stackable: true,  sellPrice: 15 },
  egg:        { name: 'Oeuf',        icon: 'egg',           stackable: true,  sellPrice: 8 },
  milk:       { name: 'Lait',        icon: 'milk',          stackable: true,  sellPrice: 10 },
  wheat:      { name: 'Ble',         icon: 'wheat_05',      stackable: true,  sellPrice: 12 },
  beetroot:   { name: 'Betterave',   icon: 'beetroot_05',   stackable: true,  sellPrice: 18 },
  carrot:     { name: 'Carotte',     icon: 'carrot_05',     stackable: true,  sellPrice: 14 },
  pumpkin:    { name: 'Citrouille',  icon: 'pumpkin_05',    stackable: true,  sellPrice: 25 },
  cabbage:    { name: 'Chou',        icon: 'cabbage_05',    stackable: true,  sellPrice: 16 },
  sunflower:  { name: 'Tournesol',   icon: 'sunflower_05',  stackable: true,  sellPrice: 20 },
  potato:     { name: 'Pomme de t.', icon: 'potato_05',     stackable: true,  sellPrice: 12 },
  seed_wheat:     { name: 'Gr. Ble',       icon: 'seeds_generic', stackable: true, sellPrice: 2 },
  seed_beetroot:  { name: 'Gr. Betterave', icon: 'seeds_generic', stackable: true, sellPrice: 2 },
  seed_carrot:    { name: 'Gr. Carotte',   icon: 'seeds_generic', stackable: true, sellPrice: 2 },
  seed_pumpkin:   { name: 'Gr. Citrouille',icon: 'seeds_generic', stackable: true, sellPrice: 2 },
};

// ── Crops ──
export const CROP_TYPES = {
  wheat:    { stages: 6, sprite: 'wheat',    growMinutes: 60,  harvest: 'wheat',    count: 2 },
  beetroot: { stages: 6, sprite: 'beetroot', growMinutes: 90,  harvest: 'beetroot', count: 1 },
  carrot:   { stages: 6, sprite: 'carrot',   growMinutes: 60,  harvest: 'carrot',   count: 2 },
  pumpkin:  { stages: 6, sprite: 'pumpkin',  growMinutes: 120, harvest: 'pumpkin',  count: 1 },
};

// ── Shop ──
export const SHOP_ITEMS = [
  { type: 'tool',  id: 'pickaxe', name: 'Pioche',          price: 80,  icon: 'pickaxe' },
  { type: 'tool',  id: 'shovel',  name: 'Pelle',           price: 60,  icon: 'shovel' },
  { type: 'tool',  id: 'water',   name: 'Arrosoir',        price: 50,  icon: 'water' },
  { type: 'tool',  id: 'rod',     name: 'Canne a peche',   price: 100, icon: 'rod' },
  { type: 'item',  id: 'seed_wheat',    name: 'Gr. Ble x5',       price: 15, icon: 'seeds_generic', count: 5 },
  { type: 'item',  id: 'seed_beetroot', name: 'Gr. Betterave x5', price: 20, icon: 'seeds_generic', count: 5 },
  { type: 'item',  id: 'seed_carrot',   name: 'Gr. Carotte x5',   price: 15, icon: 'seeds_generic', count: 5 },
  { type: 'item',  id: 'seed_pumpkin',  name: 'Gr. Citrouille x3',price: 25, icon: 'seeds_generic', count: 3 },
];

// ── Houses ──
export const HOUSES = [
  {
    id: 'maison_savoir', name: 'Maison du Savoir', style: 'red',
    doorX: 53, doorY: 16, spawnX: 53 * 16, spawnY: 16.5 * 16,
  },
  {
    id: 'maison_courage', name: 'Maison du Courage', style: 'green',
    doorX: 40, doorY: 20, spawnX: 40 * 16, spawnY: 20.5 * 16,
  },
  {
    id: 'maison_esprit', name: "Maison de l'Esprit", style: 'blue',
    doorX: 34, doorY: 24, spawnX: 34 * 16, spawnY: 24.5 * 16,
  },
];

export const INT_W = 10;
export const INT_H = 8;

// ── Day/Night ──
export const TIME_SPEED = 5;          // game minutes per real second
export const DAWN_START = 5;
export const DAY_START = 7;
export const DUSK_START = 18;
export const NIGHT_START = 20;
export const MAX_SKELETONS = 5;

// ── Skeleton Enemy ──
export const SKELETON = {
  hp: 60,
  speed: 0.7,
  damage: 15,
  attackRange: 1.2 * TILE,
  chaseRange: 5 * TILE,
  attackCooldown: 60,
  loot: [
    { item: 'rock', count: 2, chance: 0.5 },
    { item: 'wood', count: 1, chance: 0.3 },
  ],
};

export const SKELETON_SPAWNS = [
  { x: 15, y: 15 }, { x: 75, y: 15 }, { x: 15, y: 40 },
  { x: 75, y: 40 }, { x: 50, y: 40 }, { x: 70, y: 20 },
  { x: 20, y: 38 }, { x: 60, y: 38 },
];

// ── World Objects ──
export const WORLD_TREES = [
  { x: 22, y: 25 }, { x: 30, y: 33 }, { x: 60, y: 30 }, { x: 25, y: 35 },
  { x: 65, y: 25 }, { x: 35, y: 22 }, { x: 50, y: 35 }, { x: 70, y: 28 },
  { x: 28, y: 18 }, { x: 55, y: 32 }, { x: 18, y: 30 }, { x: 45, y: 33 },
];

export const WORLD_ROCKS = [
  { x: 65, y: 28 }, { x: 18, y: 35 }, { x: 40, y: 32 },
  { x: 58, y: 18 }, { x: 75, y: 30 }, { x: 32, y: 38 },
  { x: 48, y: 36 }, { x: 26, y: 22 },
];

export const FISHING_SPOTS = [
  { x: 10, y: 25 }, { x: 78, y: 30 }, { x: 45, y: 8 },
  { x: 12, y: 38 }, { x: 80, y: 22 },
];

// Farm plots 4x3 grid near Pierre
export const FARM_ORIGIN = { x: 25, y: 32 };
export const FARM_COLS = 4;
export const FARM_ROWS = 3;

// ── NPCs ──
export const NPCS = [
  {
    id: 'fermier', name: 'Pierre le Fermier', hair: 'shorthair',
    x: 25 * TILE, y: 28 * TILE,
    patrolPath: [
      { x: 25 * TILE, y: 28 * TILE }, { x: 28 * TILE, y: 28 * TILE },
      { x: 28 * TILE, y: 31 * TILE }, { x: 25 * TILE, y: 31 * TILE },
    ],
    dialogue: [
      "Bienvenue ! PELLE pour labourer, GRAINES pour planter, ARROSOIR pour arroser.",
      "Les recoltes poussent avec le temps. Reviens plus tard !",
      "Vends tes recoltes chez Sophie la Marchande.",
    ],
    expression: 'expression_chat',
  },
  {
    id: 'forgeronne', name: 'Marie la Forgeron', hair: 'longhair',
    x: 55 * TILE, y: 22 * TILE,
    patrolPath: [{ x: 55 * TILE, y: 22 * TILE }, { x: 58 * TILE, y: 22 * TILE }],
    dialogue: [
      "Salut ! Mon enclume est prete.", "Les squelettes rodent la nuit... garde ton epee !",
    ],
    expression: 'expression_working',
  },
  {
    id: 'pecheur', name: 'Luc le Pecheur', hair: 'bowlhair',
    x: 72 * TILE, y: 35 * TILE,
    patrolPath: [{ x: 72 * TILE, y: 35 * TILE }, { x: 72 * TILE, y: 38 * TILE }],
    dialogue: [
      "Achete une CANNE chez Sophie, puis va au bord de l'eau !",
      "Appuie ESPACE pres de l'eau avec ta canne equipee.",
    ],
    expression: 'expression_love',
  },
  {
    id: 'marchande', name: 'Sophie la Marchande', hair: 'curlyhair',
    isShop: true,
    x: 42 * TILE, y: 24 * TILE,
    patrolPath: [
      { x: 42 * TILE, y: 24 * TILE }, { x: 45 * TILE, y: 24 * TILE },
      { x: 45 * TILE, y: 26 * TILE }, { x: 42 * TILE, y: 26 * TILE },
    ],
    dialogue: ["Bienvenue dans ma boutique !"],
    expression: 'expression_chat',
  },
  {
    id: 'garde', name: 'Hugo le Garde', hair: 'spikeyhair',
    x: 48 * TILE, y: 15 * TILE,
    patrolPath: [
      { x: 48 * TILE, y: 15 * TILE }, { x: 48 * TILE, y: 18 * TILE },
      { x: 52 * TILE, y: 18 * TILE }, { x: 52 * TILE, y: 15 * TILE },
    ],
    dialogue: [
      "Les squelettes rodent la nuit, attention !",
      "Selectionne ton epee (1-6) et attaque avec ESPACE.",
    ],
    expression: 'expression_alerted',
  },
  {
    id: 'herboriste', name: "Elise l'Herboriste", hair: 'mophair',
    x: 20 * TILE, y: 20 * TILE,
    patrolPath: [
      { x: 20 * TILE, y: 20 * TILE }, { x: 23 * TILE, y: 20 * TILE },
      { x: 23 * TILE, y: 22 * TILE }, { x: 20 * TILE, y: 22 * TILE },
    ],
    dialogue: [
      "Dors dans une maison (ESPACE sur un lit) pour regenerer ta vie !",
      "Les champignons de la foret sont magiques !",
    ],
    expression: 'expression_love',
  },
];
