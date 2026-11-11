import { Link } from 'react-router-dom';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';
import { ChevronLeftIcon } from '../components/Icons';
import styles from './BookDetail.module.css';

export function BookDetail() {
  return (
    <Screen gap={14} compactTop>
      <div className={styles.topBar}>
        <Link to="/library" className={styles.back}>
          <ChevronLeftIcon />
          Library
        </Link>
      </div>

      <EmptyState title="Book not found">It may have been removed. Head back to your library to pick another.</EmptyState>
    </Screen>
  );
}
