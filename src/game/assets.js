// Asset loader for Sunnyside World
import spriteMeta from '../data/sprite_meta.json';
import { NPCS } from './constants.js';

const images = {};
let loaded = false;

// Core tilesets
const CORE_ASSETS = {
  tileset: '/assets/spr_tileset_sunnysideworld_16px.png',
  forest:  '/assets/spr_tileset_sunnysideworld_forest_32px.png',
};

// Sprites needed at startup (not ALL 482!)
function getRequiredSprites() {
  const needed = new Set();

  // Player sprites
  needed.add('spr_idle');
  needed.add('spr_walking');
  needed.add('spr_run');
  needed.add('spr_axe');
  needed.add('spr_attack');
  needed.add('spr_casting');
  needed.add('spr_carry');
  needed.add('spr_dig');
  needed.add('spr_doing');

  // NPC sprites (idle + walking for each hairstyle)
  for (const npc of NPCS) {
    needed.add(`${npc.hair}_idle_strip9`);
    needed.add(`${npc.hair}_walk_strip8`);
    if (npc.expression) needed.add(npc.expression);
  }

  // Items
  needed.add('wood');
  needed.add('rock');
  needed.add('fish');
  needed.add('egg');
  needed.add('milk');
  needed.add('seeds_generic');
  needed.add('axe');
  needed.add('hammer');
  needed.add('sword');

  // UI elements
  needed.add('happiness_01');
  needed.add('happiness_03');

  // Decorations that are placed in room_assets.json
  // These are loaded from sprite_meta keys that exist
  const roomSprites = Object.keys(spriteMeta).filter(k =>
    k.startsWith('spr_deco_') || k.startsWith('chimneysmoke_') ||
    k.startsWith('npc') || k.startsWith('expression_') ||
    k.startsWith('skeleton_') ||
    ['beetroot_00', 'cabbage_05', 'cauliflower_05', 'kale_05',
     'parsnip_03', 'pumpkin_05'].includes(k)
  );
  for (const s of roomSprites) needed.add(s);

  return [...needed].filter(name => name in spriteMeta);
}

export function loadAssets() {
  if (loaded) return Promise.resolve(images);

  const promises = [];

  // Load core tilesets
  for (const [key, src] of Object.entries(CORE_ASSETS)) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn(`Failed: ${src}`); resolve(); };
      img.src = src;
    }));
  }

  // Load required sprite PNGs
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
    console.log(`Loaded ${Object.keys(images).length} images (${required.length} sprites)`);
    return images;
  });
}

// Lazy load a sprite on demand
export function lazyLoad(name) {
  if (images[name] || !(name in spriteMeta)) return;
  const img = new Image();
  img.onload = () => { images[name] = img; };
  img.src = `/assets/sprites/${name}.png`;
}

export function getImg(key) {
  return images[key] || null;
}

export function getMeta(spriteName) {
  return spriteMeta[spriteName] || { w: 16, h: 16, ox: 0, oy: 0, frames: 1 };
}
