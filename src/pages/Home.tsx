import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Crown,
  Flame,
  HeartPulse,
  RefreshCw,
  Scale,
  Sparkles,
  Star,
  Syringe,
  Target,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProfile } from "@/hooks/useProfile";
import { useWeeklyProgress, getMotivationalMessage } from "@/hooks/useWeeklyProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMIStatus(bmi: number): { label: string; tone: "balanced" | "attention" } {
  if (bmi >= 18.5 && bmi < 25) return { label: "Faixa equilibrada", tone: "balanced" };
  if (bmi === 0 || Number.isNaN(bmi)) return { label: "Dados pendentes", tone: "attention" };
  return { label: "Vale revisar medidas", tone: "attention" };
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

function clampPercentage(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ProgressRing({
  value,
  label,
  description,
}: {
  value: number;
  label: string;
  description: string;
}) {
  const percentage = clampPercentage(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-border bg-background/30 px-4 py-5">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1000ms ease-out" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border p-4 shadow-elegant transition-all duration-200 hover:-translate-y-0.5",
        highlight ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass-panel"
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            highlight ? "bg-primary-foreground/12 text-primary-foreground" : "bg-primary/12 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={cn("text-sm", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{helper}</p>
    </div>
  );
}

function QuickActionCard({
  to,
  icon: Icon,
  title,
  description,
  premium = false,
  locked = false,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  premium?: boolean;
  locked?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      to={locked ? "#" : to}
      onClick={onClick}
      className={cn(
        "glass-panel group flex min-h-[170px] flex-col justify-between rounded-[1.75rem] border border-border p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40",
        locked && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {premium && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Premium
          </span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-primary">{locked ? "Desbloquear recurso" : "Abrir agora"}</span>
        <ArrowRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function Home() {
  const { profile, loading } = useProfile();
  const { completed, goal, loading: progressLoading } = useWeeklyProgress();
  const { achievements, userAchievements, latestAchievement, loading: achievementsLoading } = useAchievements();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(" ")[0] || "Paciente";
  const fullName = profile?.full_name || "Paciente";
  const bmi = profile ? calculateBMI(Number(profile.weight_kg), profile.height_cm) : 0;
  const bmiStatus = getBMIStatus(bmi);
  const isPremium = profile?.is_premium || false;
  const progressPercentage = goal > 0 ? clampPercentage((completed / goal) * 100) : 0;
  const achievementsPercentage = achievements.length > 0
    ? clampPercentage((userAchievements.length / achievements.length) * 100)
    : 0;
  const premiumPercentage = isPremium ? 100 : 35;
  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const initials = getInitials(fullName);

  const handleUpdateBMI = () => {
    navigate("/profile?edit=bmi");
  };

  const handlePremiumClick = (e: React.MouseEvent) => {
    if (!isPremium) {
      e.preventDefault();
      setShowPremiumModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-28 md:gap-8 md:p-8 md:pb-10">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-border p-5 md:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-primary/18 via-transparent to-primary/8" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit items-center rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
                Dashboard pessoal
              </span>
              <div className="space-y-2">
                <p className="text-sm capitalize text-muted-foreground">{today}</p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Ola, {firstName} <span className="text-primary">.</span>
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  Um painel mais claro para acompanhar sua constancia, revisar metas e entrar rapido no que importa hoje.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[1.75rem] border border-border bg-background/40 p-4">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {isPremium ? "Plano Premium ativo" : "Plano Essencial"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/workouts"
              className="gold-highlight flex items-center justify-between rounded-[1.5rem] px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div>
                <p className="text-sm text-primary-foreground/80">Treino do dia</p>
                <p className="text-lg font-semibold">Abrir diario de treinos</p>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              to="/workouts/history"
              className="glass-panel flex items-center justify-between rounded-[1.5rem] px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div>
                <p className="text-sm text-muted-foreground">Historico</p>
                <p className="text-lg font-semibold">Ver sua evolucao</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </Link>

            <button
              type="button"
              onClick={handleUpdateBMI}
              className="glass-panel flex items-center justify-between rounded-[1.5rem] px-5 py-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div>
                <p className="text-sm text-muted-foreground">Dados corporais</p>
                <p className="text-lg font-semibold">Atualizar medidas</p>
              </div>
              <RefreshCw className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Treinos na semana"
          value={progressLoading ? "..." : String(completed)}
          helper={progressLoading ? "Carregando progresso" : `${goal} sessoes como meta atual`}
          highlight
        />
        <StatCard
          icon={Target}
          label="Constancia"
          value={`${Math.round(progressPercentage)}%`}
          helper={getMotivationalMessage(completed, goal)}
        />
        <StatCard
          icon={Scale}
          label="IMC atual"
          value={bmi ? bmi.toFixed(1) : "--"}
          helper={bmiStatus.label}
        />
        <StatCard
          icon={Trophy}
          label="Conquistas"
          value={String(userAchievements.length)}
          helper={
            achievements.length > 0
              ? `${userAchievements.length} de ${achievements.length} desbloqueadas`
              : "Catalogo em atualizacao"
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="glass-panel rounded-[2rem] border border-border p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Progresso da semana</h2>
              <p className="text-sm text-muted-foreground">Uma leitura rapida do seu ritmo atual.</p>
            </div>
            <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
              Atualizado hoje
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ProgressRing
              value={progressPercentage}
              label="Meta semanal"
              description={`${completed}/${goal} dias concluidos`}
            />
            <ProgressRing
              value={achievementsPercentage}
              label="Conquistas"
              description={`${userAchievements.length} badges liberadas`}
            />
            <ProgressRing
              value={premiumPercentage}
              label="Experiencia"
              description={isPremium ? "Todos os recursos liberados" : "Recursos extras disponiveis"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-[2rem] border border-border p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Resumo do momento</h2>
                <p className="text-sm text-muted-foreground">Seu painel principal para hoje.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.5rem] border border-border bg-background/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Meta semanal</span>
                  <span className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted [&>div]:bg-primary" />
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Status do IMC</span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      bmiStatus.tone === "balanced"
                        ? "bg-primary/12 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {bmiStatus.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {bmi
                    ? `Seu valor atual esta em ${bmi.toFixed(1)}. Se quiser, voce pode atualizar peso e altura para manter esse bloco preciso.`
                    : "Complete peso e altura no perfil para liberar uma leitura mais precisa aqui."}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Mensagem da semana</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {getMotivationalMessage(completed, goal)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] border border-border p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Ultima conquista</h2>
                <p className="text-sm text-muted-foreground">Seu marco mais recente.</p>
              </div>
              <Star className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-border bg-background/30 p-4">
              {achievementsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
              ) : latestAchievement ? (
                <div className="space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-2xl">
                    {latestAchievement.achievement.icon || "🏆"}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{latestAchievement.achievement.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {latestAchievement.achievement.description}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-primary">
                      {format(new Date(latestAchievement.unlocked_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold">Sua primeira conquista ainda vem ai</p>
                  <p className="text-sm text-muted-foreground">
                    Continue registrando treinos e mantendo a rotina para desbloquear os proximos marcos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Acessos rapidos</h2>
            <p className="text-sm text-muted-foreground">Entradas principais para a sua rotina dentro do app.</p>
          </div>
          <Link to="/profile" className="text-sm font-medium text-primary">
            Ver perfil
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            to="/workouts"
            icon={ClipboardList}
            title="Diario de treinos"
            description="Registre musculacao, cardio e acompanhe sua rotina."
          />
          <QuickActionCard
            to="/workouts/history"
            icon={Calendar}
            title="Historico"
            description="Revise sessoes anteriores e acompanhe seu ritmo."
          />
          <QuickActionCard
            to="/bioimpedancia"
            icon={Scale}
            title="Bioimpedancia"
            description="Acesse suas medidas e indicadores corporais."
          />
          <QuickActionCard
            to="/injectables"
            icon={Syringe}
            title="Injetaveis"
            description="Controle premium para protocolos e acompanhamento."
            premium
            locked={!isPremium}
            onClick={handlePremiumClick}
          />
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-border p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex w-fit items-center rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
              Experiencia premium
            </span>
            <h2 className="text-2xl font-semibold">Deixe a dashboard mais completa com recursos exclusivos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Libere monitoramento avancado, atalhos extras e uma jornada mais completa de acompanhamento com a Dra. Gabriela Issy.
            </p>
          </div>

          <Link
            to="/premium"
            className="gold-highlight inline-flex items-center justify-center gap-3 rounded-[1.5rem] px-6 py-4 text-sm font-semibold"
          >
            <Crown className="h-5 w-5" />
            <span>{isPremium ? "Gerenciar premium" : "Assinar premium"}</span>
          </Link>
        </div>
      </section>

      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="border-border bg-card sm:max-w-sm">
          <DialogHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/12">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Recurso Premium</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Desbloqueie recursos exclusivos como monitoramento de injetaveis, atalhos premium e uma experiencia mais completa no app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/premium" onClick={() => setShowPremiumModal(false)}>
                Assinar Premium
              </Link>
            </Button>

            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Voltar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
