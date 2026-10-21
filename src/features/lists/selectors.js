export const selectLists = (state) => state.lists.items;

export const selectListById = (state, id) =>
  state.lists.items.find((item) => item.id === id) ?? null;

export const selectListsCount = (state) => state.lists.items.length;

// Ключи слов списка — по ним слова попадают в тренировку
export const selectListWordKeys = (state, listId) => {
  const list = state.lists.items.find((item) => item.id === listId);
  if (!list) return [];
  return list.words.map((word) =>
    String(word?.englishWord ?? '').trim().toLowerCase()
  );
};
