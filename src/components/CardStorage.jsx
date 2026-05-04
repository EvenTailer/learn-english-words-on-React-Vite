import React, { useState } from 'react';

function CardStorage({ labraryWords, deleteCard, backToStart }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWords = searchTerm === ''
    ? labraryWords
    : labraryWords.filter(card =>
        card.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.russianWord.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="storage-screen">
      <div className="storage-container">
        <div className="storage-header">
          <h2 className="storage-title">📚 Хранилище слов</h2>
          <p className="storage-subtitle">
            Всего слов: <span className="storage-count">{labraryWords.length}</span>
          </p>
        </div>

        <div className="storage-search">
          <input
            type="text"
            className="storage-search-input"
            placeholder="🔍 Поиск по английскому или русскому слову..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="storage-table-wrapper">
          <table className="storage-table">
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
                  <td colSpan="6" className="storage-empty">
                    📭 Слова не найдены
                  </td>
                </tr>
              ) : (
                filteredWords.map((card, index) => (
                  <tr key={card.id}>
                    <td>{index + 1}</td>
                    <td className="storage-image-cell">
                      {card.linkImg ? (
                        <img 
                          src={card.linkImg} 
                          alt={card.englishWord}
                          className="storage-image"
                        />
                      ) : (
                        <div className="storage-image-placeholder">🖼️</div>
                      )}
                    </td>
                    <td className="storage-english">{card.englishWord}</td>
                    <td className="storage-russian">{card.russianWord}</td>
                    <td>
                      <span className="storage-count-badge">{card.count}</span>
                    </td>
                    <td>
                      <button
                        className="storage-delete-btn"
                        onClick={() => deleteCard(card.id)}
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

        <div className="storage-actions">
          <button className="storage-back-btn" onClick={backToStart}>
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardStorage;