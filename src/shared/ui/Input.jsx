import { useId } from 'react';
import Icon from './Icon';
import styles from './Input.module.css';

/**
 * Поле ввода. onChange получает ЗНАЧЕНИЕ (не event).
 * hideLabel прячет подпись визуально, но оставляет её для скринридера.
 */
export default function Input({
  label,
  hideLabel = false,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  error,
  disabled = false,
  readOnly = false,
  required = false,
  icon,
  onClear,
  autoComplete,
  inputRef,
  autoFocus = false,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const handleChange = (event) => {
    if (onChange) onChange(event.target.value);
  };

  const hasValue = value !== undefined && value !== null && value !== '';
  const showClear = Boolean(onClear) && hasValue;

  const controlClasses = [
    styles.control,
    icon ? styles.controlWithIcon : '',
    showClear ? styles.controlWithClear : '',
    error ? styles.controlError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      <div className={controlClasses}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <input
          id={inputId}
          ref={inputRef}
          className={styles.input}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />

        {showClear ? (
          <button
            type="button"
            className={styles.clear}
            onClick={onClear}
            aria-label="Очистить"
            title="Очистить"
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
