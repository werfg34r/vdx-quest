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
// Door positions are at the bottom-center of each building
export const HOUSES = [
  {
    id: 'maison_savoir',
    name: 'Maison du Savoir',
    style: 'red',
    // Building cluster #8: tiles(50,11)-(56,15) px=(800,176)
    tileX: 50, tileY: 11, tileW: 7, tileH: 5,
    doorX: 53, doorY: 16,   // tile coords, bottom-center
    spawnX: 53 * 16, spawnY: 16.5 * 16,  // pixel coords outside door
  },
  {
    id: 'maison_courage',
    name: 'Maison du Courage',
    style: 'green',
    // Building cluster #12: tiles(38,14)-(42,19) px=(608,224)
    tileX: 38, tileY: 14, tileW: 5, tileH: 6,
    doorX: 40, doorY: 20,
    spawnX: 40 * 16, spawnY: 20.5 * 16,
  },
  {
    id: 'maison_esprit',
    name: "Maison de l'Esprit",
    style: 'blue',
    // Building cluster #10: tiles(32,19)-(36,23) px=(512,304)
    tileX: 32, tileY: 19, tileW: 5, tileH: 5,
    doorX: 34, doorY: 24,
    spawnX: 34 * 16, spawnY: 24.5 * 16,
  },
];

// Interior dimensions (in tiles)
export const INT_W = 10;
export const INT_H = 8;
