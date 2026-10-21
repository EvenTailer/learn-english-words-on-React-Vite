import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { selectLists } from '../../features/lists/selectors';
import { listDeleted, listRenamed, wordRemovedFromList } from '../../features/lists/listsSlice';
import { wordsAdded } from '../../features/progress/progressSlice';
import { toastShown } from '../../features/ui/toastSlice';
import { selectCards } from '../../features/words/selectors';
import { cardsImported } from '../../features/words/wordsSlice';
import { createId } from '../../shared/lib/id';
import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import EmptyState from '../../shared/ui/EmptyState';
import Icon from '../../shared/ui/Icon';
import IconButton from '../../shared/ui/IconButton';
import Input from '../../shared/ui/Input';
import SetCreateModal from '../SetCreateModal/SetCreateModal';
import styles from './MyLists.module.css';

/**
 * Свои наборы слов: пользователь собирает тематические наборы вручную.
 * Слова набора можно залить в словарь одной кнопкой — тогда их можно учить.
 */
export default function MyLists({ onCreate }) {
  const dispatch = useAppDispatch();

  const lists = useAppSelector(selectLists);
  const cards = useAppSelector(selectCards);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const pendingList = useMemo(
    () => lists.find((list) => list.id === pendingDeleteId) ?? null,
    [lists, pendingDeleteId]
  );

  // Сколько слов списка уже есть в словаре
  const inDictionary = useMemo(() => {
    const keys = new Set(
      cards.map((card) => String(card.englishWord ?? '').trim().toLowerCase())
    );
    return (list) =>
      list.words.filter(
        (word) => keys.has(String(word.englishWord ?? '').trim().toLowerCase())
      ).length;
  }, [cards]);

  const handleCreate = () => {
    if (onCreate) onCreate();
  };

  const handleRename = (id) => {
    const name = editName.trim();
    if (!name) return;
    dispatch(listRenamed({ id, name }));
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = () => {
    if (!pendingList) return;
    dispatch(listDeleted(pendingList.id));
    dispatch(toastShown({ message: 'Набор удалён', type: 'info' }));
    setPendingDeleteId(null);
  };

  // Заливаем слова списка в словарь — после этого их можно учить
  const handleImport = (list) => {
    const newCards = list.words.map((word) => ({
      id: createId(),
      englishWord: word.englishWord,
      russianWord: word.russianWord,
      linkImg: word.linkImg ?? '',
      count: 0,
    }));

    if (newCards.length === 0) return;

    dispatch(cardsImported(newCards));
    dispatch(
      wordsAdded(
        newCards.map((card) => ({
          englishWord: card.englishWord,
          russianWord: card.russianWord,
        }))
      )
    );
    dispatch(
      toastShown({
        message: `В словарь добавлено слов: ${newCards.length}`,
        type: 'success',
      })
    );
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headings}>
          <h2 className={styles.title}>Мои наборы</h2>
          <p className={styles.subtitle}>
            Соберите свои тематические наборы и учите по ним
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Icon name="plus" size={20} />}
          onClick={handleCreate}
        >
          Новый набор
        </Button>
      </header>

      {lists.length === 0 ? (
        <EmptyState
          title="Своих наборов пока нет"
          description="Создайте набор и добавляйте в него слова из «Хранилища» или со страницы «Добавить»."
          icon={<Icon name="list" size={32} />}
          action={
            <Button
              variant="secondary"
              icon={<Icon name="plus" size={20} />}
              onClick={handleCreate}
            >
              Создать набор
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {lists.map((list) => (
            <Card key={list.id} padding="md" className={styles.card}>
              <div className={styles.cardTop}>
                {editingId === list.id ? (
                  <div className={styles.renameRow}>
                    <Input
                      label="Название"
                      hideLabel
                      value={editName}
                      onChange={setEditName}
                      placeholder="Название набора"
                      autoComplete="off"
                    />
                    <Button variant="primary" onClick={() => handleRename(list.id)}>
                      Сохранить
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className={styles.cardHeadings}>
                      <h3 className={styles.name}>{list.name}</h3>
                      <p className={styles.meta}>
                        слов: {list.words.length} · в словаре:{' '}
                        {inDictionary(list)}
                      </p>
                    </div>
                    <div className={styles.cardActions}>
                      <IconButton
                        icon={<Icon name="edit" size={18} />}
                        label={`Переименовать набор ${list.name}`}
                        variant="ghost"
                        onClick={() => {
                          setEditingId(list.id);
                          setEditName(list.name);
                        }}
                      />
                      <IconButton
                        icon={<Icon name="trash" size={18} />}
                        label={`Удалить набор ${list.name}`}
                        variant="danger"
                        onClick={() => setPendingDeleteId(list.id)}
                      />
                    </div>
                  </>
                )}
              </div>

              {list.words.length === 0 ? (
                <p className={styles.empty}>
                  Набор пуст. Добавьте слова из «Хранилища» — там есть кнопка
                  «в набор».
                </p>
              ) : (
                <ul className={styles.words}>
                  {list.words.map((word) => (
                    <li key={word.englishWord} className={styles.word}>
                      <span className={styles.wordEn}>{word.englishWord}</span>
                      <span className={styles.wordRu}>{word.russianWord}</span>
                      <IconButton
                        icon={<Icon name="close" size={16} />}
                        label={`Убрать ${word.englishWord} из набора`}
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          dispatch(
                            wordRemovedFromList({
                              listId: list.id,
                              englishWord: word.englishWord,
                            })
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}

              {list.words.length > 0 ? (
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Icon name="plus" size={20} />}
                  onClick={() => handleImport(list)}
                >
                  Добавить в словарь
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingList)}
        title="Удалить набор?"
        description={`«${pendingList?.name ?? ''}» будет удалён вместе со словами`}
        confirmLabel="Удалить"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
