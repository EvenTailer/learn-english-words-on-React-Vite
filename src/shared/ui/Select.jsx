import { useId } from 'react';
import Icon from './Icon';
import styles from './Select.module.css';

/**
 * Нативный выпадающий список. onChange получает ЗНАЧЕНИЕ (не event).
 */
export default function Select({
  label,
  value,
  onChange,
  options = [],
  hint,
  disabled = false,
  id,
  className,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const hintId = `${selectId}-hint`;

  const handleChange = (event) => {
    if (onChange) onChange(event.target.value);
  };

  const classes = [styles.field, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>

      <div className={styles.control}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className={styles.chevron} aria-hidden="true">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>

      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
