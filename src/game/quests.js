// ═══════════════════════════════════════════════════════
// VDX QUEST - Story & Quest System
// ═══════════════════════════════════════════════════════

// Quest definitions for Village 1 - Build your house
export const QUEST_DEFS = [
  {
    id: 'welcome',
    title: 'Bienvenue dans VDX',
    dialogueStart: [
      "Salut ! Je suis Laurent, bienvenue dans VDX !",
      "Ici, tu vas construire ta maison de zero.",
      "Pour commencer, il te faut du bois pour les piliers.",
      "Tu vois les arbres ? Selectionne ta hache (touche 1).",
      "Approche-toi d'un arbre et appuie sur ESPACE pour couper !",
      "Ramene-moi 7 bois pour poser les 7 piliers.",
    ],
    objective: { type: 'collect', item: 'wood', count: 7 },
    objectiveText: 'Couper du bois pour les piliers (0/7)',
  },
  {
    id: 'build_pillars',
    title: 'Les piliers',
    dialogueStart: [
      "Parfait ! Tu as assez de bois pour les piliers !",
      "Va au terrain de construction a l'est (le carre marque).",
      "Appuie sur ESPACE devant le terrain pour poser les piliers.",
    ],
    objective: { type: 'build', stage: 1 },
    objectiveText: 'Poser les 7 piliers (7 bois)',
  },
  {
    id: 'gather_floor',
    title: 'Le sol',
    dialogueStart: [
      "Les piliers sont plantes ! Beau travail.",
      "Maintenant il faut le sol. Tu vas avoir besoin de bois ET de pierre.",
      "Les rochers sont eparpilles sur la carte.",
      "Selectionne ta pioche (touche 2) pour les miner !",
      "Il me faut 5 bois et 3 pierres.",
    ],
    objective: { type: 'collect_multi', items: { wood: 5, rock: 3 } },
    objectiveText: 'Bois (0/5) + Pierre (0/3)',
  },
  {
    id: 'build_floor',
    title: 'Poser le sol',
    dialogueStart: [
      "Tu as tout pour le sol !",
      "Retourne au chantier et pose le plancher.",
    ],
    objective: { type: 'build', stage: 2 },
    objectiveText: 'Construire le sol (5 bois + 3 pierre)',
  },
  {
    id: 'gather_walls',
    title: 'Les murs',
    dialogueStart: [
      "Le sol est pose ! La maison prend forme.",
      "Pour les murs, il faut beaucoup de materiaux.",
      "Va chercher 10 bois et 5 pierres.",
      "Les arbres repoussent, t'inquiete pas !",
    ],
    objective: { type: 'collect_multi', items: { wood: 10, rock: 5 } },
    objectiveText: 'Bois (0/10) + Pierre (0/5)',
  },
  {
    id: 'build_walls',
    title: 'Monter les murs',
    dialogueStart: [
      "Tu as tout ce qu'il faut pour les murs !",
      "Va au chantier et monte les murs.",
    ],
    objective: { type: 'build', stage: 3 },
    objectiveText: 'Construire les murs (10 bois + 5 pierre)',
  },
  {
    id: 'gather_roof',
    title: 'Le toit',
    dialogueStart: [
      "Les murs sont montes ! On approche de la fin.",
      "Le toit, c'est la partie la plus importante.",
      "Il me faut 8 bois et 4 pierres.",
    ],
    objective: { type: 'collect_multi', items: { wood: 8, rock: 4 } },
    objectiveText: 'Bois (0/8) + Pierre (0/4)',
  },
  {
    id: 'build_roof',
    title: 'Poser le toit',
    dialogueStart: [
      "Excellent ! On va poser le toit !",
      "Va au chantier, la maison est presque finie !",
    ],
    objective: { type: 'build', stage: 4 },
    objectiveText: 'Construire le toit (8 bois + 4 pierre)',
  },
  {
    id: 'gather_finish',
    title: 'Les finitions',
    dialogueStart: [
      "Le toit est pose ! Plus que les finitions.",
      "Une cheminee, une porte, des fenetres...",
      "Il faut juste 3 bois et 2 pierres de plus.",
    ],
    objective: { type: 'collect_multi', items: { wood: 3, rock: 2 } },
    objectiveText: 'Bois (0/3) + Pierre (0/2)',
  },
  {
    id: 'build_finish',
    title: 'Finir la maison',
    dialogueStart: [
      "C'est le moment ! Va finir ta maison !",
    ],
    objective: { type: 'build', stage: 5 },
    objectiveText: 'Terminer la maison (3 bois + 2 pierre)',
  },
  {
    id: 'complete',
    title: 'Maison terminee !',
    dialogueStart: [
      "FELICITATIONS ! Ta maison est construite !",
      "C'est le debut de ton aventure VDX !",
      "Dans la prochaine etape, on va apprendre a cultiver...",
      "Mais ca, c'est pour le Village 2 ! A bientot !",
    ],
    objective: { type: 'none' },
    objectiveText: 'Village 1 termine ! Bravo !',
  },
];

export function createQuestState() {
  return {
    currentQuest: 0,
    needsTalk: true,
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

  const fullLine = state.dialogueLines[state.dialogueIdx] || '';
  if (state.charIdx < fullLine.length) {
    state.displayText = fullLine;
    state.charIdx = fullLine.length;
    return true;
  }

  state.dialogueIdx++;
  if (state.dialogueIdx >= state.dialogueLines.length) {
    state.showingDialogue = false;
    state.needsTalk = false;
    return false;
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
    return houseStage >= obj.stage;
  }
  if (obj.type === 'none') {
    return false;
  }
  return false;
}

export function advanceQuest(state) {
  if (state.currentQuest < QUEST_DEFS.length - 1) {
    state.currentQuest++;
    state.needsTalk = true;
    state.objectiveMet = false;
    return true;
  }
  return false;
}

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
