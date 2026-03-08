// Inventory system
import { ITEM_TYPES } from './constants.js';

export function createInventory() {
  return {
    slots: [], // { type: string, count: number }
    maxSlots: 12,
    open: false,
    selectedSlot: 0,
  };
}

export function addItem(inventory, itemType, count = 1) {
  const def = ITEM_TYPES[itemType];
  if (!def) return false;

  // Try to stack
  if (def.stackable) {
    const existing = inventory.slots.find(s => s.type === itemType);
    if (existing) {
      existing.count += count;
      return true;
    }
  }

  // Add to new slot
  if (inventory.slots.length < inventory.maxSlots) {
    inventory.slots.push({ type: itemType, count });
    return true;
  }

  return false; // Full
}

export function hasItem(inventory, itemType) {
  return inventory.slots.some(s => s.type === itemType);
}

export function removeItem(inventory, itemType, count = 1) {
  const idx = inventory.slots.findIndex(s => s.type === itemType);
  if (idx === -1) return false;

  inventory.slots[idx].count -= count;
  if (inventory.slots[idx].count <= 0) {
    inventory.slots.splice(idx, 1);
  }
  return true;
}

export function getEquippedTool(inventory) {
  const slot = inventory.slots[inventory.selectedSlot];
  if (!slot) return null;
  const def = ITEM_TYPES[slot.type];
  if (def && !def.stackable) return slot.type;
  return null;
}
