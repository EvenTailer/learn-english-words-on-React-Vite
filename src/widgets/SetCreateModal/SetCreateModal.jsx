import { useState } from 'react';
import { useAppDispatch } from '../../app/store/hooks';
import { listCreated } from '../../features/lists/listsSlice';
import { toastShown } from '../../features/ui/toastSlice';
import Button from '../../shared/ui/Button';
import Input from '../../shared/ui/Input';
import Modal from '../../shared/ui/Modal';
import styles from './SetCreateModal.module.css';

/**
 * Окно создания набора слов: название, описание.
 * Одно окно на всё приложение — и страница наборов, и список моих наборов.
 */
export default function SetCreateModal({ open, onClose, onCreated }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    const clean = name.trim();
    if (!clean) return;

    dispatch(listCreated({ name: clean, description: description.trim() }));
    dispatch(toastShown({ message: `Набор «${clean}» создан`, type: 'success' }));
    setName('');
    setDescription('');
    onClose();
    onCreated?.();
  };

  return (
    <Modal
      open={open}
      title="Новый набор слов"
      onClose={onClose}
      footer={
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleCreate}>
            Создать набор
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <Input
          label="Название набора"
          value={name}
          onChange={setName}
          placeholder="Например: Еда, Путешествия, Работа"
          autoComplete="off"
        />
        <Input
          label="Описание"
          value={description}
          onChange={setDescription}
          placeholder="Зачем этот набор и что в нём"
          autoComplete="off"
        />
        <p className={styles.hint}>
          Слова добавляются из «Хранилища» — кнопка «в список» на карточке.
        </p>
      </div>
    </Modal>
  );
}
