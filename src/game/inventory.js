// ═══════════════════════════════════════════════════════
// INVENTORY - Items, Tools, Gold
// ═══════════════════════════════════════════════════════
import { ITEM_TYPES, TOOLS, STARTER_TOOLS } from './constants.js';

export function createInventory() {
  const inv = {
    tools: [...STARTER_TOOLS],  // tool IDs the player owns
    selectedTool: 0,            // index into tools array
    items: [],                  // { type: string, count: number }
    maxItems: 16,
    open: false,
  };
  return inv;
}

// ── Tools ──
export function getSelectedTool(inv) {
  return inv.tools[inv.selectedTool] || null;
}

export function hasTool(inv, toolId) {
  return inv.tools.includes(toolId);
}

export function addTool(inv, toolId) {
  if (inv.tools.includes(toolId)) return false;
  inv.tools.push(toolId);
  return true;
}

// ── Items ──
export function addItem(inv, itemType, count = 1) {
  const def = ITEM_TYPES[itemType];
  if (!def) return false;

  if (def.stackable) {
    const existing = inv.items.find(s => s.type === itemType);
    if (existing) { existing.count += count; return true; }
  }

  if (inv.items.length < inv.maxItems) {
    inv.items.push({ type: itemType, count });
    return true;
  }
  return false;
}

export function hasItem(inv, itemType) {
  return inv.items.some(s => s.type === itemType);
}

export function removeItem(inv, itemType, count = 1) {
  const idx = inv.items.findIndex(s => s.type === itemType);
  if (idx === -1) return false;
  inv.items[idx].count -= count;
  if (inv.items[idx].count <= 0) inv.items.splice(idx, 1);
  return true;
}

export function getItemCount(inv, itemType) {
  const slot = inv.items.find(s => s.type === itemType);
  return slot ? slot.count : 0;
}

// ── Sell all of an item type ──
export function sellItem(inv, player, itemType) {
  const def = ITEM_TYPES[itemType];
  if (!def || !def.sellPrice) return 0;
  const slot = inv.items.find(s => s.type === itemType);
  if (!slot) return 0;
  const earned = slot.count * def.sellPrice;
  player.gold += earned;
  inv.items = inv.items.filter(s => s.type !== itemType);
  return earned;
}

// Get seed type → crop type mapping
export function seedToCrop(seedType) {
  const map = {
    seed_wheat: 'wheat',
    seed_beetroot: 'beetroot',
    seed_carrot: 'carrot',
    seed_pumpkin: 'pumpkin',
  };
  return map[seedType] || null;
}

// Find first seed in inventory
export function getFirstSeed(inv) {
  return inv.items.find(s => s.type.startsWith('seed_'));
}
