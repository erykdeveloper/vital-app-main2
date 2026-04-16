import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="app-container">
      <main className="app-content pb-20 hide-scrollbar">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
