import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BarChart3,
  CalendarCheck,
  Flame,
  Heart,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCircle2,
  Watch,
  Zap,
} from "lucide-react";
import { format, eachDayOfInterval, endOfWeek, isSameDay, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAchievements } from "@/hooks/useAchievements";
import { useProfile } from "@/hooks/useProfile";
import { fetchWearableSummary, type WearableNotification } from "@/hooks/useWearables";
import { fetchCardioWorkouts, fetchStrengthWorkouts, type CardioWorkoutApi, type StrengthWorkoutApi } from "@/lib/workoutApi";
import { cn } from "@/lib/utils";

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return heightM > 0 ? weightKg / (heightM * heightM) : 0;
}

function clampPercentage(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function getWorkoutDate(workout: WorkoutEntry) {
  return parseISO(workout.date);
}

function sumCalories(workouts: WorkoutEntry[]) {
  return workouts.reduce((sum, workout) => sum + (workout.calories ?? 0), 0);
}

function sumMinutes(workouts: WorkoutEntry[]) {
  return workouts.reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0);
}

function countUniqueWorkoutDays(workouts: WorkoutEntry[]) {
  return new Set(workouts.map((workout) => workout.date.slice(0, 10))).size;
}

function getTrendLabel(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? "novo" : undefined;
  }

  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "0%";
  return `${change > 0 ? "+" : ""}${change}%`;
}

function getInitials(name?: string | null): string {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PA"
  );
}

function getBmiLabel(bmi: number) {
  if (!bmi) return "atualize seu perfil";
  if (bmi < 18.5) return "abaixo do ideal";
  if (bmi < 25) return "faixa equilibrada";
  if (bmi < 30) return "atenção leve";
  return "acompanhe de perto";
}

function CircularProgress({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const percentage = clampPercentage(value);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-foreground">
          {Math.round(percentage)}%
        </div>
      </div>
      <p className="text-lg text-muted-foreground">{label}</p>
    </div>
  );
}

function TopMetricCard({
  icon: Icon,
  title,
  value,
  helper,
  highlight = false,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] px-5 py-6 shadow-elegant md:px-6",
        highlight
          ? "gold-highlight"
          : "border border-white/5 bg-[hsl(var(--card))] text-foreground"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={cn("text-base", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight md:text-[2.2rem]">{value}</p>
          <p className={cn("text-sm", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {helper}
          </p>
        </div>
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-3xl",
            highlight
              ? "bg-[hsl(var(--primary-foreground)/0.16)] text-primary-foreground"
              : "bg-[hsl(var(--secondary))] text-primary"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  title,
  value,
  helper,
  progress,
  trend,
}: {
  title: string;
  value: string;
  helper: string;
  progress: number;
  trend?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[hsl(var(--secondary))] text-primary">
          <Target className="h-5 w-5" />
        </div>
        {trend ? (
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span>{trend}</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-lg text-muted-foreground">{title}</p>
        <p className="text-4xl font-semibold tracking-tight">{value}</p>
        <p className="text-base text-muted-foreground">{helper}</p>
      </div>

      <Progress value={clampPercentage(progress)} className="mt-6 h-2.5 bg-[hsl(var(--muted))] [&>div]:bg-primary" />
    </div>
  );
}

function RecommendationCard({
  label,
  title,
  description,
  to,
  className,
  imagePosition,
}: {
  label: string;
  title: string;
  description: string;
  to: string;
  className: string;
  imagePosition?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white/5 p-5 shadow-elegant",
        className
      )}
    >
      {imagePosition ? (
        <div
          className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundImage: "url('/images/workout-examples-ai.jpg')",
            backgroundPosition: imagePosition,
            backgroundSize: "205% auto",
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="w-fit rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
          {label}
        </span>

        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-white transition-transform duration-200 group-hover:translate-y-[-2px]">
            {title}
          </h3>
          <p className="max-w-xs text-sm leading-relaxed text-white/75">{description}</p>
        </div>
      </div>
    </Link>
  );
}

interface DashboardData {
  weeklyMinutes: number[];
  weeklyWorkoutCounts: number[];
  todayWorkouts: number;
  todayMinutes: number;
  monthlyCalories: number;
  monthlyWorkouts: number;
  monthlyMinutes: number;
  weeklyCalories: number;
  weeklyWorkouts: number;
  weeklyWorkoutDays: number;
  previousWeekCalories: number;
  previousWeekWorkouts: number;
}

const initialDashboardData: DashboardData = {
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  weeklyWorkoutCounts: [0, 0, 0, 0, 0, 0, 0],
  todayWorkouts: 0,
  todayMinutes: 0,
  monthlyCalories: 0,
  monthlyWorkouts: 0,
  monthlyMinutes: 0,
  weeklyCalories: 0,
  weeklyWorkouts: 0,
  weeklyWorkoutDays: 0,
  previousWeekCalories: 0,
  previousWeekWorkouts: 0,
};

type WorkoutEntry = StrengthWorkoutApi | CardioWorkoutApi;

const searchItems = [
  { label: "Perfil", description: "Dados pessoais e avatar", to: "/profile", icon: UserCircle2 },
  { label: "Configurações", description: "Editar cadastro e medidas", to: "/settings", icon: UserCircle2 },
  { label: "Treinos", description: "Registrar uma nova atividade", to: "/workouts", icon: Zap },
  { label: "Histórico de treinos", description: "Ver treinos registrados", to: "/workouts/history", icon: BarChart3 },
  { label: "Estatísticas", description: "Relatórios e evolução", to: "/workouts/dashboard", icon: BarChart3 },
  { label: "Relógio", description: "Conectar wearable e gerar ficha vital", to: "/wearables", icon: Watch },
  { label: "Conquistas", description: "Badges desbloqueados", to: "/premium", icon: Trophy },
  { label: "Agendamentos", description: "Consultas e bioimpedância", to: "/appointments", icon: CalendarCheck },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { achievements, userAchievements } = useAchievements();
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  const [wearableNotifications, setWearableNotifications] = useState<WearableNotification[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        const [strengthWorkouts, cardioWorkouts] = await Promise.all([
          fetchStrengthWorkouts(),
          fetchCardioWorkouts(),
        ]);

        if (!active) return;

        const combined = [...strengthWorkouts, ...cardioWorkouts];
        const now = new Date();
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const previousWeekStart = new Date(weekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        const previousWeekEnd = new Date(weekEnd);
        previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
        const monthStart = startOfMonth(now);
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const todayWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return workoutDate >= dayStart && workoutDate <= dayEnd;
        });
        const weekWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        const previousWeekWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return workoutDate >= previousWeekStart && workoutDate <= previousWeekEnd;
        });
        const monthWorkouts = combined.filter((workout) => getWorkoutDate(workout) >= monthStart);

        const weeklyMinutes = weekDays.map((day) =>
          combined
            .filter((workout) => isSameDay(getWorkoutDate(workout), day))
            .reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0)
        );
        const weeklyWorkoutCounts = weekDays.map((day) =>
          combined.filter((workout) => isSameDay(getWorkoutDate(workout), day)).length
        );

        setDashboardData({
          weeklyMinutes,
          weeklyWorkoutCounts,
          todayWorkouts: todayWorkouts.length,
          todayMinutes: sumMinutes(todayWorkouts),
          monthlyCalories: sumCalories(monthWorkouts),
          monthlyWorkouts: monthWorkouts.length,
          monthlyMinutes: sumMinutes(monthWorkouts),
          weeklyCalories: sumCalories(weekWorkouts),
          weeklyWorkouts: weekWorkouts.length,
          weeklyWorkoutDays: countUniqueWorkoutDays(weekWorkouts),
          previousWeekCalories: sumCalories(previousWeekWorkouts),
          previousWeekWorkouts: previousWeekWorkouts.length,
        });
      } catch {
        if (active) {
          setDashboardData(initialDashboardData);
        }
      }
    };

    loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadWearableNotifications = async () => {
      try {
        const summary = await fetchWearableSummary();
        if (!active) return;
        setWearableNotifications(summary.notifications.filter((notification) => !notification.is_read));
      } catch {
        if (active) {
          setWearableNotifications([]);
        }
      }
    };

    loadWearableNotifications();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Paciente";
  const fullName = profile?.full_name || "Paciente";
  const initials = getInitials(fullName);
  const bmi = profile ? calculateBMI(Number(profile.weight_kg), Number(profile.height_cm)) : 0;
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const maxDailyMinutes = Math.max(...dashboardData.weeklyMinutes, dashboardData.todayMinutes, 1);
  const maxDailyWorkouts = Math.max(...dashboardData.weeklyWorkoutCounts, dashboardData.todayWorkouts, 1);
  const todayMinuteProgress = clampPercentage((dashboardData.todayMinutes / maxDailyMinutes) * 100);
  const todayWorkoutProgress = clampPercentage((dashboardData.todayWorkouts / maxDailyWorkouts) * 100);
  const achievementProgress = achievements.length > 0
    ? clampPercentage((userAchievements.length / achievements.length) * 100)
    : 0;
  const weeklyDayProgress = clampPercentage((dashboardData.weeklyWorkoutDays / 7) * 100);
  const calorieTrend = getTrendLabel(dashboardData.weeklyCalories, dashboardData.previousWeekCalories);
  const workoutTrend = getTrendLabel(dashboardData.weeklyWorkouts, dashboardData.previousWeekWorkouts);
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const currentWeekDay = Math.max(0, Math.min(6, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const maxMinutes = Math.max(...dashboardData.weeklyMinutes, 1);
  const filteredSearchItems = searchItems.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${item.label} ${item.description}`.toLowerCase().includes(query);
  });
  const notifications = [
    dashboardData.weeklyWorkouts === 0
      ? {
          title: "Semana sem treinos",
          description: "Registre uma atividade para iniciar seu resumo.",
          to: "/workouts",
        }
      : null,
    dashboardData.todayWorkouts === 0
      ? {
          title: "Nenhum treino hoje",
          description: "Seu progresso diário ainda está zerado.",
          to: "/workouts",
        }
      : {
          title: "Progresso de hoje",
          description: `${dashboardData.todayWorkouts} treino(s) e ${formatNumber(dashboardData.todayMinutes)} min registrados.`,
          to: "/workouts/history",
        },
    bmi === 0
      ? {
          title: "Perfil incompleto",
          description: "Atualize peso e altura para calcular o IMC.",
          to: "/settings",
        }
      : null,
    achievements.length > 0 && userAchievements.length < achievements.length
      ? {
          title: "Conquistas pendentes",
          description: `${achievements.length - userAchievements.length} conquista(s) ainda bloqueadas.`,
          to: "/premium",
        }
      : null,
    ...wearableNotifications.slice(0, 3).map((notification) => ({
      title: notification.title,
      description: notification.message,
      to: "/wearables",
    })),
  ].filter(Boolean) as Array<{ title: string; description: string; to: string }>;
  const recommendationCards = [
    {
      label: "Cardio",
      title: "Corrida",
      description: "Treino intervalado para elevar o ritmo e ganhar folego.",
      to: "/workouts/cardio/corrida",
      className: "bg-[#151515]",
      imagePosition: "left top",
    },
    {
      label: "Musculação",
      title: "Academia",
      description: "Sessão focada em força, volume e constância semanal.",
      to: "/workouts/musculacao/academia",
      className: "bg-[#151515]",
      imagePosition: "right top",
    },
    {
      label: "Flexibilidade",
      title: "Mobilidade",
      description: "Abra espaço para recuperação ativa e movimento com controle.",
      to: "/workouts/cardio/outras",
      className: "bg-[#151515]",
      imagePosition: "left bottom",
    },
    {
      label: "Bike",
      title: "Ciclismo",
      description: "Cardio controlado para resistência e gasto calórico sem impacto.",
      to: "/workouts/cardio/ciclismo",
      className: "bg-[#151515]",
      imagePosition: "right bottom",
    },
  ];

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#2a1035_0%,#31123f_100%)]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/5 bg-[rgba(50,17,67,0.96)] px-6 py-6 shadow-elegant md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bem-vindo(a),</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {firstName} <span className="inline-block">👋</span>
            </h1>
            <p className="text-sm capitalize text-muted-foreground">{todayLabel}</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/profile"
              className="hidden items-center gap-3 rounded-full border border-white/5 bg-[hsl(var(--secondary))] px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground md:flex"
              aria-label="Abrir perfil"
            >
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-[180px] truncate">{fullName}</span>
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Pesquisar"
            >
              <Search className="h-5 w-5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 ? (
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                ) : null}
              </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-white/10 bg-[hsl(var(--card))] p-2">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.title}
                      className="cursor-pointer items-start rounded-xl p-3"
                      onClick={() => navigate(notification.to)}
                    >
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{notification.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-muted-foreground">Tudo em dia por aqui.</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[hsl(var(--card))] p-5">
            <DialogHeader>
              <DialogTitle>Pesquisar</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar no app"
              className="border-white/10 bg-[hsl(var(--secondary))]"
            />
            <div className="grid gap-2">
              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      navigate(item.to);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/20 p-3 text-left transition-colors hover:bg-[hsl(var(--secondary))]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block truncate text-sm text-muted-foreground">{item.description}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/5 bg-background/20 p-4 text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <section className="grid gap-4 xl:grid-cols-4">
          <TopMetricCard
            icon={Flame}
            title="Calorias"
            value={formatNumber(dashboardData.monthlyCalories)}
            helper={`${formatNumber(dashboardData.monthlyMinutes)} min ativos neste mês`}
            highlight
          />
          <TopMetricCard
            icon={Zap}
            title="Treinos"
            value={String(dashboardData.monthlyWorkouts)}
            helper="registrados neste mês"
          />
          <TopMetricCard
            icon={Heart}
            title="IMC Atual"
            value={bmi ? bmi.toFixed(1) : "--"}
            helper={getBmiLabel(bmi)}
          />
          <TopMetricCard
            icon={Trophy}
            title="Conquistas"
            value={String(userAchievements.length)}
            helper={
              achievements.length > 0
                ? `${userAchievements.length} de ${achievements.length} desbloqueadas`
                : "catálogo em atualização"
            }
          />
        </section>

        <section className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                <Watch className="h-6 w-6" />
              </div>
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold">Relógio e ficha vital</h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Conecte Apple Health, Google Fit, Garmin ou Fitbit para acompanhar batimentos, sono e recuperação em uma ficha limpa.
                </p>
              </div>
            </div>
            <Link
              to="/wearables"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Conectar relógio
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_2fr]">
          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Progresso Diário</h2>
              <p className="text-base text-muted-foreground">Uma leitura rápida da sua rotina.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <CircularProgress value={todayMinuteProgress} label={`${formatNumber(dashboardData.todayMinutes)} min hoje`} />
              <CircularProgress value={todayWorkoutProgress} label={`${dashboardData.todayWorkouts} treinos hoje`} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Atividade Semanal</h2>
                <p className="text-base text-muted-foreground">Últimos 7 dias</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 rounded-full bg-primary" />
                <span>Minutos ativos</span>
              </div>
            </div>

            <div className="flex min-h-[230px] items-end justify-between gap-3 md:gap-6">
              {dashboardData.weeklyMinutes.map((minutes, index) => {
                const height = minutes > 0 ? Math.max(18, Math.round((minutes / maxMinutes) * 108)) : 0;
                const isCurrent = index === currentWeekDay;

                return (
                  <div key={weekDays[index]} className="flex flex-1 flex-col items-center gap-4">
                    <div
                      className={cn(
                        "w-full max-w-[42px] rounded-t-[1.6rem] transition-all duration-300",
                        minutes > 0 && isCurrent ? "gold-highlight" : "bg-[hsl(var(--secondary))]",
                        minutes === 0 ? "opacity-35" : ""
                      )}
                      style={{ height: `${height}px` }}
                    />
                    <div className="text-center">
                      <p className={cn("text-lg", isCurrent ? "text-primary" : "text-muted-foreground")}>
                        {weekDays[index]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Resumo da Semana</h2>
            <Link to="/workouts/dashboard" className="text-lg font-medium text-primary">
              Ver todas
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GoalCard
              title="Calorias Queimadas"
              value={formatNumber(dashboardData.weeklyCalories)}
              helper={`semana anterior: ${formatNumber(dashboardData.previousWeekCalories)} kcal`}
              progress={
                Math.max(dashboardData.weeklyCalories, dashboardData.previousWeekCalories) > 0
                  ? (dashboardData.weeklyCalories / Math.max(dashboardData.weeklyCalories, dashboardData.previousWeekCalories)) * 100
                  : 0
              }
              trend={calorieTrend}
            />
            <GoalCard
              title="Treinos Completados"
              value={String(dashboardData.weeklyWorkouts)}
              helper={`${dashboardData.weeklyWorkoutDays} de 7 dias com treino`}
              progress={weeklyDayProgress}
              trend={workoutTrend}
            />
            <GoalCard
              title="Conquistas Liberadas"
              value={String(userAchievements.length)}
              helper={achievements.length > 0 ? `de ${achievements.length} conquistas` : "catálogo em atualização"}
              progress={achievementProgress}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Treinos Recomendados</h2>
              <p className="text-base text-muted-foreground">Escolhas rápidas para manter seu ritmo.</p>
            </div>
            <Link to="/workouts" className="text-lg font-medium text-primary">
              Ver todos
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendationCards.map((card) => (
              <RecommendationCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/5 bg-[rgba(50,17,67,0.96)] p-6 shadow-elegant">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Painel pessoal Vitalissy
              </div>
              <h2 className="text-2xl font-semibold md:text-3xl">Seu acompanhamento em um só lugar</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                A dashboard agora destaca progresso, rotina semanal e acessos importantes em um layout mais elegante e direto.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link
                to="/workouts"
                className="rounded-[1.4rem] bg-[hsl(var(--secondary))] px-5 py-4 text-center text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                Abrir treinos
              </Link>
              <Link
                to="/workouts/history"
                className="rounded-[1.4rem] bg-[hsl(var(--secondary))] px-5 py-4 text-center text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                Histórico
              </Link>
              <Link
                to="/profile"
                className="rounded-[1.4rem] bg-primary px-5 py-4 text-center text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Meu perfil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
