import Icon from './Icon';
import Input from './Input';
import styles from './SearchField.module.css';

/**
 * Поле поиска: Input type="search" + иконка поиска + кнопка очистки.
 * onChange получает значение, onClear вызывается дополнительно.
 */
export default function SearchField({
  value,
  onChange,
  placeholder = 'Поиск…',
  label = 'Поиск',
  onClear,
  autoFocus = false,
}) {
  const handleClear = () => {
    if (onClear) onClear();
    if (onChange) onChange('');
  };

  return (
    <div className={styles.wrapper}>
      <Input
        type="search"
        label={label}
        hideLabel
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={handleClear}
        icon={<Icon name="search" size={20} />}
        autoFocus={autoFocus}
      />
    </div>
  );
}
