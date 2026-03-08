// ═══════════════════════════════════════════════════════
// VDX QUEST - Inventory (simplified for Village 1)
// ═══════════════════════════════════════════════════════

export function createInventory() {
  return {
    tools: ['axe', 'pickaxe'],
    selectedTool: 0,
    items: [],  // { type: string, count: number }
  };
}

export function getSelectedTool(inv) {
  return inv.tools[inv.selectedTool] || null;
}

export function addItem(inv, itemType, count = 1) {
  const existing = inv.items.find(s => s.type === itemType);
  if (existing) { existing.count += count; return true; }
  inv.items.push({ type: itemType, count });
  return true;
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
