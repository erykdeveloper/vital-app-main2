import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BarChart3,
  Bike,
  CalendarCheck,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCircle2,
  Watch,
  Zap,
} from "lucide-react";
import { differenceInCalendarDays, eachDayOfInterval, endOfWeek, format, isSameDay, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getBestWorkoutMonth(workouts: WorkoutEntry[]) {
  const monthCounts = new Map<string, { date: Date; count: number }>();

  workouts.forEach((workout) => {
    const workoutDate = getWorkoutDate(workout);
    if (Number.isNaN(workoutDate.getTime())) return;

    const monthDate = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), 1);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const current = monthCounts.get(key);
    monthCounts.set(key, {
      date: monthDate,
      count: (current?.count ?? 0) + 1,
    });
  });

  return Array.from(monthCounts.values()).reduce<{ date: Date; count: number } | null>((best, current) => {
    if (!best) return current;
    if (current.count > best.count) return current;
    if (current.count === best.count && current.date > best.date) return current;
    return best;
  }, null);
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
  duration = "30 min",
  calories = "125 kcal",
}: {
  label: string;
  title: string;
  description: string;
  to: string;
  className: string;
  imagePosition?: string;
  duration?: string;
  calories?: string;
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
          <div className="flex items-center gap-3 pt-1 text-xs font-medium text-white/80">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {calories}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickCategoryLink({
  to,
  icon: Icon,
  label,
  imagePosition,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  imagePosition: string;
}) {
  return (
    <Link to={to} className="group flex min-w-[72px] flex-col items-center gap-3 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/5 bg-secondary shadow-elegant">
        <span
          className="absolute inset-0 bg-cover bg-no-repeat opacity-45 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundImage: "url('/images/workout-examples-ai.jpg')",
            backgroundPosition: imagePosition,
            backgroundSize: "250% auto",
          }}
        />
        <span className="absolute inset-0 bg-background/45" />
        <Icon className="relative h-6 w-6 text-primary" />
      </span>
      <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {label}
      </span>
    </Link>
  );
}

function PracticeBanner() {
  return (
    <Link
      to="/workouts"
      className="group relative min-h-[164px] overflow-hidden rounded-[1.35rem] border border-primary/20 bg-primary/12 p-5 shadow-elegant"
    >
      <div
        className="absolute bottom-0 right-[-22px] top-0 w-[58%] bg-cover bg-no-repeat opacity-75 transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: "url('/images/workout-examples-ai.jpg')",
          backgroundPosition: "right top",
          backgroundSize: "245% auto",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/5" />
      <div className="relative flex max-w-[180px] flex-col items-start gap-3">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          Plano em destaque
        </span>
        <div>
          <h2 className="text-2xl font-bold leading-tight">Eleve sua prática</h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">6 semanas · 24 treinos</p>
        </div>
        <span className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">
          Começar
        </span>
      </div>
    </Link>
  );
}

function SectionTitle({
  title,
  actionLabel,
  to,
}: {
  title: string;
  actionLabel?: string;
  to?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      {actionLabel && to ? (
        <Link to={to} className="text-sm font-semibold text-primary md:text-base">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function DailySummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[1.35rem] border p-4 shadow-elegant",
        accent ? "border-primary/30 bg-primary/15" : "border-white/5 bg-card/85",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helper}</p>
    </div>
  );
}

function PlanItem({
  icon: Icon,
  title,
  detail,
  progress,
  to,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  progress: number;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-2xl border border-white/5 bg-background/30 p-3 transition-colors hover:bg-secondary/45"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold">{title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{Math.round(clampPercentage(progress))}%</span>
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
        <Progress value={clampPercentage(progress)} className="mt-2 h-1.5 bg-muted [&>div]:bg-primary" />
      </span>
    </Link>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  helper,
  to,
  featured = false,
}: {
  icon: React.ElementType;
  title: string;
  helper: string;
  to: string;
  featured?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-[1.35rem] border p-4 shadow-elegant transition-transform hover:-translate-y-0.5",
        featured ? "border-primary/30 bg-primary text-primary-foreground" : "border-white/5 bg-card/85",
      )}
    >
      <span
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
          featured ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className={cn("mt-1 text-xs leading-relaxed", featured ? "text-primary-foreground/75" : "text-muted-foreground")}>
        {helper}
      </p>
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
  daysSinceLastWorkout: number | null;
  bestMonthName: string | null;
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
  daysSinceLastWorkout: null,
  bestMonthName: null,
};

type WorkoutEntry = StrengthWorkoutApi | CardioWorkoutApi;

const searchItems = [
  { label: "Perfil", description: "Dados pessoais e avatar", to: "/profile", icon: UserCircle2 },
  { label: "Configurações", description: "Editar cadastro e medidas", to: "/settings", icon: UserCircle2 },
  { label: "Treinos", description: "Registrar uma nova atividade", to: "/workouts", icon: Zap },
  { label: "Treinos populares", description: "Vídeos da Weburn por categoria", to: "/workouts/popular", icon: PlayCircle },
  { label: "Histórico de treinos", description: "Ver treinos registrados", to: "/workouts/history", icon: BarChart3 },
  { label: "Estatísticas Premium", description: "Relatórios pagos e evolução", to: "/workouts/dashboard", icon: BarChart3 },
  { label: "Relógio", description: "Conectar wearable e gerar ficha vital", to: "/wearables", icon: Watch },
  { label: "Conquistas", description: "Badges desbloqueados", to: "/premium", icon: Trophy },
  { label: "Área Médica Vital", description: "Consultas, consultório e bioimpedância", to: "/appointments", icon: CalendarCheck },
];

const quickCategories = [
  { label: "Força", to: "/workouts/musculacao/academia", icon: Dumbbell, imagePosition: "left top" },
  { label: "Cardio", to: "/workouts/cardio/corrida", icon: Footprints, imagePosition: "center top" },
  { label: "HIIT", to: "/workouts/cardio/hiit", icon: Zap, imagePosition: "right center" },
  { label: "Bike", to: "/workouts/cardio/ciclismo", icon: Bike, imagePosition: "left bottom" },
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
        const latestWorkoutDate = combined.reduce<Date | null>((latest, workout) => {
          const workoutDate = getWorkoutDate(workout);
          if (Number.isNaN(workoutDate.getTime())) return latest;
          return !latest || workoutDate > latest ? workoutDate : latest;
        }, null);
        const bestMonth = getBestWorkoutMonth(combined);

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
          daysSinceLastWorkout: latestWorkoutDate ? differenceInCalendarDays(dayStart, latestWorkoutDate) : null,
          bestMonthName: bestMonth ? capitalize(format(bestMonth.date, "MMMM", { locale: ptBR })) : null,
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
  const inactivityMessage = dashboardData.daysSinceLastWorkout === null
    ? "Você ainda não registrou treino. Comece hoje para acompanhar sua evolução."
    : dashboardData.daysSinceLastWorkout > 0
      ? `Você está há ${dashboardData.daysSinceLastWorkout} ${dashboardData.daysSinceLastWorkout === 1 ? "dia" : "dias"} sem registrar treino.`
      : null;
  const bestMonthMessage = dashboardData.bestMonthName
    ? `Seu melhor mês foi ${dashboardData.bestMonthName}. Vamos superar?`
    : null;
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
      title: "HIIT e cardio",
      description: "Vídeos para elevar gasto calórico e ganhar fôlego.",
      to: "/workouts/popular?categoria=hiit-cardio",
      className: "bg-[#151515]",
      imagePosition: "left top",
    },
    {
      label: "Musculação",
      title: "Academia",
      description: "Execuções e movimentos para treino de força.",
      to: "/workouts/popular?categoria=academia",
      className: "bg-[#151515]",
      imagePosition: "right top",
    },
    {
      label: "Rotina",
      title: "Treino rápido",
      description: "Vídeos curtos para encaixar na agenda.",
      to: "/workouts/popular?categoria=treino-rapido",
      className: "bg-[#151515]",
      imagePosition: "left bottom",
    },
    {
      label: "Saúde",
      title: "Medicina esportiva",
      description: "Conteúdos sobre performance e cuidado com o corpo.",
      to: "/workouts/popular?categoria=medicina-esportiva",
      className: "bg-[#151515]",
      imagePosition: "right bottom",
    },
  ];
  const dailyPlanProgress = clampPercentage(
    (dashboardData.todayWorkouts > 0 ? 38 : 12) +
      todayMinuteProgress * 0.35 +
      weeklyDayProgress * 0.25 +
      (bmi > 0 ? 10 : 0),
  );
  const primaryNotification = notifications[0];

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#17071f_0%,#2f123d_48%,#1b0925_100%)]">
      <div className="mx-auto flex w-full max-w-[1260px] flex-col gap-5 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">App Vital</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight md:text-4xl">Olá, {firstName}</h1>
            <p className="text-sm text-muted-foreground md:text-base">Saúde, treino e evolução no mesmo lugar.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-card/85 text-muted-foreground shadow-elegant transition-colors hover:text-foreground"
              aria-label="Pesquisar"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to="/notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-card/85 text-muted-foreground shadow-elegant transition-colors hover:text-foreground"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 ? (
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-primary" />
              ) : null}
            </Link>

            <Link to="/profile" className="hidden md:block" aria-label="Abrir perfil">
              <Avatar className="h-11 w-11 border border-white/10 shadow-elegant">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Link>
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

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/90 p-5 shadow-elegant md:p-6">
            <div
              className="absolute inset-y-0 right-0 hidden w-[46%] bg-cover bg-center opacity-70 md:block"
              style={{ backgroundImage: "url('/images/workout-examples-ai.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/20" />
            <div className="relative grid gap-5 md:grid-cols-[1fr_172px] md:items-center">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-primary">Resultados</p>
                  <h2 className="mt-1 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                    Seu progresso em foco.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Veja primeiro o que já aconteceu hoje e nesta semana. O plano fica mais abaixo para orientar o próximo passo.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <DailySummaryCard
                    icon={Clock}
                    label="Hoje"
                    value={`${formatNumber(dashboardData.todayMinutes)}m`}
                    helper={`${dashboardData.todayWorkouts} treino(s)`}
                    accent
                  />
                  <DailySummaryCard
                    icon={Flame}
                    label="Kcal"
                    value={formatNumber(dashboardData.weeklyCalories)}
                    helper="na semana"
                  />
                  <DailySummaryCard
                    icon={Footprints}
                    label="Semana"
                    value={`${dashboardData.weeklyWorkoutDays}/7`}
                    helper="dias ativos"
                  />
                </div>
              </div>

              <div className="mx-auto">
                <CircularProgress value={weeklyDayProgress} label="semana ativa" />
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <Link
              to={primaryNotification?.to || "/workouts"}
              className="rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Próximo passo
                </span>
              </div>
              <h3 className="text-xl font-semibold">{primaryNotification?.title || "Continue sua rotina"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {primaryNotification?.description || "Abra seus treinos para atualizar o resumo do dia."}
              </p>
            </Link>

            <div className="grid grid-cols-3 gap-3">
              <DailySummaryCard
                icon={Flame}
                label="Kcal"
                value={formatNumber(dashboardData.weeklyCalories)}
                helper="na semana"
                accent
              />
              <DailySummaryCard
                icon={Zap}
                label="Treinos"
                value={String(dashboardData.weeklyWorkouts)}
                helper="na semana"
              />
              <DailySummaryCard
                icon={Heart}
                label="IMC"
                value={bmi ? bmi.toFixed(1) : "--"}
                helper={getBmiLabel(bmi)}
              />
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Acessos principais" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ShortcutCard icon={Dumbbell} title="Treinos" helper="Registrar prática" to="/workouts" featured />
            <ShortcutCard icon={BarChart3} title="Evolução" helper="Métricas e histórico" to="/workouts/dashboard" />
            <ShortcutCard icon={CalendarCheck} title="Saúde" helper="Consultas e exames" to="/appointments" />
            <ShortcutCard icon={UserCircle2} title="Perfil" helper="Dados e metas" to="/profile" />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant md:p-6">
            <SectionTitle title="Resumo diário" actionLabel="Histórico" to="/workouts/history" />
            <div className="mt-5 grid grid-cols-3 gap-3">
              <DailySummaryCard
                icon={Clock}
                label="Hoje"
                value={`${formatNumber(dashboardData.todayMinutes)}m`}
                helper={`${dashboardData.todayWorkouts} treino(s)`}
              />
              <DailySummaryCard
                icon={Footprints}
                label="Semana"
                value={`${dashboardData.weeklyWorkoutDays}/7`}
                helper="dias ativos"
              />
              <DailySummaryCard
                icon={Trophy}
                label="Conq."
                value={String(userAchievements.length)}
                helper={achievements.length > 0 ? `de ${achievements.length}` : "ativas"}
              />
            </div>

            {(inactivityMessage || bestMonthMessage) ? (
              <div className="mt-4 grid gap-3">
                {inactivityMessage ? (
                  <Link
                    to="/workouts"
                    className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm font-semibold leading-relaxed transition-colors hover:bg-primary/15"
                  >
                    <Dumbbell className="h-5 w-5 shrink-0 text-primary" />
                    {inactivityMessage}
                  </Link>
                ) : null}
                {bestMonthMessage ? (
                  <Link
                    to="/workouts/dashboard"
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/30 p-3 text-sm font-semibold leading-relaxed transition-colors hover:bg-secondary/45"
                  >
                    <Trophy className="h-5 w-5 shrink-0 text-primary" />
                    {bestMonthMessage}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Atividade semanal</h2>
                <p className="text-sm text-muted-foreground">Minutos ativos por dia</p>
              </div>
              <Link to="/workouts/dashboard" className="text-sm font-semibold text-primary">
                Ver detalhes
              </Link>
            </div>

            <div className="flex min-h-[180px] items-end justify-between gap-3 md:gap-5">
              {dashboardData.weeklyMinutes.map((minutes, index) => {
                const height = minutes > 0 ? Math.max(18, Math.round((minutes / maxMinutes) * 108)) : 8;
                const isCurrent = index === currentWeekDay;

                return (
                  <div key={weekDays[index]} className="flex flex-1 flex-col items-center gap-3">
                    <div
                      className={cn(
                        "w-full max-w-[38px] rounded-full transition-all duration-300",
                        minutes > 0 && isCurrent ? "gold-highlight" : "bg-secondary",
                        minutes === 0 ? "opacity-40" : "",
                      )}
                      style={{ height: `${height}px` }}
                    />
                    <p className={cn("text-xs font-semibold", isCurrent ? "text-primary" : "text-muted-foreground")}>
                      {weekDays[index]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Evolução rápida" actionLabel="Premium" to="/workouts/dashboard" />
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

        <section className="rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold md:text-2xl">Saúde integrada</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Consultas, bioimpedância, exames e protocolos ficam agrupados na área de saúde.
                </p>
              </div>
            </div>
            <Link
              to="/appointments"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Abrir saúde
            </Link>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-[32%] bg-[url('/images/workout-examples-ai.jpg')] bg-cover bg-center opacity-35 lg:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/70" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_176px] lg:items-center">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-primary">Plano do dia</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Próximos passos recomendados</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  Use este bloco depois de conferir os resultados para decidir onde continuar.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <PlanItem
                  icon={Dumbbell}
                  title={dashboardData.todayWorkouts > 0 ? "Treino registrado" : "Registrar treino"}
                  detail={
                    dashboardData.todayWorkouts > 0
                      ? `${dashboardData.todayWorkouts} treino(s), ${formatNumber(dashboardData.todayMinutes)} min hoje`
                      : "Comece pela musculação, cardio ou HIIT"
                  }
                  progress={todayWorkoutProgress || 12}
                  to="/workouts"
                />
                <PlanItem
                  icon={CalendarCheck}
                  title="Acompanhamento médico"
                  detail="Consultas, exames e bioimpedância"
                  progress={bmi > 0 ? 78 : 35}
                  to="/appointments"
                />
                <PlanItem
                  icon={TrendingUp}
                  title="Evolução semanal"
                  detail={`${dashboardData.weeklyWorkoutDays} de 7 dias com atividade`}
                  progress={weeklyDayProgress}
                  to="/workouts/dashboard"
                />
              </div>
            </div>

            <div className="hidden lg:block">
              <CircularProgress value={dailyPlanProgress} label="plano completo" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Treinos sugeridos" actionLabel="Ver todos" to="/workouts/popular" />
          <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar md:grid md:grid-cols-2 xl:grid-cols-4">
            {recommendationCards.map((card) => (
              <RecommendationCard
                key={card.title}
                {...card}
                className={cn("min-w-[186px] md:min-w-0", card.className)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Categorias de treino" actionLabel="Ver todas" to="/workouts" />
          <div className="flex justify-between gap-4 overflow-x-auto pb-1 hide-scrollbar md:justify-start md:gap-8">
            {quickCategories.map((category) => (
              <QuickCategoryLink key={category.to} {...category} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
