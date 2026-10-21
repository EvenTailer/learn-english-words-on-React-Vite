# 📘 Learn English Words – Interactive Flashcard App

A web application to help you learn and memorize English vocabulary using flashcards. You can create your own word sets, practice them, track your progress, and manage your personal dictionary.

🌐 **Live Demo:** [http://gramilya.xyz/english/](http://gramilya.xyz/english/)

---

## 📸 Screenshots

| Add Words | Learning Mode | Word Storage |
|-----------|---------------|---------------|
| ![Add Words](sreenshots/addWords.png) | ![Learning](sreenshots/learnWords.png) | ![Storage](sreenshots/store.png) |

---

## ✨ Features

- **➕ Add new words**
  Enter an English word, its translation, and optionally an image URL or upload an image from your computer. The card is saved to your library.

- **📖 Learning mode**
  The app randomly shows either the English word or its Russian translation (50/50 chance). Type your answer – the system checks it and gives instant feedback. After 5 correct answers, the card is removed from the active learning set.

- **🗄️ Word storage**
  Browse all your cards in a table. Search by English or Russian word. Delete unwanted cards with one click.

- **🧭 Routing**
  Real pages and URLs: `/`, `/learn`, `/add`, `/storage`. Browser back/forward works as expected, deep links are shareable.

- **📱 Responsive design**
  Works smoothly on desktops, tablets, and mobile devices.

- **💾 Persistent storage**
  All cards are stored in IndexedDB through `localforage` and restored by `redux-persist` before the first render — no data loss on reload.

- **⚡ Lazy loading**
  Every page is a separate bundle, loaded only when you navigate to it.

---

## 🛠️ Tech Stack

- **React 19** (functional components, hooks)
- **Vite 8** – build tool
- **React Router 7** – routing (`createBrowserRouter`, basename from `import.meta.env.BASE_URL`)
- **Redux Toolkit 2** – state management (slices + thunks)
- **redux-persist 6** + **localforage** – persistence in IndexedDB
- **CSS Modules** – styles scoped per page/feature
- **CSS3** – Flexbox, Grid, animations

---

## 📁 Project structure

```
src/
├── app/                     # assembly of the application
│   ├── App.jsx              # layout: header + outlet + toast
│   ├── router.jsx           # routes + lazy loading of pages
│   └── store/
│       ├── index.js         # configureStore + persistReducer
│       └── hooks.js         # useAppDispatch / useAppSelector
├── pages/                   # route components (thin, only layout)
│   ├── HomePage.jsx
│   ├── LearnPage.jsx
│   ├── AddPage.jsx
│   └── StoragePage.jsx
├── features/                # business logic, one folder per feature
│   ├── words/               # cards: wordsSlice.js, selectors.js
│   └── learn/               # learning process: learnSlice.js, learnThunks.js
├── widgets/                 # large blocks
│   └── Header/              # navigation bar
├── shared/                  # reusable, not tied to a feature
│   ├── lib/                 # id.js, localforageStorage.js
│   └── ui/                  # Toast, Loader
└── styles/
    └── global.css           # reset, variables, body background
```

---

## 🧪 Run Locally

```bash
git clone https://github.com/EvenTailer/learn-english-words-on-React-Vite.git
cd my-app
npm install
npm run dev
```

Open http://localhost:5173/english/ in your browser.

```bash
npm run build     # production build
npm run preview   # local preview of the build
npm run lint      # eslint
```

---

## 🚀 Deployment

The app is served from the `/english/` subpath (`base` in `vite.config.js`) and uses history routing, so the server needs a SPA fallback:

```nginx
location /english/ {
    try_files $uri $uri/ /english/index.html;
}
```
