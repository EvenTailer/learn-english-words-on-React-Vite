import { useDispatch, useSelector } from 'react-redux';

// Типизированные хуки: компоненты не знают про структуру стора,
// но получают готовые useDispatch / useSelector
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
