import { useState, useRef } from "react";

export function useLearning(initialWords) {
    const [currentCard, setCurrentCard] = useState(null);
    const [writeAnswer, setWriteAnswer] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const toastTimeoutRef = useRef(null);
    const [labraryWords, setLabraryWords] = useState(initialWords)


    // Показываем блок при правильном или неправильном ответе на 2 сек
    const showToast = (message, type) => {

        // Очищаем предыдущий таймер, чтобы сообщение не исчезло раньше времени
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        // Устанавливаем новое сообщение (перезаписываем предыдущее)
        setToast({ message, type });
        // Устанавливаем таймер на очистку через 2 секунды
        toastTimeoutRef.current = setTimeout(() => {
            setToast({ message: '', type: '' });
        }, 2000);
    };

    // Рандомное число от 1 до длинны массива, отдаем целый обьект

    const pickRandomCard = () => {
        if (labraryWords.length === 0) {
            setCurrentCard(null);
            return;
        }
        const randomIndex = Math.floor(Math.random() * labraryWords.length);
        setCurrentCard(labraryWords[randomIndex]);
    }

    // Проверка ответа
    function sellAnswer(mode) {
        const index = labraryWords.findIndex(card => card.id === currentCard.id);
        const userAnswer = writeAnswer.trim().toLowerCase();
        const correctAnswer = mode === 'eng' ?
            currentCard.russianWord.toLowerCase()
            : currentCard.englishWord.toLowerCase();

        let toastMessage = '';
        let toastType = '';
        // если пусто в ответе
        if (writeAnswer.trim() === '') {
            toastMessage = 'Вы ничего не ответили';
            toastType = 'error';

        } else if (userAnswer === correctAnswer) { // ответил правильно
            // если ответил правильно 5 раз
            if (labraryWords[index].count === 4) {
                const newArray = labraryWords.filter(card => card.id !== currentCard.id);
                setLabraryWords(newArray);
                if (newArray.length === 0) {
                    setCurrentCard(null);
                    toastMessage = 'Карточки закончились';
                    toastType = 'error';
                    backToStart();
                } else {
                    const randomIndex = Math.floor(Math.random() * newArray.length);
                    setCurrentCard(newArray[randomIndex]);
                }
                toastMessage = 'Правильно! Карточка изучена и удалена';
                toastType = 'success';
            } else {
                // добавляем +1 в count 
                const updateCard = { ...currentCard, count: currentCard.count + 1 }
                const newWords = labraryWords.map(card => {
                    return card.id === currentCard.id ? updateCard : card
                });
                setLabraryWords(newWords);
                const randomIndex = Math.floor(Math.random() * newWords.length);
                setCurrentCard(newWords[randomIndex]);
                toastMessage = 'Правильно!';
                toastType = 'success';
            }


        } else {
            if (labraryWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * labraryWords.length);
                setCurrentCard(labraryWords[randomIndex]);
                toastMessage = `Неправильно! Правильный ответ: ${correctAnswer}`;
                toastType = 'error';
            }


        }
        setWriteAnswer('');
        if (toastMessage) showToast(toastMessage, toastType);
    }

    return {
        labraryWords,
        setLabraryWords,
        currentCard,
        writeAnswer,
        setWriteAnswer,
        toast,
        sellAnswer,
        pickRandomCard,
    }
}