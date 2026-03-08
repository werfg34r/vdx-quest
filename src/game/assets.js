// Asset loader for Sunnyside World
import spriteMeta from '../data/sprite_meta.json';

const images = {};
let loaded = false;

// Core tilesets
const CORE_ASSETS = {
  tileset: '/assets/spr_tileset_sunnysideworld_16px.png',
  forest:  '/assets/spr_tileset_sunnysideworld_forest_32px.png',
};

// Get all unique sprite names from metadata
const spriteNames = Object.keys(spriteMeta);

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

  // Load all sprite PNGs
  for (const name of spriteNames) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[name] = img; resolve(); };
      img.onerror = () => { resolve(); }; // Silent fail
      img.src = `/assets/sprites/${name}.png`;
    }));
  }

  return Promise.all(promises).then(() => {
    loaded = true;
    console.log(`Loaded ${Object.keys(images).length} images`);
    return images;
  });
}

export function getImg(key) {
  return images[key] || null;
}

export function getMeta(spriteName) {
  return spriteMeta[spriteName] || { w: 16, h: 16, ox: 0, oy: 0, frames: 1 };
}
