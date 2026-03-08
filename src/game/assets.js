// ═══════════════════════════════════════════════════════
// VDX QUEST - Asset Loader
// ═══════════════════════════════════════════════════════
import spriteMeta from '../data/sprite_meta.json';

const images = {};
let loaded = false;

const CORE = {
  tileset: '/assets/spr_tileset_sunnysideworld_16px.png',
};

const SPRITES_NEEDED = [
  // Player
  'spr_idle', 'spr_walking', 'spr_run', 'spr_axe', 'spr_attack', 'spr_carry',
  // Laurent NPC
  'shorthair_idle_strip9', 'shorthair_walk_strip8',
  // Items
  'wood', 'rock', 'axe',
  // Trees & decorations
  'spr_deco_tree_01', 'spr_deco_tree_02',
  // Expressions
  'expression_chat',
  // VFX
  'dust_general_strip8', 'leaves_hit',
];

export function loadAssets() {
  if (loaded) return Promise.resolve(images);
  const promises = [];

  for (const [key, src] of Object.entries(CORE)) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn(`Failed: ${src}`); resolve(); };
      img.src = src;
    }));
  }

  for (const name of SPRITES_NEEDED) {
    if (!(name in spriteMeta)) continue;
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

export function getImg(key) { return images[key] || null; }

export function getMeta(spriteName) {
  return spriteMeta[spriteName] || { w: 16, h: 16, ox: 0, oy: 0, frames: 1 };
}
