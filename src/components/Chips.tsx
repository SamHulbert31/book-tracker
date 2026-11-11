import styles from './Chips.module.css';

/** Static genre chips, as in the book detail mockup. */
export function GenreChips({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;
  return (
    <div className={styles.static}>
      {genres.map((g) => (
        <span key={g} className={styles.chip}>
          {g}
        </span>
      ))}
    </div>
  );
}

interface ChipPickerProps {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Tappable chips, one toggle each. */
export function ChipPicker({ options, selected, onToggle }: ChipPickerProps) {
  return (
    <div className={styles.picker}>
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={on ? `${styles.toggle} ${styles.on}` : styles.toggle}
            aria-pressed={on}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface ChipChoiceProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Pick exactly one chip. */
export function ChipChoice<T extends string | number>({ options, value, onChange, label }: ChipChoiceProps<T>) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={on ? `${styles.toggle} ${styles.on}` : styles.toggle}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
