import React from "react";
import { useState, useRef } from "react";

function AddCard({ setEngishWord, setLinkImg, setRussianWord, addInLabruary, backToStart, englishWord, linkImg, russianWord }) {

  const [selectFile, setSelectFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url)
    }
  }

  const fileToBase64 = (file) =>{
    return new Promise((resolve,reject) =>{
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = ()=> resolve(reader.result);
      reader.onerror = (error) => reject(error)
    });
  };


  const handleAddCard = async() => {
    let imageData = linkImg;
    if(selectFile){
      imageData = await fileToBase64(selectFile)
    }
    addInLabruary(englishWord,imageData,russianWord);
    setSelectFile(null);
    setPreviewUrl('');
    if(fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="countainer_card">
      <div
        className="card">
        <div className="add_word">
          <input
            placeholder={'Введите слово на Английском'}
            value={englishWord}
            onChange={(event) => setEngishWord(event.target.value)}
          />
        </div>
        <div className="add_img">
          <input
            placeholder={"Введите ссылку на картинку"}
            value={linkImg}
            onChange={(event) => setLinkImg(event.target.value)}
          />
          <button 
          onClick={()=>fileInputRef.current.click()}
          className="add_pictue">Выбрать картинку</button>
          <input type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {previewUrl && (
            <div>
              <img src={previewUrl} alt="preview" style={{ maxWidth: '100px', marginTop: '10px' }} />
            </div>
          )}
        </div>
        <div className="tranlate_word">
          <input
            placeholder={'Введите перевод'}
            value={russianWord}
            onChange={(event) => setRussianWord(event.target.value)}
          />
        </div>
        <div className="add_card">
          <button
            className='add_card_btn'
            onClick={()=>handleAddCard()}
          >Добавить карточку</button>
        </div>
      </div>
      <button
        className='return_back'
        onClick={() => backToStart()}> Back</button>

    </div>
  )
}

export default AddCard;