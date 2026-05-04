import React from 'react';

function StartScreen({ showLearnWords, showAddWords, goToStorage }) {
  return (
    <div className="start-screen">
      <div className="start-card">
        <h1 className="start-title">📖 Learn English Words</h1>
        <p className="start-subtitle">Интерактивный тренажёр английской лексики</p>
        
        <div className="start-buttons">
          <button className="start-btn learn" onClick={showLearnWords}>
            🧠 Учить слова
          </button>
          <button className="start-btn add" onClick={showAddWords}>
            ➕ Добавить слова
          </button>
          <button className="start-btn storage" onClick={goToStorage}>
            📚 Хранилище
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartScreen;