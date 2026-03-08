// ═══════════════════════════════════════════════════════
// VDX QUEST - Story & Quest System
// ═══════════════════════════════════════════════════════

// Quest definitions for Village 1
export const QUEST_DEFS = [
  {
    id: 'welcome',
    title: 'Bienvenue dans VDX',
    dialogueStart: [
      "Salut ! Je suis Laurent, bienvenue dans VDX !",
      "Aujourd'hui, on va apprendre a construire ton VD business.",
      "Pour commencer, il te faut une maison.",
      "Tu vois la foret au nord ? Va couper du bois avec ta hache !",
      "Approche-toi d'un arbre et appuie sur ESPACE.",
    ],
    objective: { type: 'collect', item: 'wood', count: 5 },
    objectiveText: 'Couper du bois dans la foret (0/5)',
  },
  {
    id: 'build_foundation',
    title: 'Les fondations',
    dialogueStart: [
      "Bien joue ! Tu as assez de bois pour les fondations !",
      "Va au terrain de construction a l'est (le carre marque).",
      "Appuie sur ESPACE devant le terrain pour construire.",
    ],
    objective: { type: 'build', stage: 1 },
    objectiveText: 'Construire les fondations (5 bois)',
  },
  {
    id: 'gather_walls',
    title: 'Les murs',
    dialogueStart: [
      "Excellent ! Les fondations sont posees !",
      "Maintenant il faut beaucoup plus de bois pour les murs.",
      "Retourne dans la foret et coupe 10 arbres de plus !",
    ],
    objective: { type: 'collect', item: 'wood', count: 10 },
    objectiveText: 'Couper encore du bois (0/10)',
  },
  {
    id: 'build_walls',
    title: 'Monter les murs',
    dialogueStart: [
      "Parfait ! Tu as tout le bois qu'il faut.",
      "Retourne au chantier et construis les murs !",
    ],
    objective: { type: 'build', stage: 2 },
    objectiveText: 'Construire les murs (10 bois)',
  },
  {
    id: 'gather_roof',
    title: 'Le toit',
    dialogueStart: [
      "Les murs sont montes ! La maison prend forme.",
      "Pour le toit, il faut du bois ET de la pierre.",
      "Tu trouveras des rochers sur la carte. Selectionne ta pioche (touche 2) !",
      "Ramasse 5 bois et 3 pierres.",
    ],
    objective: { type: 'collect_multi', items: { wood: 5, rock: 3 } },
    objectiveText: 'Bois (0/5) + Pierre (0/3)',
  },
  {
    id: 'build_roof',
    title: 'Finir la maison',
    dialogueStart: [
      "Tu as tout ce qu'il faut ! Va finir ta maison !",
    ],
    objective: { type: 'build', stage: 3 },
    objectiveText: 'Construire le toit (5 bois + 3 pierre)',
  },
  {
    id: 'complete',
    title: 'Maison terminee !',
    dialogueStart: [
      "FELICITATIONS ! Ta maison est construite !",
      "C'est le debut de ton VD business !",
      "Dans la prochaine etape, on va apprendre a cultiver...",
      "Mais ca, c'est pour le Village 2 ! A bientot !",
    ],
    objective: { type: 'none' },
    objectiveText: 'Village 1 termine ! Bravo !',
  },
];

export function createQuestState() {
  return {
    currentQuest: 0,     // index into QUEST_DEFS
    needsTalk: true,     // must talk to Laurent to get next quest
    objectiveMet: false,
    dialogueLines: [],
    dialogueIdx: 0,
    showingDialogue: false,
    charIdx: 0,
    displayText: '',
  };
}

export function getCurrentQuest(state) {
  return QUEST_DEFS[state.currentQuest] || null;
}

export function startQuestDialogue(state) {
  const quest = getCurrentQuest(state);
  if (!quest) return;
  state.showingDialogue = true;
  state.dialogueLines = quest.dialogueStart;
  state.dialogueIdx = 0;
  state.charIdx = 0;
  state.displayText = '';
}

export function advanceQuestDialogue(state) {
  if (!state.showingDialogue) return false;

  // If typewriter not done, skip to full text
  const fullLine = state.dialogueLines[state.dialogueIdx] || '';
  if (state.charIdx < fullLine.length) {
    state.displayText = fullLine;
    state.charIdx = fullLine.length;
    return true;
  }

  // Next line
  state.dialogueIdx++;
  if (state.dialogueIdx >= state.dialogueLines.length) {
    state.showingDialogue = false;
    state.needsTalk = false;
    return false; // dialogue ended
  }

  state.charIdx = 0;
  state.displayText = '';
  return true;
}

export function updateQuestDialogue(state) {
  if (!state.showingDialogue) return;
  const fullLine = state.dialogueLines[state.dialogueIdx] || '';
  if (state.charIdx < fullLine.length) {
    state.charIdx += 2;
    if (state.charIdx > fullLine.length) state.charIdx = fullLine.length;
    state.displayText = fullLine.substring(0, state.charIdx);
  }
}

// Check if objective is met based on inventory / build state
export function checkObjective(state, inventory, houseStage) {
  const quest = getCurrentQuest(state);
  if (!quest || state.needsTalk) return false;

  const obj = quest.objective;
  if (obj.type === 'collect') {
    const slot = inventory.items.find(s => s.type === obj.item);
    return slot && slot.count >= obj.count;
  }
  if (obj.type === 'collect_multi') {
    for (const [item, count] of Object.entries(obj.items)) {
      const slot = inventory.items.find(s => s.type === item);
      if (!slot || slot.count < count) return false;
    }
    return true;
  }
  if (obj.type === 'build') {
    return houseStage >= obj.stage + 1; // stage was advanced
  }
  if (obj.type === 'none') {
    return false; // final quest, no more objectives
  }
  return false;
}

// Advance to next quest
export function advanceQuest(state) {
  if (state.currentQuest < QUEST_DEFS.length - 1) {
    state.currentQuest++;
    state.needsTalk = true;
    state.objectiveMet = false;
    return true;
  }
  return false;
}

// Get objective progress text
export function getObjectiveProgress(state, inventory, houseStage) {
  const quest = getCurrentQuest(state);
  if (!quest) return '';
  if (state.needsTalk) return 'Parle a Laurent';

  const obj = quest.objective;
  if (obj.type === 'collect') {
    const slot = inventory.items.find(s => s.type === obj.item);
    const current = slot ? slot.count : 0;
    return quest.objectiveText.replace('0/', `${current}/`);
  }
  if (obj.type === 'collect_multi') {
    let text = '';
    for (const [item, count] of Object.entries(obj.items)) {
      const slot = inventory.items.find(s => s.type === item);
      const current = slot ? slot.count : 0;
      const name = item === 'wood' ? 'Bois' : 'Pierre';
      text += `${name} ${current}/${count}  `;
    }
    return text.trim();
  }
  if (obj.type === 'build') {
    return quest.objectiveText;
  }
  return quest.objectiveText;
}
