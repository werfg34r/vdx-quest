// ═══════════════════════════════════════════════════════
// VDX QUEST - Asset Loader
// ═══════════════════════════════════════════════════════
import spriteMeta from '../data/sprite_meta.json';

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

  // Laurent NPC sprites
  needed.add('shorthair_idle_strip9');
  needed.add('shorthair_walk_strip8');
  needed.add('expression_chat');

  // Items & tools
  const items = ['wood', 'rock', 'axe', 'pickaxe', 'hammer'];
  for (const s of items) needed.add(s);

  // All decoration sprites in the room data
  const roomSprites = Object.keys(spriteMeta).filter(k =>
    k.startsWith('spr_deco_') || k.startsWith('chimneysmoke_')
  );
  for (const s of roomSprites) needed.add(s);

  // VFX
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
