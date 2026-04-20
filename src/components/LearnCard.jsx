import React, { useEffect } from "react";
import { useRef, useState } from "react";

function LearnCard({ currentCard, writeAnswer, setWriteAnswer, sellAnswer, backToStart }) {
  const [mode, setMode] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentCard) {
      const random = Math.random() < 0.5 ? 'eng' : 'rus';
      setMode(random)
    }
  }, [currentCard]);

  useEffect(() => {
    if (currentCard && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentCard]);


  if (!currentCard) return null;

  const showEnglish = mode === 'eng';
  const question = showEnglish ? currentCard.englishWord : currentCard.russianWord


  return <>

    <div className='learn_container'>
      <p className='show_English'>{question}</p>
      <img src={currentCard?.linkImg} alt="" />
      <input
        ref={inputRef}
        className='write_answer'
        value={writeAnswer}
        placeholder='Введите ответ'
        onChange={event => setWriteAnswer(event.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sellAnswer(mode)
          }
        }}
      />
      <button className='ask_translate' onClick={() => { sellAnswer(mode) }}>Sell</button>
      <button
        className='return_back'
        onClick={() => backToStart()}> Back</button>
    </div>

  </>
}

export default LearnCard;