// ═══════════════════════════════════════════════════════
// ASSET LOADER
// ═══════════════════════════════════════════════════════
import spriteMeta from '../data/sprite_meta.json';
import { NPCS } from './constants.js';

const images = {};
let loaded = false;

const CORE_ASSETS = {
  tileset: '/assets/spr_tileset_sunnysideworld_16px.png',
  forest:  '/assets/spr_tileset_sunnysideworld_forest_32px.png',
};

function getRequiredSprites() {
  const needed = new Set();

  // Player sprites
  const playerSprites = [
    'spr_idle', 'spr_walking', 'spr_run', 'spr_axe', 'spr_attack',
    'spr_casting', 'spr_carry', 'spr_dig', 'spr_doing', 'spr_mining',
    'spr_watering', 'spr_hurt', 'spr_death',
  ];
  for (const s of playerSprites) needed.add(s);

  // NPC sprites
  for (const npc of NPCS) {
    needed.add(`${npc.hair}_idle_strip9`);
    needed.add(`${npc.hair}_walk_strip8`);
    if (npc.expression) needed.add(npc.expression);
  }

  // Skeleton enemy
  const skelSprites = [
    'skeleton_idle_strip6', 'skeleton_walk_strip8', 'skeleton_attack_strip7',
    'skeleton_hurt_strip7', 'skeleton_death_strip10',
  ];
  for (const s of skelSprites) needed.add(s);

  // Items & tools
  const items = [
    'wood', 'rock', 'fish', 'egg', 'milk', 'seeds_generic',
    'axe', 'hammer', 'sword', 'pickaxe', 'shovel', 'rod', 'water', 'plant',
  ];
  for (const s of items) needed.add(s);

  // Crops (all stages)
  const crops = ['wheat', 'beetroot', 'carrot', 'pumpkin', 'cabbage', 'sunflower', 'potato'];
  for (const crop of crops) {
    for (let i = 0; i <= 5; i++) needed.add(`${crop}_0${i}`);
  }

  // Soil
  needed.add('soil_00'); needed.add('soil_01'); needed.add('soil_03'); needed.add('soil_04');

  // Health/stamina bars
  for (let i = 0; i <= 6; i++) needed.add(`greenbar_0${i}`);
  for (let i = 0; i <= 5; i++) needed.add(`bluebar_0${i}`);

  // UI
  needed.add('happiness_01'); needed.add('happiness_03');

  // Expression icons
  const exprs = [
    'expression_alerted', 'expression_attack', 'expression_chat',
    'expression_love', 'expression_stress', 'expression_working',
    'expression_confused',
  ];
  for (const e of exprs) needed.add(e);

  // Decoration sprites placed in room
  const roomSprites = Object.keys(spriteMeta).filter(k =>
    k.startsWith('spr_deco_') || k.startsWith('chimneysmoke_')
  );
  for (const s of roomSprites) needed.add(s);

  // Dust VFX
  needed.add('dust_general_strip8');
  needed.add('leaves_hit');

  return [...needed].filter(name => name in spriteMeta);
}

export function loadAssets() {
  if (loaded) return Promise.resolve(images);

  const promises = [];

  for (const [key, src] of Object.entries(CORE_ASSETS)) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn(`Failed: ${src}`); resolve(); };
      img.src = src;
    }));
  }

  const required = getRequiredSprites();
  for (const name of required) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[name] = img; resolve(); };
      img.onerror = () => { resolve(); };
      img.src = `/assets/sprites/${name}.png`;
    }));
  }

  return Promise.all(promises).then(() => {
    loaded = true;
    console.log(`Loaded ${Object.keys(images).length} assets`);
    return images;
  });
}

export function getImg(key) {
  return images[key] || null;
}

export function getMeta(spriteName) {
  return spriteMeta[spriteName] || { w: 16, h: 16, ox: 0, oy: 0, frames: 1 };
}
