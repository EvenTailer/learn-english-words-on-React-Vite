import React, { useState, useRef } from 'react';

function AddCard({ 
  englishWord, setEngishWord, 
  linkImg, setLinkImg, 
  russianWord, setRussianWord, 
  addInLabruary, 
  backToStart 
}) {
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAddCard = async () => {
    let imageData = linkImg;
    if (fileInputRef.current && fileInputRef.current.files[0]) {
      const file = fileInputRef.current.files[0];
      imageData = await fileToBase64(file);
    }
    addInLabruary(englishWord, imageData, russianWord);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="add-screen">
      <div className="add-card">
        <h2 className="add-title">✨ Добавить новую карточку</h2>
        <p className="add-subtitle">Заполните поля ниже, чтобы пополнить словарь</p>

        <div className="add-form">
          {/* Английское слово */}
          <div className="input-group">
            <label className="input-label">🇬🇧 Английское слово</label>
            <input
              type="text"
              className="input-field"
              placeholder="например: fantastic"
              value={englishWord}
              onChange={(e) => setEngishWord(e.target.value)}
            />
          </div>

          {/* Перевод */}
          <div className="input-group">
            <label className="input-label">🇷🇺 Перевод</label>
            <input
              type="text"
              className="input-field"
              placeholder="например: фантастический"
              value={russianWord}
              onChange={(e) => setRussianWord(e.target.value)}
            />
          </div>

          {/* Ссылка на картинку ИЛИ загрузка файла */}
          <div className="input-group">
            <label className="input-label">🖼️ Ссылка на картинку</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://... или загрузите файл ниже"
              value={linkImg}
              onChange={(e) => setLinkImg(e.target.value)}
            />
          </div>

          <div className="file-area">
            <button 
              type="button" 
              className="file-btn"
              onClick={() => fileInputRef.current.click()}
            >
              📁 Выбрать картинку с компьютера
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="preview" />
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="add-actions">
            <button className="btn-submit" onClick={handleAddCard}>
              ➕ Добавить карточку
            </button>
            <button className="btn-back" onClick={backToStart}>
              ← Назад
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCard;