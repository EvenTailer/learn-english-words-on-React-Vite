import localforage from 'localforage';
import AddCard from './components/AddCard';
import LearnCard from './components/LearnCard';
import StartScreen from './components/StartScreen';
import './style.css'
import { useState, useRef, useEffect } from 'react'
import CardStorage from './components/CardStorage';
import { useLearning } from './hooks/useLearning';
function App() {

  const [englishWord, setEngishWord] = useState('');
  const [russianWord, setRussianWord] = useState('');
  const [linkImg, setLinkImg] = useState('');
  const [learnWords, setLearnWords] = useState(false);
  const [addWords, setAddWords] = useState(false); 
  const inputRef = useRef(null);
  const [storage, setStorage] = useState(false)
  // Библиотека слов которые пользователь добавляет
  const initialWords = [
      {
      id: id(),
      englishWord: 'lion',
      linkImg: 'https://t3.ftcdn.net/jpg/06/29/27/22/360_F_629272263_HR7Fr9eoLFQZk61hvKgr7kKYDDNqZYcC.jpg',
      russianWord: 'лев',
      count: 0
    },
    {
      id: id(),
      englishWord: 'monkey',
      linkImg: 'https://img.freepik.com/premium-photo/close-up-lion-looking-away_1048944-5944959.jpg?semt=ais_hybrid',
      russianWord: 'обезьяна',
      count: 0
    }, {
      id: id(),
      englishWord: 'crocodile',
      linkImg: 'https://t3.ftcdn.net/jpg/09/66/07/06/360_F_966070642_Lxir7Ax8mHycK7ZZVx29xKq0eJF5QiGf.jpg',
      russianWord: 'крокодил',
      count: 0
    }
  ]

  // Возвращаем данные с useLearning
  const {

    labraryWords,
    setLabraryWords,
    currentCard,
    writeAnswer,
    setWriteAnswer,
    toast,
    sellAnswer,
    pickRandomCard,
  } = useLearning(initialWords)
  


  // id для карточек
  function id() {
    return `${Date.now()}-${Math.random()}`
  }

  // Учить карточки
  function showLearnWords() {
    setLearnWords(true);
    setAddWords(false)
    setStorage(false)
    pickRandomCard();
  }
  //  Добавлять карточки
  function showAddWords() {
    setLearnWords(false);
    setStorage(false)
    setAddWords(true)
  }
  //  на начальный экран
  function backToStart() {
    setLearnWords(false);
    setAddWords(false)
    setStorage(false)
  }

  // В Хранилище
  function goToStorage() {
    setLearnWords(false);
    setAddWords(false)
    setStorage(true)
  }

  

  // Учим слова по карточкам
  const renderLearnSection = () => {
    if (labraryWords.length === 0) {
      return (
        <div>
          <p>Словарь пуст. Добавьте слова.</p>
          <button onClick={showAddWords}>Добавить слова</button>
        </div>
      );
    }
    return (
      <LearnCard
        currentCard={currentCard}
        writeAnswer={writeAnswer}
        setWriteAnswer={setWriteAnswer}
        sellAnswer={sellAnswer}
        backToStart={backToStart}
      />
    );
  };
  //  Внутрь хранилища 
  const insideStorage = () => {
    return (
      <CardStorage
        labraryWords={labraryWords}
        deleteCard={deleteCard}
        backToStart={backToStart}
      />
    );
  };
  //  Удаляем ненужные слова
  const deleteCard = (id) => {
    setLabraryWords(prev => prev.filter(card => card.id != id))

  }


  useEffect(() => {
    if (currentCard) {
      inputRef.current?.focus();
    }
  }, [currentCard]);


  //  Добавление слов 
  function addInLabruary(englishWord, linkImg, russianWord) {
    const card = {
      id: id(),
      englishWord: englishWord,
      linkImg: linkImg,
      russianWord: russianWord,
      count: 0
    }
    if (englishWord === "".trim()) {
      alert('вы не ввели Английское слово')
    } else if (russianWord === "".trim()) {
      alert('вы не ввели Русское слово слово')
    } else {
      setLabraryWords([...labraryWords, card])
      setEngishWord('')
      setLinkImg('')
      setRussianWord('')
    }

  }
  // пробуем локалФоредж
  useEffect(() => {
    const loadData = async () => {
      const saved = await localforage.getItem('cards');
      if (saved && saved.length > 0) setLabraryWords(saved);
    };
    loadData();
  }, []);

  useEffect(() => {
    localforage.setItem('cards', labraryWords);
  }, [labraryWords])
  return (
    <>

      {learnWords && renderLearnSection()}
      {!learnWords && !addWords && !storage && (
        <StartScreen
          showLearnWords={showLearnWords}
          showAddWords={showAddWords}
          goToStorage={goToStorage}
        />
      )}
      {addWords && (
        <AddCard
          setEngishWord={setEngishWord}
          setLinkImg={setLinkImg}
          setRussianWord={setRussianWord}
          addInLabruary={addInLabruary}
          backToStart={backToStart}
          englishWord={englishWord}
          linkImg={linkImg}
          russianWord={russianWord}

        />
      )}
      {storage && (
        insideStorage()
      )}

      {toast.message && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  )
}

export default App
