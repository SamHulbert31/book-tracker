import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import { UpdatePrompt } from './UpdatePrompt';
import { useAutoTagGenres } from '../ai/autoTag';
import styles from './AppShell.module.css';

/**
 * A full height column, centred and capped at 480px on wide screens. Each
 * screen scrolls inside it and the tab bar stays pinned underneath.
 */
export function AppShell() {
  const scroller = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Books without genres are tagged in the background when an AI key is set.
  useAutoTagGenres();

  // Each screen starts at the top.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <main className={styles.scroll} ref={scroller}>
        <Outlet />
      </main>
      <TabBar />
      <UpdatePrompt />
    </div>
  );
}
