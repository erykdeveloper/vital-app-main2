import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  PersonStanding,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutAnimation, type WorkoutAnimationVariant } from "@/components/workouts/WorkoutAnimation";
import { cn } from "@/lib/utils";

interface PopularWorkout {
  id: string;
  category: string;
  icon: React.ElementType;
  title: string;
  label: string;
  level: string;
  duration: string;
  calories: string;
  summary: string;
  animation: WorkoutAnimationVariant;
  logTo: string;
  steps: string[];
}

const filters = [
  { value: "todos", label: "Todos" },
  { value: "academia", label: "Academia" },
  { value: "corrida", label: "Corrida" },
  { value: "casa", label: "Em casa" },
  { value: "hiit", label: "HIIT" },
  { value: "bike", label: "Bike" },
];

const popularWorkouts: PopularWorkout[] = [
  {
    id: "corrida-intervalada",
    category: "corrida",
    icon: Footprints,
    title: "Corrida intervalada leve",
    label: "Cardio",
    level: "Iniciante",
    duration: "24 min",
    calories: "180 kcal",
    summary: "Alterna caminhada e corrida para melhorar ritmo sem exagerar na carga.",
    animation: "running",
    logTo: "/workouts/cardio/corrida",
    steps: ["5 min caminhada rápida", "8x 1 min corrida + 90s caminhada", "4 min desaquecimento"],
  },
  {
    id: "academia-full-body",
    category: "academia",
    icon: Dumbbell,
    title: "Full body na academia",
    label: "Força",
    level: "Intermediário",
    duration: "45 min",
    calories: "260 kcal",
    summary: "Base completa com movimentos grandes para peito, costas, pernas e core.",
    animation: "strength",
    logTo: "/workouts/musculacao/academia",
    steps: ["Agachamento 3x10", "Supino 3x10", "Remada 3x12", "Prancha 3x30s"],
  },
  {
    id: "casa-sem-equipamento",
    category: "casa",
    icon: Home,
    title: "Treino em casa sem equipamento",
    label: "Funcional",
    level: "Iniciante",
    duration: "28 min",
    calories: "170 kcal",
    summary: "Sequência simples para manter constância usando apenas peso corporal.",
    animation: "home",
    logTo: "/workouts/musculacao/em-casa",
    steps: ["Polichinelo 3x40s", "Agachamento 3x15", "Flexão adaptada 3x8", "Abdominal 3x15"],
  },
  {
    id: "hiit-baixo-impacto",
    category: "hiit",
    icon: Zap,
    title: "HIIT baixo impacto",
    label: "Intenso",
    level: "Intermediário",
    duration: "18 min",
    calories: "210 kcal",
    summary: "Blocos curtos para elevar frequência cardíaca preservando articulações.",
    animation: "hiit",
    logTo: "/workouts/cardio/hiit",
    steps: ["30s marcha forte", "30s agachamento", "30s socos alternados", "30s descanso por 4 rounds"],
  },
  {
    id: "bike-resistencia",
    category: "bike",
    icon: Bike,
    title: "Bike de resistência",
    label: "Cardio",
    level: "Todos",
    duration: "35 min",
    calories: "240 kcal",
    summary: "Pedalada contínua com variação de carga para ganhar resistência.",
    animation: "bike",
    logTo: "/workouts/cardio/ciclismo",
    steps: ["7 min aquecimento", "20 min ritmo moderado", "5 min carga alta", "3 min leve"],
  },
  {
    id: "calistenia-base",
    category: "academia",
    icon: PersonStanding,
    title: "Calistenia base",
    label: "Controle",
    level: "Iniciante",
    duration: "32 min",
    calories: "190 kcal",
    summary: "Exemplo focado em domínio corporal, postura e progressão segura.",
    animation: "calisthenics",
    logTo: "/workouts/musculacao/calistenia",
    steps: ["Mobilidade 5 min", "Flexão 4x6", "Remada australiana 4x8", "Prancha lateral 3x25s"],
  },
];

function PopularWorkoutCard({ workout }: { workout: PopularWorkout }) {
  const Icon = workout.icon;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/5 bg-card/85 shadow-elegant">
      <div className="p-3">
        <WorkoutAnimation
          variant={workout.animation}
          title={workout.title}
          label={workout.label}
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">{workout.title}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{workout.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-secondary/55 p-3">
            <Target className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">nível</p>
            <p className="text-sm font-semibold">{workout.level}</p>
          </div>
          <div className="rounded-2xl bg-secondary/55 p-3">
            <Clock className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">tempo</p>
            <p className="text-sm font-semibold">{workout.duration}</p>
          </div>
          <div className="rounded-2xl bg-secondary/55 p-3">
            <Flame className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">gasto</p>
            <p className="text-sm font-semibold">{workout.calories}</p>
          </div>
        </div>

        <div className="space-y-2">
          {workout.steps.map((step) => (
            <div key={step} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          <Button asChild className="h-12 rounded-xl bg-gradient-primary font-bold text-primary-foreground shadow-glow">
            <Link to={workout.logTo}>Registrar no caderno</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function PopularWorkouts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("categoria") || "todos";

  const visibleWorkouts = useMemo(() => {
    if (activeFilter === "todos") return popularWorkouts;
    return popularWorkouts.filter((workout) => workout.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background-strong))_100%)]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="grid h-14 grid-cols-[44px_1fr_44px] items-center md:hidden">
          <Link
            to="/workouts"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-center text-lg font-bold">Treinos populares</h1>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/5 bg-card/90 shadow-elegant">
          <div className="relative p-6 md:p-7">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: "url('/images/workout-examples-ai.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/35 via-background/80 to-background" />
            <div className="relative max-w-3xl space-y-4">
              <Link
                to="/workouts"
                className="hidden h-11 w-11 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Inspiração e exemplos
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-normal md:text-5xl">Treinos populares</h1>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Veja ideias de treino com vídeos animados internos e depois registre sua execução no Caderno.
              </p>
            </div>
          </div>
        </section>

        <section className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSearchParams(filter.value === "todos" ? {} : { categoria: filter.value })}
              className={cn(
                "h-10 shrink-0 rounded-xl border px-5 text-sm font-medium transition-colors",
                activeFilter === filter.value
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-white/5 bg-card/75 text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {visibleWorkouts.map((workout) => (
            <PopularWorkoutCard key={workout.id} workout={workout} />
          ))}
        </section>
      </div>
    </div>
  );
}
