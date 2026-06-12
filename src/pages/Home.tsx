import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUp,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Lock,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAchievements } from "@/hooks/useAchievements";
import { useProfile } from "@/hooks/useProfile";
import { fetchCardioWorkouts, fetchStrengthWorkouts, type CardioWorkoutApi, type StrengthWorkoutApi } from "@/lib/workoutApi";
import { cn } from "@/lib/utils";

type WorkoutEntry = StrengthWorkoutApi | CardioWorkoutApi;

interface DashboardData {
  weeklyMinutes: number[];
  weeklyWorkoutCounts: number[];
  todayWorkouts: number;
  todayMinutes: number;
  weeklyCalories: number;
  weeklyWorkouts: number;
  weeklyWorkoutDays: number;
  previousWeekWorkouts: number;
}

const initialDashboardData: DashboardData = {
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  weeklyWorkoutCounts: [0, 0, 0, 0, 0, 0, 0],
  todayWorkouts: 0,
  todayMinutes: 0,
  weeklyCalories: 0,
  weeklyWorkouts: 0,
  weeklyWorkoutDays: 0,
  previousWeekWorkouts: 0,
};

const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getWorkoutDate(workout: WorkoutEntry) {
  return parseISO(workout.date);
}

function isWorkoutOnDay(workout: WorkoutEntry, day: Date) {
  const workoutDate = getWorkoutDate(workout);
  return !Number.isNaN(workoutDate.getTime()) && isSameDay(workoutDate, day);
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

function clampPercentage(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatMinutesCompact(minutes: number) {
  const roundedMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(roundedMinutes / 60);
  const remainder = roundedMinutes % 60;

  if (hours === 0) return `${remainder}min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h${String(remainder).padStart(2, "0")}`;
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

function formatHomeDate(date: Date) {
  const formatted = format(date, "EEEE '·' d MMM yyyy", { locale: ptBR }).replace(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatUnlockedAt(value?: string) {
  if (!value) return "Continue treinando";

  const unlockedAt = parseISO(value);
  if (Number.isNaN(unlockedAt.getTime())) return "Conquista desbloqueada";

  const days = differenceInCalendarDays(new Date(), unlockedAt);
  if (days <= 0) return "Desbloqueada hoje";
  if (days === 1) return "Desbloqueada há 1 dia";
  return `Desbloqueada há ${days} dias`;
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/10 bg-card px-3 py-4 text-center shadow-elegant">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-2 truncate text-lg font-extrabold leading-none text-primary">{value}</p>
      <p className="mt-2 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </h2>
  );
}

function PeriodOption({
  icon: Icon,
  label,
  active,
  premium,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  premium?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={premium}
      onClick={onSelect}
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-white/10 bg-secondary/80 hover:border-primary/40",
        premium ? "cursor-default hover:border-white/10" : ""
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-bold text-foreground">{label}</span>
      </span>

      {active ? (
        <Check className="h-4 w-4 text-primary" />
      ) : premium ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
          <Lock className="h-3 w-3" />
          Premium
        </span>
      ) : null}
    </button>
  );
}

export default function Home() {
  const { profile, loading } = useProfile();
  const { latestAchievement } = useAchievements();
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  const [periodOpen, setPeriodOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

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
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const todayWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return !Number.isNaN(workoutDate.getTime()) && workoutDate >= dayStart && workoutDate <= dayEnd;
        });
        const weekWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return !Number.isNaN(workoutDate.getTime()) && workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        const previousWeekWorkouts = combined.filter((workout) => {
          const workoutDate = getWorkoutDate(workout);
          return !Number.isNaN(workoutDate.getTime()) && workoutDate >= previousWeekStart && workoutDate <= previousWeekEnd;
        });

        const weeklyMinutes = weekDays.map((day) =>
          combined
            .filter((workout) => isWorkoutOnDay(workout, day))
            .reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0)
        );
        const weeklyWorkoutCounts = weekDays.map((day) =>
          combined.filter((workout) => isWorkoutOnDay(workout, day)).length
        );

        setDashboardData({
          weeklyMinutes,
          weeklyWorkoutCounts,
          todayWorkouts: todayWorkouts.length,
          todayMinutes: sumMinutes(todayWorkouts),
          weeklyCalories: sumCalories(weekWorkouts),
          weeklyWorkouts: weekWorkouts.length,
          weeklyWorkoutDays: countUniqueWorkoutDays(weekWorkouts),
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
  const totalWeeklyMinutes = dashboardData.weeklyMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const currentWeekDay = Math.max(0, Math.min(6, today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weeklyChartValues = dashboardData.weeklyMinutes.map((minutes, index) =>
    minutes > 0 ? minutes : dashboardData.weeklyWorkoutCounts[index] > 0 ? 25 : 0
  );
  const maxChartValue = Math.max(...weeklyChartValues, 1);
  const weeklyGoalDays = 5;
  const weeklyGoalProgress = clampPercentage((dashboardData.weeklyWorkoutDays / weeklyGoalDays) * 100);
  const weeklyDelta = dashboardData.weeklyWorkouts - dashboardData.previousWeekWorkouts;
  const weeklyPillLabel = weeklyDelta > 0
    ? `+${weeklyDelta} ${weeklyDelta === 1 ? "treino" : "treinos"} esta semana`
    : dashboardData.weeklyWorkouts > 0
      ? `${dashboardData.weeklyWorkouts} ${dashboardData.weeklyWorkouts === 1 ? "treino" : "treinos"} esta semana`
      : "Comece sua semana";
  const hasWorkoutToday = dashboardData.todayWorkouts > 0;
  const latestAchievementTitle = latestAchievement?.achievement.name || "Semana perfeita";
  const latestAchievementDescription = latestAchievement?.achievement.description || "7 dias seguidos de treino registrado";

  return (
    <div className="min-h-full bg-[hsl(var(--background))]">
      <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col gap-4 px-5 pb-28 pt-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Vitalissy</p>
            <h1 className="mt-1 truncate text-[21px] font-extrabold leading-tight text-foreground">
              Olá, {firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{formatHomeDate(today)}</p>
          </div>

          <Link to="/profile" aria-label="Abrir perfil" className="shrink-0">
            <Avatar className="h-11 w-11 border border-primary/30 shadow-glow">
              <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-gradient-primary text-sm font-extrabold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[1.35rem] bg-gradient-primary px-5 py-5 text-primary-foreground shadow-glow">
          <div className="relative">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary-foreground/75">
                Semana ativa
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[42px] font-black leading-none tracking-tight">
                  {dashboardData.weeklyWorkoutDays}
                </span>
                <span className="text-base font-bold text-primary-foreground/80">/ 7 dias</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 py-1 pl-1 pr-3 text-[11px] font-extrabold">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                  <ArrowUp className="h-3 w-3" />
                </span>
                {weeklyPillLabel}
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-2">
              {weekDayLabels.map((day, index) => {
                const hasWorkout = dashboardData.weeklyWorkoutCounts[index] > 0;
                const isToday = index === currentWeekDay;
                const height = hasWorkout
                  ? Math.max(12, Math.round((weeklyChartValues[index] / maxChartValue) * 36))
                  : 4;

                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-9 w-full items-end justify-center">
                      <span
                        className={cn(
                          "block w-[72%] max-w-8 rounded-t-[4px]",
                          hasWorkout ? "bg-primary-foreground/40" : "rounded-full bg-primary-foreground/15",
                          hasWorkout && isToday ? "bg-primary-foreground" : ""
                        )}
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold",
                        isToday ? "text-primary-foreground" : "text-primary-foreground/70"
                      )}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15">
              <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${weeklyGoalProgress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-primary-foreground/75">
              <span>Meta: {weeklyGoalDays} dias / semana</span>
              <span>{Math.min(dashboardData.weeklyWorkoutDays, weeklyGoalDays)} de {weeklyGoalDays} completos</span>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-secondary px-4 text-xs font-bold text-primary"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Esta semana
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <section className="grid grid-cols-3 gap-3">
          <StatCard icon={Flame} value={formatNumber(dashboardData.weeklyCalories)} label="Kcal queimadas" />
          <StatCard icon={Clock3} value={formatMinutesCompact(totalWeeklyMinutes)} label="Tempo de treino" />
          <StatCard icon={Activity} value={formatNumber(dashboardData.weeklyWorkouts)} label="Atividades" />
        </section>

        <section className="space-y-3">
          <SectionLabel>Treino do dia</SectionLabel>
          <Link
            to={hasWorkoutToday ? "/workouts/history" : "/workouts"}
            className="block overflow-hidden rounded-[1.15rem] border border-white/10 bg-card shadow-elegant transition-transform hover:-translate-y-0.5"
          >
            <div className="relative flex h-20 items-center justify-center overflow-hidden bg-[hsl(var(--background-strong))]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: "url('/images/workout-examples-ai.jpg')" }}
              />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,hsl(var(--primary)/0.04)_10px,hsl(var(--primary)/0.04)_20px)]" />
              <Dumbbell className="relative h-9 w-9 text-primary/25" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
                <Zap className="h-3 w-3 fill-primary" />
                Sugerido para hoje
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-extrabold text-foreground">
                  {hasWorkoutToday ? "Treino registrado hoje" : "Peito & Tríceps - Hipertrofia"}
                </h3>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3 text-primary" />
                    {hasWorkoutToday ? formatMinutesCompact(dashboardData.todayMinutes) : "50 min"}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Users className="h-3 w-3 shrink-0 text-primary" />
                    <span className="truncate">Plano Vitalissy</span>
                  </span>
                </div>
              </div>
              <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground">
                {hasWorkoutToday ? "Ver" : "Iniciar"}
              </span>
            </div>
          </Link>
        </section>

        <section className="space-y-3">
          <SectionLabel>Sua última conquista</SectionLabel>
          <Link
            to="/premium"
            className="flex items-center gap-4 rounded-[1.15rem] border border-primary bg-card px-4 py-4 shadow-elegant transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
              <Trophy className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {formatUnlockedAt(latestAchievement?.unlocked_at)}
              </span>
              <span className="mt-1 block truncate text-sm font-extrabold text-foreground">
                {latestAchievementTitle}
              </span>
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                {latestAchievementDescription}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/45" />
          </Link>
        </section>
      </div>

      <Drawer open={periodOpen} onOpenChange={setPeriodOpen}>
        <DrawerContent className="mx-auto max-w-[430px] rounded-t-[1.5rem] border border-white/10 bg-[hsl(var(--background))] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-0 text-foreground [&>div:first-child]:mt-5 [&>div:first-child]:h-1 [&>div:first-child]:w-10 [&>div:first-child]:bg-secondary">
          <DrawerHeader className="px-0 pb-2 pt-5 text-left">
            <DrawerTitle className="text-base font-extrabold">Selecionar período</DrawerTitle>
          </DrawerHeader>

          <div className="grid gap-2">
            <PeriodOption
              icon={CalendarDays}
              label="Esta semana"
              active
              onSelect={() => setPeriodOpen(false)}
            />
            <PeriodOption icon={CalendarRange} label="Este mês" premium />
            <PeriodOption icon={Calendar} label="Este ano" premium />
            <PeriodOption icon={CalendarClock} label="Período personalizado" premium />
          </div>

          <Link
            to="/premium"
            onClick={() => setPeriodOpen(false)}
            className="mt-4 block rounded-[1rem] bg-gradient-primary px-4 py-4 text-center text-primary-foreground shadow-glow"
          >
            <span className="block text-sm font-black">Desbloquear Premium</span>
            <span className="mt-1 block text-xs text-primary-foreground/75">
              Veja sua evolução completa por qualquer período
            </span>
          </Link>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
