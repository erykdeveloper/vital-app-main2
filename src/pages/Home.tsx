import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Calendar, Scale, Crown, Syringe, RefreshCw, Flame, Trophy } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWeeklyProgress, getMotivationalMessage } from "@/hooks/useWeeklyProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMIStatus(bmi: number): { label: string; color: string; bgColor: string } {
  if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-blue-400", bgColor: "bg-blue-500/20" };
  if (bmi < 25) return { label: "Peso normal", color: "text-green-400", bgColor: "bg-green-500/20" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
  return { label: "Obesidade", color: "text-red-400", bgColor: "bg-red-500/20" };
}

export default function Home() {
  const { profile, loading } = useProfile();
  const { completed, goal, loading: progressLoading } = useWeeklyProgress();
  const { latestAchievement, loading: achievementsLoading } = useAchievements();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const bmi = profile ? calculateBMI(Number(profile.weight_kg), profile.height_cm) : 0;
  const bmiStatus = getBMIStatus(bmi);
  const isPremium = profile?.is_premium || false;
  const progressPercentage = (completed / goal) * 100;

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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo, {firstName}!</h1>
        <p className="text-muted-foreground">Como está sua saúde hoje?</p>
      </div>

      {/* Weekly Progress Card - Full Width */}
      <Link
        to="/workouts/history"
        className="block bg-card rounded-2xl p-5 space-y-3 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Sua Semana</h3>
          </div>
          <span className="text-lg font-bold text-accent">
            {progressLoading ? "..." : `${completed}/${goal}`}
          </span>
        </div>
        
        <Progress 
          value={progressLoading ? 0 : progressPercentage} 
          className="h-2 bg-secondary [&>div]:bg-accent"
        />
        
        <p className="text-sm text-muted-foreground">
          {progressLoading ? "Carregando..." : getMotivationalMessage(completed, goal)}
        </p>
      </Link>

      {/* Grid: IMC + Última Conquista */}
      <div className="grid grid-cols-2 gap-4">
        {/* BMI Card - Compact */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold">Seu IMC</h3>
            </div>
            <button
              onClick={handleUpdateBMI}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-accent" />
            </button>
          </div>

          <div className="text-center space-y-1.5">
            <div className="text-3xl font-bold text-accent">{bmi.toFixed(1)}</div>
            <div
              className={cn(
                "inline-block px-3 py-0.5 rounded-full text-xs font-medium",
                bmiStatus.bgColor,
                bmiStatus.color,
              )}
            >
              {bmiStatus.label}
            </div>
          </div>
        </div>

        {/* Latest Achievement Card - Compact */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold">Conquista</h3>
          </div>
          
          {achievementsLoading ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : latestAchievement ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-xl">
                {latestAchievement.achievement.icon || "🏆"}
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{latestAchievement.achievement.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(latestAchievement.unlocked_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl opacity-50">
                🏆
              </div>
              <p className="text-xs text-muted-foreground">Nenhuma ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <Separator className="my-2" />

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Row 1 */}
        <DashboardCard to="/workouts" icon={ClipboardList} title="Diário de Treinos" subtitle="Gratuito" />
        

        {/* Row 2 */}
        <DashboardCard
          to="/injectables"
          icon={Syringe}
          title="Monitoramento de Injetáveis"
          subtitle="Premium"
          isPremium
          isUserPremium={isPremium}
          onClick={handlePremiumClick}
        />

      </div>

      {/* Premium Card - Full Width */}
      <Link
        to="/premium"
        className="flex items-center justify-center gap-4 bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-2xl p-5 hover:border-accent/50 transition-colors w-full"
      >
        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shrink-0">
          <Crown className="w-6 h-6 text-accent-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Seja Premium</h3>
          <p className="text-sm text-muted-foreground">Acesso exclusivo</p>
        </div>
      </Link>

      {/* Premium Paywall Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-accent" />
            </div>
            <DialogTitle className="text-xl">Recurso Premium</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Desbloqueie recursos exclusivos como monitoramento de injetáveis, comunidade VIP e muito mais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Button
              asChild
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold"
            >
              <Link to="/premium" onClick={() => setShowPremiumModal(false)}>
                Assinar Premium – R$19,90/mês
              </Link>
            </Button>

            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
