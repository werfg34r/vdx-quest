// Sunnyside World - Original GameMaker room dimensions
export const TILE = 16;
export const SCALE = 2;
export const RS = TILE * SCALE;   // 32px rendered tile size

// Room dimensions from GameMaker Room1
export const ROOM_W = 1366;
export const ROOM_H = 768;
export const MAP_W = 86;
export const MAP_H = 48;

// Player
export const PLAYER_SPEED = 1.5;

// Game modes
export const MODE = {
  WORLD: 0,
  INTERIOR: 1,
};

// Houses - positioned at building clusters on the map
export const HOUSES = [
  {
    id: 'maison_savoir',
    name: 'Maison du Savoir',
    style: 'red',
    tileX: 50, tileY: 11, tileW: 7, tileH: 5,
    doorX: 53, doorY: 16,
    spawnX: 53 * 16, spawnY: 16.5 * 16,
  },
  {
    id: 'maison_courage',
    name: 'Maison du Courage',
    style: 'green',
    tileX: 38, tileY: 14, tileW: 5, tileH: 6,
    doorX: 40, doorY: 20,
    spawnX: 40 * 16, spawnY: 20.5 * 16,
  },
  {
    id: 'maison_esprit',
    name: "Maison de l'Esprit",
    style: 'blue',
    tileX: 32, tileY: 19, tileW: 5, tileH: 5,
    doorX: 34, doorY: 24,
    spawnX: 34 * 16, spawnY: 24.5 * 16,
  },
];

// Interior dimensions (in tiles)
export const INT_W = 10;
export const INT_H = 8;

// NPC definitions - each with a hairstyle, patrol path, and dialogue
export const NPCS = [
  {
    id: 'fermier',
    name: 'Pierre le Fermier',
    hair: 'shorthair',
    x: 25 * TILE, y: 28 * TILE,
    patrolPath: [
      { x: 25 * TILE, y: 28 * TILE },
      { x: 28 * TILE, y: 28 * TILE },
      { x: 28 * TILE, y: 31 * TILE },
      { x: 25 * TILE, y: 31 * TILE },
    ],
    dialogue: [
      "Bienvenue au village ! Je suis Pierre, le fermier.",
      "Les r\u00e9coltes sont bonnes cette saison.",
      "Tu devrais aller voir Marie \u00e0 la forge.",
    ],
    expression: 'expression_chat',
  },
  {
    id: 'forgeronne',
    name: 'Marie la Forgeron',
    hair: 'longhair',
    x: 55 * TILE, y: 22 * TILE,
    patrolPath: [
      { x: 55 * TILE, y: 22 * TILE },
      { x: 58 * TILE, y: 22 * TILE },
    ],
    dialogue: [
      "Salut ! Besoin d'outils ?",
      "Je peux forger une hache ou une pioche.",
      "Apporte-moi du minerai et je te ferai quelque chose !",
    ],
    expression: 'expression_working',
  },
  {
    id: 'pecheur',
    name: 'Luc le P\u00eacheur',
    hair: 'bowlhair',
    x: 72 * TILE, y: 35 * TILE,
    patrolPath: [
      { x: 72 * TILE, y: 35 * TILE },
      { x: 72 * TILE, y: 38 * TILE },
    ],
    dialogue: [
      "Le lac est poissonneux aujourd'hui !",
      "Un bon p\u00eacheur a toujours de la patience.",
      "J'ai attrap\u00e9 un poisson \u00e9norme hier !",
    ],
    expression: 'expression_love',
  },
  {
    id: 'marchande',
    name: 'Sophie la Marchande',
    hair: 'curlyhair',
    x: 42 * TILE, y: 24 * TILE,
    patrolPath: [
      { x: 42 * TILE, y: 24 * TILE },
      { x: 45 * TILE, y: 24 * TILE },
      { x: 45 * TILE, y: 26 * TILE },
      { x: 42 * TILE, y: 26 * TILE },
    ],
    dialogue: [
      "Bonjour ! Regarde mes marchandises !",
      "J'ai des graines, du lait, des oeufs...",
      "Reviens quand tu auras des sous !",
    ],
    expression: 'expression_chat',
  },
  {
    id: 'garde',
    name: 'Hugo le Garde',
    hair: 'spikeyhair',
    x: 48 * TILE, y: 15 * TILE,
    patrolPath: [
      { x: 48 * TILE, y: 15 * TILE },
      { x: 48 * TILE, y: 18 * TILE },
      { x: 52 * TILE, y: 18 * TILE },
      { x: 52 * TILE, y: 15 * TILE },
    ],
    dialogue: [
      "Halte ! ... Ah, c'est toi. Bienvenue.",
      "Les squelettes r\u00f4dent la nuit, fais attention.",
      "La Maison du Savoir est juste l\u00e0-bas.",
    ],
    expression: 'expression_alerted',
  },
  {
    id: 'herboriste',
    name: 'Elise l\'Herboriste',
    hair: 'mophair',
    x: 20 * TILE, y: 20 * TILE,
    patrolPath: [
      { x: 20 * TILE, y: 20 * TILE },
      { x: 23 * TILE, y: 20 * TILE },
      { x: 23 * TILE, y: 22 * TILE },
      { x: 20 * TILE, y: 22 * TILE },
    ],
    dialogue: [
      "Les champignons de la for\u00eat sont magiques !",
      "Je pr\u00e9pare des potions pour tout le village.",
      "Apporte-moi des herbes rares, je te r\u00e9compenserai.",
    ],
    expression: 'expression_love',
  },
];

// Items the player can collect
export const ITEM_TYPES = {
  wood:   { name: 'Bois',      icon: 'wood',     stackable: true },
  rock:   { name: 'Pierre',    icon: 'rock',     stackable: true },
  fish:   { name: 'Poisson',   icon: 'fish',     stackable: true },
  egg:    { name: 'Oeuf',      icon: 'egg',      stackable: true },
  milk:   { name: 'Lait',      icon: 'milk',     stackable: true },
  seed:   { name: 'Graines',   icon: 'seeds_generic', stackable: true },
  axe:    { name: 'Hache',     icon: 'axe',      stackable: false },
  hammer: { name: 'Marteau',   icon: 'hammer',   stackable: false },
  sword:  { name: 'Ep\u00e9e', icon: 'sword',    stackable: false },
};

// Interactable world objects
export const WORLD_OBJECTS = [
  // Trees that can be chopped
  { id: 'tree1', type: 'tree', x: 30, y: 28, hp: 3, drop: 'wood', dropCount: 2 },
  { id: 'tree2', type: 'tree', x: 22, y: 25, hp: 3, drop: 'wood', dropCount: 2 },
  { id: 'tree3', type: 'tree', x: 60, y: 30, hp: 3, drop: 'wood', dropCount: 2 },
  // Rocks that can be mined
  { id: 'rock1', type: 'rock', x: 65, y: 28, hp: 2, drop: 'rock', dropCount: 3 },
  { id: 'rock2', type: 'rock', x: 18, y: 35, hp: 2, drop: 'rock', dropCount: 3 },
];
