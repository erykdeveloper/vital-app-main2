import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bike,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  History,
  Home,
  MoreHorizontal,
  PersonStanding,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WorkoutCategory {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  count: string;
  imagePosition: string;
  tint: string;
}

const workoutCategories: WorkoutCategory[] = [
  {
    to: '/workouts/musculacao/academia',
    icon: Dumbbell,
    label: 'Academia',
    description: 'Força, máquinas e pesos livres.',
    count: '24 programas',
    imagePosition: 'left top',
    tint: 'bg-primary/12',
  },
  {
    to: '/workouts/cardio/corrida',
    icon: Footprints,
    label: 'Corrida',
    description: 'Ritmo, distância e gasto calórico.',
    count: '20 treinos',
    imagePosition: 'center top',
    tint: 'bg-[#ffefc8]/12',
  },
  {
    to: '/workouts/musculacao/em-casa',
    icon: Home,
    label: 'Em casa',
    description: 'Sessões rápidas sem sair da rotina.',
    count: '18 treinos',
    imagePosition: 'right top',
    tint: 'bg-emerald-300/10',
  },
  {
    to: '/workouts/musculacao/crossfit',
    icon: Flame,
    label: 'CrossFit',
    description: 'Intensidade, potência e resistência.',
    count: '16 treinos',
    imagePosition: 'left center',
    tint: 'bg-rose-300/10',
  },
  {
    to: '/workouts/musculacao/calistenia',
    icon: PersonStanding,
    label: 'Calistenia',
    description: 'Controle corporal e progressão.',
    count: '15 treinos',
    imagePosition: 'center center',
    tint: 'bg-sky-300/10',
  },
  {
    to: '/workouts/cardio/hiit',
    icon: Zap,
    label: 'HIIT',
    description: 'Intervalos intensos e objetivos.',
    count: '24 treinos',
    imagePosition: 'right center',
    tint: 'bg-primary/10',
  },
  {
    to: '/workouts/cardio/ciclismo',
    icon: Bike,
    label: 'Ciclismo',
    description: 'Resistência com baixo impacto.',
    count: '12 treinos',
    imagePosition: 'left bottom',
    tint: 'bg-teal-300/10',
  },
  {
    to: '/workouts/cardio/outras',
    icon: MoreHorizontal,
    label: 'Outras',
    description: 'Registre qualquer cardio.',
    count: 'livre',
    imagePosition: 'right bottom',
    tint: 'bg-white/5',
  },
];

const levels = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];

function CategoryCard({ category, compact = false }: { category: WorkoutCategory; compact?: boolean }) {
  const Icon = category.icon;

  return (
    <Link
      to={category.to}
      className={cn(
        'group relative isolate overflow-hidden rounded-[1.25rem] border border-white/5 shadow-elegant transition-all hover:-translate-y-0.5 hover:border-primary/25',
        compact ? 'min-h-[188px]' : 'min-h-[138px]',
        category.tint,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-55 transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: "url('/images/workout-examples-ai.jpg')",
          backgroundPosition: category.imagePosition,
          backgroundSize: compact ? '245% auto' : '190% auto',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-card/95 via-card/70 to-background/10" />
      <div className={cn('relative flex h-full flex-col', compact ? 'items-center p-4 text-center' : 'justify-center p-5')}>
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-primary backdrop-blur">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className={cn('font-bold leading-tight', compact ? 'text-lg' : 'text-2xl')}>{category.label}</h3>
        <p className="mt-1 text-sm font-medium text-primary">{category.count}</p>
        {!compact ? <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-muted-foreground">{category.description}</p> : null}
      </div>
    </Link>
  );
}

export default function Workouts() {
  const [query, setQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState(levels[0]);

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return workoutCategories;

    return workoutCategories.filter((category) =>
      `${category.label} ${category.description} ${category.count}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background-strong))_100%)]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="grid h-14 grid-cols-[44px_1fr_44px] items-center md:hidden">
          <Link
            to="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-center text-lg font-bold">Categorias</h1>
        </header>

        <section className="hidden rounded-[2rem] border border-white/5 bg-card/90 p-6 shadow-elegant md:block">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <Link
                to="/"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Caderno de treinos
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-normal md:text-5xl">Categorias</h1>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Escolha o tipo de treino, registre sua sessão e mantenha a evolução organizada.
              </p>
            </div>
            <div className="grid min-w-[340px] grid-cols-2 gap-3">
              <Link to="/workouts/history" className="rounded-2xl bg-secondary/80 p-4 transition-colors hover:bg-secondary">
                <History className="mb-4 h-6 w-6 text-primary" />
                <span className="block font-semibold">Histórico</span>
                <span className="text-sm text-muted-foreground">Treinos salvos</span>
              </Link>
              <Link to="/workouts/dashboard" className="rounded-2xl bg-secondary/80 p-4 transition-colors hover:bg-secondary">
                <BarChart3 className="mb-4 h-6 w-6 text-primary" />
                <span className="block font-semibold">Premium</span>
                <span className="text-sm text-muted-foreground">Estatísticas</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar treino"
              className="h-14 w-full rounded-2xl border border-white/5 bg-card/75 pl-12 pr-4 text-base text-foreground outline-none shadow-elegant placeholder:text-muted-foreground focus:border-primary/30"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveLevel(level)}
                className={cn(
                  'h-10 shrink-0 rounded-xl border px-5 text-sm font-medium transition-colors',
                  activeLevel === level
                    ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                    : 'border-white/5 bg-card/75 text-muted-foreground hover:text-foreground',
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {visibleCategories.length > 0 ? (
            visibleCategories.map((category) => (
              <CategoryCard key={category.to} category={category} compact />
            ))
          ) : (
            <div className="col-span-2 rounded-2xl border border-white/5 bg-card/75 p-5 text-sm text-muted-foreground lg:col-span-4">
              Nenhuma categoria encontrada.
            </div>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <Link
            to="/workouts/history"
            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-card/85 p-4 shadow-elegant transition-colors hover:bg-secondary"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <History className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Ver histórico</span>
              <span className="block text-sm text-muted-foreground">Treinos realizados e registros salvos</span>
            </span>
          </Link>

          <Link
            to="/workouts/dashboard"
            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-card/85 p-4 shadow-elegant transition-colors hover:bg-secondary"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BarChart3 className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Estatísticas Premium</span>
              <span className="block text-sm text-muted-foreground">Gráficos, tendências e evolução</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground shadow-elegant">
            <Crown className="h-5 w-5 shrink-0 text-primary" />
            <span>Caderno gratuito. Estatísticas avançadas no Premium.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
