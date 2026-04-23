import { NavLink, Outlet } from 'react-router-dom';
import { Activity, Calendar, Crown, Home, Settings, User } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

const patientNavItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/workouts', icon: Activity, label: 'Treinos' },
  { to: '/appointments', icon: Calendar, label: 'Consultas' },
  { to: '/profile', icon: User, label: 'Perfil' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function AppLayout() {
  const { profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const firstName = profile?.full_name?.split(' ')[0] || 'Paciente';
  const initials = profile?.full_name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PA';

  const navItems = isAdmin
    ? [...patientNavItems, { to: '/admin', icon: Crown, label: 'Admin' }]
    : patientNavItems;

  return (
    <div className="app-container">
      <aside className="glass-panel hidden w-[292px] shrink-0 border-r border-border md:flex md:flex-col md:justify-between md:p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Vitalissy</p>
              <p className="text-sm text-muted-foreground">Saude e performance</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-3xl border border-border bg-background/40 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{firstName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {profile?.is_premium ? 'Plano Premium' : 'Plano Essencial'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-content hide-scrollbar pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
