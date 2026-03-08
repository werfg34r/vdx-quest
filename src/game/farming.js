// ═══════════════════════════════════════════════════════
// FARMING SYSTEM - Crop plots
// ═══════════════════════════════════════════════════════
import { TILE, FARM_ORIGIN, FARM_COLS, FARM_ROWS, CROP_TYPES } from './constants.js';

// Plot states: empty → tilled → planted → watered → growing(0-5) → harvestable
// watered flag speeds up growth

export function createFarmPlots() {
  const plots = [];
  for (let r = 0; r < FARM_ROWS; r++) {
    for (let c = 0; c < FARM_COLS; c++) {
      plots.push({
        tileX: FARM_ORIGIN.x + c,
        tileY: FARM_ORIGIN.y + r,
        x: (FARM_ORIGIN.x + c) * TILE,
        y: (FARM_ORIGIN.y + r) * TILE,
        state: 'empty',    // empty, tilled, planted, harvestable
        cropType: null,     // wheat, beetroot, carrot, pumpkin
        stage: 0,           // 0-5 growth stages
        watered: false,
        growthProgress: 0,  // in game minutes
      });
    }
  }
  return plots;
}

// Use shovel on empty plot → tilled
export function tillPlot(plot) {
  if (plot.state !== 'empty') return false;
  plot.state = 'tilled';
  return true;
}

// Use seeds on tilled plot → planted
export function plantCrop(plot, cropType) {
  if (plot.state !== 'tilled') return false;
  if (!CROP_TYPES[cropType]) return false;
  plot.state = 'planted';
  plot.cropType = cropType;
  plot.stage = 0;
  plot.growthProgress = 0;
  plot.watered = false;
  return true;
}

// Use watering can on planted plot
export function waterPlot(plot) {
  if (plot.state !== 'planted') return false;
  plot.watered = true;
  return true;
}

// Grow crops based on elapsed game minutes
export function growCrops(plots, minutesPassed) {
  for (const plot of plots) {
    if (plot.state !== 'planted' || plot.stage >= 5) continue;

    const def = CROP_TYPES[plot.cropType];
    if (!def) continue;

    // Watered crops grow 2x faster
    const growthRate = plot.watered ? 2 : 1;
    plot.growthProgress += minutesPassed * growthRate;

    const minutesPerStage = def.growMinutes / 5;
    const newStage = Math.min(5, Math.floor(plot.growthProgress / minutesPerStage));

    if (newStage > plot.stage) {
      plot.stage = newStage;
      // Reset watered each stage (needs re-watering)
      if (plot.stage < 5) plot.watered = false;
    }

    if (plot.stage >= 5) {
      plot.state = 'harvestable';
    }
  }
}

// Harvest crop → returns item type & count
export function harvestCrop(plot) {
  if (plot.state !== 'harvestable') return null;
  const def = CROP_TYPES[plot.cropType];
  if (!def) return null;

  const result = { item: def.harvest, count: def.count };
  // Reset plot
  plot.state = 'empty';
  plot.cropType = null;
  plot.stage = 0;
  plot.growthProgress = 0;
  plot.watered = false;
  return result;
}

// Get the plot at a tile position
export function getPlotAt(plots, tileX, tileY) {
  return plots.find(p => p.tileX === tileX && p.tileY === tileY) || null;
}

// Get the plot nearest to a pixel position (within 1.5 tiles)
export function getNearbyPlot(plots, px, py) {
  const ptx = px / TILE;
  const pty = py / TILE;
  let best = null;
  let bestDist = 2;
  for (const p of plots) {
    const dist = Math.hypot(ptx - (p.tileX + 0.5), pty - (p.tileY + 0.5));
    if (dist < bestDist) {
      best = p;
      bestDist = dist;
    }
  }
  return best;
}
