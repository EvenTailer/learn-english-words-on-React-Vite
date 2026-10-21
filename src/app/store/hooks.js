import { useDispatch, useSelector, useStore } from 'react-redux';

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
// Нужен для операций вне рендера: экспорт данных, отправка в бэкап
export const useAppStore = useStore;
