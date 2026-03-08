// ═══════════════════════════════════════════════════════
// DIALOGUE & SHOP SYSTEM
// ═══════════════════════════════════════════════════════

export function createDialogueState() {
  return {
    active: false,
    npc: null,
    lineIdx: 0,
    text: '',
    charIdx: 0,
    fullText: '',
    // Shop mode
    shopOpen: false,
    shopTab: 'buy',        // 'buy' or 'sell'
    shopCursor: 0,
  };
}

export function startDialogue(state, npc) {
  state.active = true;
  state.npc = npc;
  state.lineIdx = npc.dialogueIdx || 0;
  state.fullText = npc.dialogue[state.lineIdx % npc.dialogue.length];
  state.text = '';
  state.charIdx = 0;
  state.shopOpen = false;
}

export function advanceDialogue(state) {
  if (!state.active) return 'none';

  // If typewriter not done, show full text
  if (state.charIdx < state.fullText.length) {
    state.text = state.fullText;
    state.charIdx = state.fullText.length;
    return 'skip';
  }

  // Next line
  state.lineIdx++;
  if (state.lineIdx >= state.npc.dialogue.length) {
    state.npc.dialogueIdx = ((state.npc.dialogueIdx || 0) + 1) % state.npc.dialogue.length;

    // If shop NPC, open shop after dialogue
    if (state.npc.isShop) {
      state.active = false;
      state.shopOpen = true;
      state.shopTab = 'buy';
      state.shopCursor = 0;
      return 'shop';
    }

    state.active = false;
    state.npc = null;
    return 'end';
  }

  state.fullText = state.npc.dialogue[state.lineIdx % state.npc.dialogue.length];
  state.text = '';
  state.charIdx = 0;
  return 'next';
}

export function updateDialogue(state) {
  if (!state.active) return;
  if (state.charIdx < state.fullText.length) {
    state.charIdx += 2;
    if (state.charIdx > state.fullText.length) state.charIdx = state.fullText.length;
    state.text = state.fullText.substring(0, state.charIdx);
  }
}

export function closeShop(state) {
  state.shopOpen = false;
  state.npc = null;
}
