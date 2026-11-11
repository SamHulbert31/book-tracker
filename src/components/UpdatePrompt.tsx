import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

/** Shown when a newer version of the app has been deployed. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.toast} role="status">
      <span className={styles.text}>A new version is available.</span>
      <button className={styles.update} type="button" onClick={() => updateServiceWorker(true)}>
        Update
      </button>
      <button className={styles.later} type="button" onClick={() => setNeedRefresh(false)}>
        Later
      </button>
    </div>
  );
}
