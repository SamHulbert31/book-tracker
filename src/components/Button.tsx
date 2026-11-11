import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'quiet' | 'danger';
  block?: boolean;
}

export function Button({ variant = 'primary', block = false, className, type = 'button', ...rest }: ButtonProps) {
  const cls = [styles.button, styles[variant], block ? styles.block : '', className ?? ''].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}
