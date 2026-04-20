# 📘 Learn English Words – Interactive Flashcard App

A web application to help you learn and memorize English vocabulary using flashcards. You can create your own word sets, practice them, track your progress, and manage your personal dictionary.

🌐 **Live Demo:** [http://gramilya.xyz/english/](http://gramilya.xyz/english/)

---

## 📸 Screenshots

| Add Words | Learning Mode | Word Storage |
|-----------|---------------|---------------|
| ![Add Words](screenshots/addWords.png) | ![Learning](screenshots/learnWords.png) | ![Storage](screenshots/store.png) |

---

## ✨ Features

- **➕ Add new words**  
  Enter an English word, its translation, and optionally an image URL or upload an image from your computer. The card is automatically saved to your library.

- **📖 Learning mode**  
  The app randomly shows either the English word or its Russian translation (50/50 chance). Type your answer – the system checks it and gives instant feedback. After 5 correct answers, the card is removed from the active learning set.

- **🗄️ Word storage**  
  Browse all your cards in a sortable table. Search by English or Russian word. Delete unwanted cards with one click.

- **📱 Responsive design**  
  Works smoothly on desktops, tablets, and mobile devices.

- **💾 Persistent storage**  
  All your cards are saved in your browser’s `localStorage`. Data persists across page reloads.

---

## 🛠️ Tech Stack

- **React 18** (functional components, hooks)
- **Vite** – fast build tool
- **CSS3** – Flexbox, Grid, animations
- **localStorage** – data persistence
- **Debounce** – search optimisation

---

## 🧪 Run Locally

```bash
git clone https://github.com/EvenTailer/learn-english-words.git
cd my-app
npm install
npm run dev
Open http://localhost:5173 in your browser.


