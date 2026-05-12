import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, BookOpen, Shield, Watch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useAdmin';

const baseNavItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/workouts', icon: BookOpen, label: 'Caderno' },
  { to: '/wearables', icon: Watch, label: 'Relógio' },
  { to: '/appointments', icon: Calendar, label: 'Consultas' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { data: isAdmin } = useIsAdmin();

  const navItems = isAdmin
    ? [...baseNavItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : baseNavItems;

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-background/70 px-3 pb-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-[72px] max-w-[430px] items-center justify-around rounded-[1.6rem] border border-white/5 bg-card/95 px-2 shadow-elegant">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-transparent'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
