import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { selectCards } from '../features/words/selectors';
import { cardDeleted } from '../features/words/wordsSlice';
import styles from './StoragePage.module.css';

export default function StoragePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cards = useAppSelector(selectCards);
  const [searchTerm, setSearchTerm] = useState('');

  const query = searchTerm.trim().toLowerCase();
  const filteredWords =
    query === ''
      ? cards
      : cards.filter(
          (card) =>
            card.englishWord.toLowerCase().includes(query) ||
            card.russianWord.toLowerCase().includes(query)
        );

  return (
    <div className={styles.storageScreen}>
      <div className={styles.storageContainer}>
        <div className={styles.storageHeader}>
          <h2 className={styles.storageTitle}>📚 Хранилище слов</h2>
          <p className={styles.storageSubtitle}>
            Всего слов:{' '}
            <span className={styles.storageCount}>{cards.length}</span>
          </p>
        </div>

        <div className={styles.storageSearch}>
          <input
            type="text"
            className={styles.storageSearchInput}
            placeholder="🔍 Поиск по английскому или русскому слову..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.storageTableWrapper}>
          <table className={styles.storageTable}>
            <thead>
              <tr>
                <th>№</th>
                <th>Изображение</th>
                <th>🇬🇧 Английский</th>
                <th>🇷🇺 Русский</th>
                <th>🎯 Счёт</th>
                <th>⚙️ Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.storageEmpty}>
                    📭 Слова не найдены
                  </td>
                </tr>
              ) : (
                filteredWords.map((card, index) => (
                  <tr key={card.id}>
                    <td>{index + 1}</td>
                    <td className={styles.storageImageCell}>
                      {card.linkImg ? (
                        <img
                          src={card.linkImg}
                          alt={card.englishWord}
                          className={styles.storageImage}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className={styles.storageImagePlaceholder}>🖼️</div>
                      )}
                    </td>
                    <td className={styles.storageEnglish}>{card.englishWord}</td>
                    <td className={styles.storageRussian}>{card.russianWord}</td>
                    <td>
                      <span className={styles.storageCountBadge}>
                        {card.count}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.storageDeleteBtn}
                        onClick={() => dispatch(cardDeleted(card.id))}
                        title="Удалить карточку"
                      >
                        🗑️ Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.storageActions}>
          <button
            className={styles.storageBackBtn}
            onClick={() => navigate('/')}
          >
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
}
