import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Home } from './screens/Home';
import { Library } from './screens/Library';
import { AddBook } from './screens/AddBook';
import { BookDetail } from './screens/BookDetail';
import { Stats } from './screens/Stats';
import { Session } from './screens/Session';
import { Quotes } from './screens/Quotes';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="add" element={<AddBook />} />
        <Route path="book/:id" element={<BookDetail />} />
        <Route path="session/:id" element={<Session />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
