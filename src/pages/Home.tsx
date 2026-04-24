import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Flame,
  Footprints,
  Heart,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { format, eachDayOfInterval, endOfWeek, isSameDay, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAchievements } from "@/hooks/useAchievements";
import { useProfile } from "@/hooks/useProfile";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { fetchCardioWorkouts, fetchStrengthWorkouts } from "@/lib/workoutApi";
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
}: {
  label: string;
  title: string;
  description: string;
  to: string;
  className: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white/5 p-5 shadow-elegant",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
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
  monthlyCalories: number;
  monthlyWorkouts: number;
  weeklyCalories: number;
}

const initialDashboardData: DashboardData = {
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  monthlyCalories: 0,
  monthlyWorkouts: 0,
  weeklyCalories: 0,
};

export default function Home() {
  const { profile, loading } = useProfile();
  const { completed, goal, loading: progressLoading } = useWeeklyProgress();
  const { achievements, userAchievements } = useAchievements();
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);

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
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const weeklyMinutes = weekDays.map((day) =>
          combined
            .filter((workout) => isSameDay(parseISO(workout.date), day))
            .reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0)
        );

        const monthlyWorkouts = combined.filter((workout) => parseISO(workout.date) >= monthStart).length;
        const monthlyCalories = combined
          .filter((workout) => parseISO(workout.date) >= monthStart)
          .reduce((sum, workout) => sum + (workout.calories ?? 0), 0);
        const weeklyCalories = combined
          .filter((workout) => {
            const workoutDate = parseISO(workout.date);
            return workoutDate >= weekStart && workoutDate <= weekEnd;
          })
          .reduce((sum, workout) => sum + (workout.calories ?? 0), 0);

        setDashboardData({
          weeklyMinutes,
          monthlyCalories,
          monthlyWorkouts,
          weeklyCalories,
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
  const bmi = profile ? calculateBMI(Number(profile.weight_kg), Number(profile.height_cm)) : 0;
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const progressPercentage = goal > 0 ? clampPercentage((completed / goal) * 100) : 0;
  const monthlyCaloriesGoal = Math.max(2500, dashboardData.monthlyCalories + 800);
  const calorieProgress = clampPercentage((dashboardData.monthlyCalories / monthlyCaloriesGoal) * 100);
  const achievementProgress = achievements.length > 0
    ? clampPercentage((userAchievements.length / achievements.length) * 100)
    : 0;
  const weeklyWorkoutTarget = Math.max(goal, 5);
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const currentWeekDay = Math.max(0, Math.min(6, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const maxMinutes = Math.max(...dashboardData.weeklyMinutes, 1);
  const recommendationCards = [
    {
      label: "Cardio",
      title: "Corrida",
      description: "Treino intervalado para elevar o ritmo e ganhar folego.",
      to: "/workouts/cardio/corrida",
      className: "bg-[radial-gradient(circle_at_top_right,_rgba(255,209,102,0.24),_transparent_34%),linear-gradient(135deg,_#0d1628_0%,_#1b253e_38%,_#7d1016_100%)]",
    },
    {
      label: "Musculação",
      title: "Academia",
      description: "Sessão focada em força, volume e constância semanal.",
      to: "/workouts/musculacao/academia",
      className: "bg-[radial-gradient(circle_at_top_left,_rgba(255,178,67,0.32),_transparent_28%),linear-gradient(135deg,_#26140f_0%,_#58321d_38%,_#131313_100%)]",
    },
    {
      label: "Flexibilidade",
      title: "Mobilidade",
      description: "Abra espaço para recuperação ativa e movimento com controle.",
      to: "/workouts/cardio/outras",
      className: "bg-[radial-gradient(circle_at_top,_rgba(255,216,140,0.22),_transparent_28%),linear-gradient(135deg,_#3a1610_0%,_#8c4c39_42%,_#d98f69_100%)]",
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
            <div className="hidden items-center gap-3 rounded-full border border-white/5 bg-[hsl(var(--secondary))] px-4 py-3 text-sm text-muted-foreground md:flex">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-[180px] truncate">{fullName}</span>
            </div>

            {[Search, Bell].map((Icon, index) => (
              <button
                key={index}
                type="button"
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                {Icon === Bell ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-4">
          <TopMetricCard
            icon={Flame}
            title="Calorias"
            value={formatNumber(dashboardData.monthlyCalories)}
            helper={`de ${formatNumber(monthlyCaloriesGoal)} kcal neste mês`}
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

        <section className="grid gap-4 xl:grid-cols-[1fr_2fr]">
          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Progresso Diário</h2>
              <p className="text-base text-muted-foreground">Uma leitura rápida da sua rotina.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <CircularProgress value={calorieProgress} label="Calorias" />
              <CircularProgress value={progressPercentage} label="Treinos" />
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
                const height = Math.max(36, Math.round((minutes / maxMinutes) * 108));
                const isCurrent = index === currentWeekDay;

                return (
                  <div key={weekDays[index]} className="flex flex-1 flex-col items-center gap-4">
                    <div
                      className={cn(
                        "w-full max-w-[42px] rounded-t-[1.6rem] transition-all duration-300",
                        isCurrent ? "gold-highlight" : "bg-[hsl(var(--secondary))]"
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
            <h2 className="text-2xl font-semibold">Metas da Semana</h2>
            <Link to="/workouts/dashboard" className="text-lg font-medium text-primary">
              Ver todas
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GoalCard
              title="Calorias Queimadas"
              value={formatNumber(dashboardData.weeklyCalories)}
              helper={`/ ${formatNumber(1800)} kcal`}
              progress={(dashboardData.weeklyCalories / 1800) * 100}
              trend="+12%"
            />
            <GoalCard
              title="Treinos Completados"
              value={String(completed)}
              helper={`/ ${weeklyWorkoutTarget} treinos`}
              progress={(completed / weeklyWorkoutTarget) * 100}
              trend={progressLoading ? undefined : "+8%"}
            />
            <GoalCard
              title="Conquistas Liberadas"
              value={String(userAchievements.length)}
              helper={achievements.length > 0 ? `/ ${achievements.length} badges` : "/ catálogo"}
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

          <div className="grid gap-4 lg:grid-cols-3">
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
