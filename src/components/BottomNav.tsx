import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, BookOpen, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useAdmin';

const baseNavItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/workouts', icon: BookOpen, label: 'Treinos' },
  { to: '/appointments', icon: Calendar, label: 'Consultas' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { data: isAdmin } = useIsAdmin();

  const navItems = isAdmin
    ? [...baseNavItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : baseNavItems;

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
