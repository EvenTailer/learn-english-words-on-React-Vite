import React, { useEffect, useRef, useState } from 'react';

function LearnCard({ currentCard, writeAnswer, setWriteAnswer, sellAnswer, backToStart }) {
  const [mode, setMode] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentCard) {
      const random = Math.random() < 0.5 ? 'eng' : 'rus';
      setMode(random);
    }
  }, [currentCard]);

  useEffect(() => {
    if (currentCard && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCard]);

  if (!currentCard) return null;

  const showEnglish = mode === 'eng';
  const question = showEnglish ? currentCard.englishWord : currentCard.russianWord;

  return (
    <div className="learn-screen">
      <div className="learn-card">
        <button className="learn-back-btn" onClick={backToStart}>
          ← На главную
        </button>

        <div className="learn-content">
          <div className="learn-image-wrapper">
            {currentCard.linkImg ? (
              <img 
                src={currentCard.linkImg} 
                alt={currentCard.englishWord}
                className="learn-image"
              />
            ) : (
              <div className="learn-image-placeholder">
                <span>🖼️</span>
                <p>Нет изображения</p>
              </div>
            )}
          </div>

          <div className="learn-question">
            <span className="learn-badge">
              {showEnglish ? '🇬🇧 ENGLISH' : '🇷🇺 RUSSIAN'}
            </span>
            <h2 className="learn-word">{question}</h2>
          </div>

          <div className="learn-input-area">
            <input
              ref={inputRef}
              type="text"
              className="learn-input"
              placeholder="Введите перевод..."
              value={writeAnswer}
              onChange={(e) => setWriteAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sellAnswer(mode)}
              autoComplete="off"
            />
            <button 
              className="learn-check-btn"
              onClick={() => sellAnswer(mode)}
            >
              ✅ Проверить
            </button>
          </div>

          <div className="learn-hint">
            <span>💡 Нажми Enter или кнопку «Проверить»</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearnCard;