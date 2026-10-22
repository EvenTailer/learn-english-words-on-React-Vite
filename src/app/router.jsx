/* eslint-disable react-refresh/only-export-components -- файл экспортирует роутер, а не компонент: fast refresh здесь не нужен */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Loader from '../shared/ui/Loader';

// Каждая страница — отдельный чанк, грузится только когда на неё перешли
const HomePage = lazy(() => import('../pages/HomePage'));
const LearnPage = lazy(() => import('../pages/LearnPage'));
const AddPage = lazy(() => import('../pages/AddPage'));
const StoragePage = lazy(() => import('../pages/StoragePage'));
const WordListsPage = lazy(() => import('../pages/WordListsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));

const withSuspense = (element) => (
  <Suspense fallback={<Loader />}>{element}</Suspense>
);

// Приложение живёт не в корне домена, а в /english/ — берём basename из Vite
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      // раскладка без пути — оборачивает все страницы шапкой и тостом
      element: <App />,
      children: [
        { index: true, element: withSuspense(<HomePage />) },
        { path: 'learn', element: withSuspense(<LearnPage />) },
        { path: 'add', element: withSuspense(<AddPage />) },
        { path: 'storage', element: withSuspense(<StoragePage />) },
        { path: 'wordlists', element: withSuspense(<WordListsPage />) },
        { path: 'login', element: withSuspense(<LoginPage />) },
        { path: '*', element: withSuspense(<NotFoundPage />) },
      ],
    },
  ],
  { basename }
);
