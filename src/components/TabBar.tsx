import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, LibraryIcon, StatsIcon } from './Icons';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: 'Home', icon: <HomeIcon />, matches: (p: string) => p === '/' },
  {
    to: '/library',
    label: 'Library',
    icon: <LibraryIcon />,
    // A single book belongs to the Library tab.
    matches: (p: string) => p.startsWith('/library') || p.startsWith('/book/') || p.startsWith('/add') || p.startsWith('/session/') || p.startsWith('/quotes'),
  },
  { to: '/stats', label: 'Stats', icon: <StatsIcon />, matches: (p: string) => p.startsWith('/stats') },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className={styles.bar} aria-label="Main">
      {TABS.map((tab) => {
        const active = tab.matches(pathname);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon}
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
