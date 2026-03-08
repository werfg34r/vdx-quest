// Dialogue system
export function createDialogueState() {
  return {
    active: false,
    npc: null,
    lineIdx: 0,
    text: '',
    charIdx: 0,     // For typewriter effect
    timer: 0,
    fullText: '',
  };
}

export function startDialogue(state, npc) {
  state.active = true;
  state.npc = npc;
  state.lineIdx = npc.dialogueIdx || 0;
  state.fullText = npc.dialogue[state.lineIdx];
  state.text = '';
  state.charIdx = 0;
  state.timer = 0;
}

export function advanceDialogue(state) {
  if (!state.active) return;

  // If typewriter not done, show full text
  if (state.charIdx < state.fullText.length) {
    state.text = state.fullText;
    state.charIdx = state.fullText.length;
    return;
  }

  // Next line
  state.lineIdx++;
  if (state.lineIdx >= state.npc.dialogue.length) {
    // End dialogue, advance NPC's starting line for next time
    state.npc.dialogueIdx = (state.npc.dialogueIdx + 1) % state.npc.dialogue.length;
    state.active = false;
    state.npc = null;
    return;
  }

  state.fullText = state.npc.dialogue[state.lineIdx];
  state.text = '';
  state.charIdx = 0;
  state.timer = 0;
}

export function updateDialogue(state) {
  if (!state.active) return;

  // Typewriter effect - 2 chars per frame
  state.timer++;
  if (state.charIdx < state.fullText.length && state.timer % 2 === 0) {
    state.charIdx++;
    state.text = state.fullText.substring(0, state.charIdx);
  }
}
