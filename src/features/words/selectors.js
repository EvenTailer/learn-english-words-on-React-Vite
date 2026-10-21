export const selectCards = (state) => state.cards.items;

export const selectCardsCount = (state) => state.cards.items.length;

export const selectCardById = (state, id) =>
  state.cards.items.find((card) => card.id === id);

export const selectCurrentCard = (state) =>
  state.cards.items.find((card) => card.id === state.learn.currentCardId) ?? null;
