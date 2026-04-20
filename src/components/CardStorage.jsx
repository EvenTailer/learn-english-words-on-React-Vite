import React from "react";
import { useState } from "react";

function CardStorage({ labraryWords, deleteCard, backToStart }) {

  const [findeWord,setFindeWord] = useState('')

  const filteredWords = findeWord === '' 
  ? labraryWords 
  : labraryWords.filter(card =>
      card.englishWord.toLowerCase().includes(findeWord.toLowerCase().trim()) ||
      card.russianWord.toLowerCase().includes(findeWord.toLowerCase().trim())
    );
  return (<>

    <div
      className="container_search"
    ><input type="text"
      value={findeWord}
      className="findeWord"
      onChange={(event) => {setFindeWord(event.target.value) }}
      placeholder="Поиск"
      />
    </div>
    <table className="storage-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Слово</th>
          <th>Перевод</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        {filteredWords.map((card, index) => (
          <tr key={card.id}>
            <td>{index + 1}</td>
            <td>{card.englishWord}</td>
            <td>{card.russianWord}</td>
            <td>
              <button
                className="delete-card-btn"
                onClick={() => deleteCard(card.id)}
              >
                🗑️ Удалить
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div>
      <button
        className='return_back'
        onClick={() => backToStart()}> Back</button>
    </div>
  </>
  )
}
export default CardStorage;