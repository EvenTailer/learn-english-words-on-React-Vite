export const selectCurrentCard = (state) =>
  state.cards.items.find((card) => card.id === state.learn.currentCardId) ?? null;

export const selectLearnMode = (state) => state.learn.mode;

export const selectIsRevealed = (state) => state.learn.revealed;
