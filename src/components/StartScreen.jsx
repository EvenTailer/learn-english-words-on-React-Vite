import React from "react";

function StartScreen({ showLearnWords, showAddWords,goToStorage }) {


    return <>
        <div className='start_monitor'>
            <button
                className='learn_words'
                onClick={() => showLearnWords()}
            >Учить слова</button>
            <button
                className='add_words'
                onClick={() => showAddWords()}
            >Добавить слова</button>
        </div>
        <div className="container_storage"
        >
            <div
            className="storage"
            >
                <button
                className="go_toStorage"
                onClick={()=>goToStorage()}
                >Хранилище</button>
            </div>
        </div>
    </>
}

export default StartScreen;