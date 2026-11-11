import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

/** A labelled form control. The label wraps the control, so tapping the label focuses it. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

/** For controls that are not a single input (stars, chip pickers). */
export function FieldGroup({ label, children, action }: { label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <div className={styles.groupHead}>
        <span className={styles.label}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.control} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${styles.control} ${styles.textarea}`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.control} {...props} />;
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className={styles.error} role="alert">
      {children}
    </p>
  );
}

/** Two controls side by side. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
