// Room data from GameMaker Room1.yy
import tileLayersData from '../data/tile_layers.json';
// All tile layers with decoded data
// renderOrder: back-to-front layer names
// layers: { name: { width, height, depth, tiles: flat array, nonEmpty } }
export const tileLayerNames = tileLayersData.renderOrder;
export const tileLayers = tileLayersData.layers;

// Get tile at grid position for a specific layer
export function getTile(layerName, col, row) {
  const layer = tileLayers[layerName];
  if (!layer) return 0;
  if (col < 0 || col >= layer.width || row < 0 || row >= layer.height) return 0;
  return layer.tiles[row * layer.width + col] || 0;
}
