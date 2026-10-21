import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { selectLists } from '../../features/lists/selectors';
import { wordsAddedToList } from '../../features/lists/listsSlice';
import { toastShown } from '../../features/ui/toastSlice';
import Button from '../../shared/ui/Button';
import Chip from '../../shared/ui/Chip';
import EmptyState from '../../shared/ui/EmptyState';
import Icon from '../../shared/ui/Icon';
import Modal from '../../shared/ui/Modal';
import styles from './AddToListModal.module.css';

/**
 * Окно «Добавить в набор»: выбираем свои наборы для слова.
 * Слово добавляется сразу, если его ещё нет.
 */
export default function AddToListModal({ card, open, onClose, onCreate }) {
  const dispatch = useAppDispatch();
  const lists = useAppSelector(selectLists);

  const [selected, setSelected] = useState([]);

  // При открытии подставляем текущее состояние: слово уже в этих списках
  useEffect(() => {
    if (!open || !card) return;
    const key = String(card.englishWord ?? '').trim().toLowerCase();
    setSelected(
      lists
        .filter((list) =>
          list.words.some(
            (word) =>
              String(word.englishWord ?? '').trim().toLowerCase() === key
          )
        )
        .map((list) => list.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, card?.id]);

  if (!card) return null;

  const toggle = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSave = () => {
    // без выбранного набора закрывать нельзя — слово потеряется
    if (selected.length === 0) return;

    const word = {
      englishWord: card.englishWord,
      russianWord: card.russianWord,
      phonetic: card.phonetic ?? '',
      definition: card.definition ?? '',
      linkImg: card.linkImg ?? '',
    };

    for (const listId of selected) {
      dispatch(wordsAddedToList({ listId, words: [word] }));
    }

    const names = selected
      .map((id) => lists.find((list) => list.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    dispatch(
      toastShown({
        message: `«${card.englishWord}» — в наборы: ${names}`,
        type: 'success',
      })
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Добавить в набор"
      onClose={onClose}
      footer={
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleSave} disabled={selected.length === 0}>
            Добавить
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        </div>
      }
    >
      <p className={styles.word}>
        <strong>{card.englishWord}</strong>
        {card.russianWord ? ` — ${card.russianWord}` : ''}
      </p>

      {lists.length === 0 ? (
        <EmptyState
          title="Своих наборов нет"
          description="Создайте набор — и добавляйте в него слова прямо отсюда."
          icon={<Icon name="list" size={28} />}
          action={
            onCreate ? (
              <Button variant="primary" onClick={onCreate}>
                Создать набор
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={styles.chips} role="group" aria-label="Наборы">
          {lists.map((list) => (
            <Chip
              key={list.id}
              label={list.name}
              active={selected.includes(list.id)}
              onClick={() => toggle(list.id)}
            />
          ))}
        </div>
      )}
      {selected.length === 0 ? (
        <p className={styles.hint}>Выберите набор — слово добавится в него</p>
      ) : null}
    </Modal>
  );
}
