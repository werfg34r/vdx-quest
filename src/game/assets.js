// Asset loader - loads all images upfront

const ASSETS = {
  village:  '/assets/village_tileset.png',   // 304x720 - Serene Village 16x16
  indoor:   '/assets/indoor_tileset.png',    // 960x496 - Indoor tileset
  outdoors: '/assets/outdoors_tileset.png',  // 960x800 - Outdoors tileset
  player:   '/assets/player.png',            // 424x350 - Ash spritesheet
  houseG:   '/assets/house_green.png',       // Green house pre-rendered
  houseR:   '/assets/house_red.png',         // Red house pre-rendered
  tree1:    '/assets/tree1.png',             // Single tree
  water:    '/assets/water_anim.png',        // Water animation strip
  npc1:     '/assets/npc1.png',              // NPC spritesheet
  npc2:     '/assets/npc2.png',              // NPC spritesheet
};

const images = {};
let loaded = false;

export function loadAssets() {
  if (loaded) return Promise.resolve(images);

  const promises = Object.entries(ASSETS).map(([key, src]) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn(`Failed to load: ${src}`); resolve(); };
      img.src = src;
    });
  });

  return Promise.all(promises).then(() => {
    loaded = true;
    return images;
  });
}

export function getImg(key) {
  return images[key] || null;
}
