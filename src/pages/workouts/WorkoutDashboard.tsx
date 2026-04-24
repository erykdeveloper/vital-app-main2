import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Crown, Flame, Footprints, TimerReset, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useProfile } from "@/hooks/useProfile";
import { useReports, type ReportPeriod } from "@/hooks/useReports";

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDistance(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTimelineLabel(label: string, period: ReportPeriod) {
  if (period === "weekly") {
    const date = new Date(`${label}T12:00:00`);
    return format(date, "dd/MM", { locale: ptBR });
  }

  if (period === "monthly") {
    const [year, month] = label.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return format(date, "MMM", { locale: ptBR });
  }

  return label;
}

export default function WorkoutDashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const { report, loading, error } = useReports(period);

  const chartData = useMemo(() => {
    if (!report) return [];

    return report.timeline.map((item) => ({
      ...item,
      shortLabel: formatTimelineLabel(item.label, period),
    }));
  }, [period, report]);

  if (profileLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (!profile?.is_premium) {
    return (
      <div className="min-h-full bg-[linear-gradient(180deg,#2a1035_0%,#31123f_100%)]">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
          <header className="rounded-[2rem] border border-white/5 bg-[rgba(50,17,67,0.96)] px-6 py-6 shadow-elegant">
            <div className="flex items-center gap-4">
              <Link to="/workouts" className="rounded-full bg-[hsl(var(--secondary))] p-3 text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios Premium</h1>
                <p className="text-sm text-muted-foreground">Desbloqueie análises semanais, mensais e anuais da sua evolução.</p>
              </div>
            </div>
          </header>

          <section className="rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(255,206,96,0.14),_transparent_34%),rgba(50,17,67,0.96)] p-8 shadow-elegant">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <Crown className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-semibold">Seus relatórios avançados ficam aqui</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Compare treinos, calorias, distância, minutos ativos e progresso corporal com uma leitura muito mais completa da sua rotina.
              </p>
              <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/5 bg-[hsl(var(--card))] p-5">
                  <p className="text-sm text-muted-foreground">Semanal</p>
                  <p className="mt-2 text-lg font-semibold">Consistência e ritmo recente</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/5 bg-[hsl(var(--card))] p-5">
                  <p className="text-sm text-muted-foreground">Mensal</p>
                  <p className="mt-2 text-lg font-semibold">Volume, calorias e metas por fase</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/5 bg-[hsl(var(--card))] p-5">
                  <p className="text-sm text-muted-foreground">Anual</p>
                  <p className="mt-2 text-lg font-semibold">Histórico consolidado de evolução</p>
                </div>
              </div>
              <Button asChild className="mt-8">
                <Link to="/premium">Desbloquear Premium</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#2a1035_0%,#31123f_100%)]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="rounded-[2rem] border border-white/5 bg-[rgba(50,17,67,0.96)] px-6 py-6 shadow-elegant">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/workouts" className="rounded-full bg-[hsl(var(--secondary))] p-3 text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios Premium</h1>
                <p className="text-sm text-muted-foreground">Acompanhe sua evolução por semana, mês ou ano com dados consolidados.</p>
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { value: "weekly", label: "Semanal" },
                { value: "monthly", label: "Mensal" },
                { value: "yearly", label: "Anual" },
              ].map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={period === item.value ? "default" : "outline"}
                  className={period === item.value ? "" : "border-white/10 bg-[hsl(var(--secondary))]"}
                  onClick={() => setPeriod(item.value as ReportPeriod)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        {error || !report ? (
          <section className="rounded-[2rem] border border-red-400/20 bg-[rgba(50,17,67,0.96)] p-8 text-center shadow-elegant">
            <p className="text-lg font-semibold">Não foi possível carregar o relatório.</p>
            <p className="mt-2 text-sm text-muted-foreground">{error || "Tente novamente em instantes."}</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="gold-highlight rounded-[2rem] px-6 py-6 shadow-glow">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-primary-foreground/80">Treinos</p>
                    <p className="mt-2 text-4xl font-semibold">{formatNumber(report.totals.workouts)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Calorias</p>
                    <p className="mt-2 text-4xl font-semibold">{formatNumber(report.totals.calories)}</p>
                  </div>
                  <Flame className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Minutos ativos</p>
                    <p className="mt-2 text-4xl font-semibold">{formatNumber(report.totals.active_minutes)}</p>
                  </div>
                  <TimerReset className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Distância</p>
                    <p className="mt-2 text-4xl font-semibold">{formatDistance(report.totals.distance_km)} km</p>
                  </div>
                  <Footprints className="h-8 w-8 text-primary" />
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Volume de treinos</h2>
                    <p className="text-sm text-muted-foreground">Distribuição por período selecionado.</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>

                <ChartContainer
                  className="h-[300px] w-full"
                  config={{
                    workouts: { label: "Treinos", color: "hsl(var(--primary))" },
                  }}
                >
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="workouts" fill="var(--color-workouts)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">Composição do período</h2>
                  <p className="text-sm text-muted-foreground">Leitura rápida do que você acumulou.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                    <p className="text-sm text-muted-foreground">Musculação</p>
                    <p className="mt-1 text-3xl font-semibold">{report.totals.strength_workouts}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                    <p className="text-sm text-muted-foreground">Cardio</p>
                    <p className="mt-1 text-3xl font-semibold">{report.totals.cardio_workouts}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                    <p className="text-sm text-muted-foreground">Fotos de evolução</p>
                    <p className="mt-1 text-3xl font-semibold">{report.totals.body_progress_photos}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Energia e minutos ativos</h2>
                  <p className="text-sm text-muted-foreground">Comparativo de calorias e volume de atividade.</p>
                </div>

                <ChartContainer
                  className="h-[300px] w-full"
                  config={{
                    calories: { label: "Calorias", color: "hsl(var(--primary))" },
                    minutes: { label: "Minutos", color: "hsl(var(--muted-foreground))" },
                  }}
                >
                  <AreaChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="var(--color-calories)"
                      fill="var(--color-calories)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--color-minutes)"
                      fill="var(--color-minutes)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">Último snapshot corporal</h2>
                  <p className="text-sm text-muted-foreground">Dados mais recentes de composição registrados.</p>
                </div>

                {report.latest_body_metrics ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                      <p className="text-sm text-muted-foreground">Registro</p>
                      <p className="mt-1 text-lg font-semibold">
                        {format(new Date(report.latest_body_metrics.date), "dd 'de' MMMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {report.latest_body_metrics.weight_kg ?? "--"} kg
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                        <p className="text-sm text-muted-foreground">Gordura corporal</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {report.latest_body_metrics.body_fat_percent ?? "--"}%
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-[hsl(var(--secondary))] p-4">
                        <p className="text-sm text-muted-foreground">Massa muscular</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {report.latest_body_metrics.muscle_mass_kg ?? "--"} kg
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] bg-[hsl(var(--secondary))] text-center text-muted-foreground">
                    <p className="max-w-xs text-sm">Assim que você tiver bioimpedância registrada, o snapshot corporal aparece aqui.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
