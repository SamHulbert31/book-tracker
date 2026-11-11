import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import styles from './Stars.module.css';

const GLYPHS = '★★★★★';

export const ratingLabel = (rating: number) => `${rating} out of 5 stars`;

/** Five empty stars with a clipped overlay of five filled ones, so half stars are exact. */
function StarGlyphs({ rating, size }: { rating: number; size: number }) {
  return (
    <div className={styles.stars} style={{ fontSize: size, lineHeight: `${size + 2}px` }}>
      {GLYPHS}
      <div className={styles.fill} style={{ width: `${rating * 20}%` }}>
        {GLYPHS}
      </div>
    </div>
  );
}

export function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <div role="img" aria-label={ratingLabel(rating)} style={{ width: 'max-content' }}>
      <StarGlyphs rating={rating} size={size} />
    </div>
  );
}

interface StarInputProps {
  value?: number;
  /** Called continuously while tapping or dragging. */
  onChange: (value: number) => void;
  /** Called once when the tap, drag or key press finishes. */
  onCommit?: (value: number) => void;
  size?: number;
  label?: string;
}

const clamp = (v: number) => Math.min(5, Math.max(0.5, v));

/** Tap or drag across the stars; snaps to half stars. Also works with the arrow keys. */
export function StarInput({ value, onChange, onCommit, size = 36, label = 'Rating' }: StarInputProps) {
  const glyphs = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const latest = useRef<number | undefined>(value);

  function fromX(clientX: number): number {
    const rect = glyphs.current!.getBoundingClientRect();
    return clamp(Math.ceil(((clientX - rect.left) / rect.width) * 10) / 2);
  }

  function apply(next: number) {
    latest.current = next;
    onChange(next);
  }

  function onPointerDown(e: PointerEvent) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(fromX(e.clientX));
  }

  function onPointerMove(e: PointerEvent) {
    if (dragging.current) apply(fromX(e.clientX));
  }

  function finish() {
    if (!dragging.current) return;
    dragging.current = false;
    if (latest.current !== undefined) onCommit?.(latest.current);
  }

  function onKeyDown(e: KeyboardEvent) {
    const current = value ?? 0;
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(current + 0.5);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(current - 0.5);
    else if (e.key === 'Home') next = 0.5;
    else if (e.key === 'End') next = 5;
    if (next === undefined) return;
    e.preventDefault();
    apply(next);
    onCommit?.(next);
  }

  return (
    <div
      className={styles.input}
      style={{ minHeight: Math.max(44, size + 2) }}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
      aria-valuetext={value ? ratingLabel(value) : 'Not rated'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={onKeyDown}
    >
      <div ref={glyphs} style={{ width: 'max-content' }}>
        <StarGlyphs rating={value ?? 0} size={size} />
      </div>
    </div>
  );
}
