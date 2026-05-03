import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  ArrowLeft,
  Bluetooth,
  CheckCircle2,
  FileText,
  Gauge,
  HeartPulse,
  Moon,
  Printer,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Watch,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBioimpedance } from "@/hooks/useBioimpedance";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ProviderId = "apple_health" | "google_fit" | "garmin" | "fitbit";

interface WearableConnection {
  provider: ProviderId;
  connectedAt: string;
  lastSyncAt: string;
  deviceName: string;
}

const STORAGE_KEY = "vitalissy-wearable-connection";

const providers: Array<{
  id: ProviderId;
  name: string;
  description: string;
  deviceName: string;
}> = [
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Apple Watch e dados do app Saúde.",
    deviceName: "Apple Watch",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Relógios Wear OS e Android.",
    deviceName: "Wear OS",
  },
  {
    id: "garmin",
    name: "Garmin",
    description: "Forerunner, Venu e Connect.",
    deviceName: "Garmin Watch",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Fitbit Sense, Versa e Charge.",
    deviceName: "Fitbit",
  },
];

const sampleVitals = {
  restingHeartRate: 62,
  currentHeartRate: 78,
  heartRateVariability: 48,
  oxygenSaturation: 97,
  activeCalories: 486,
  steps: 8420,
  sleepHours: 7.4,
  recoveryScore: 82,
  stressScore: 28,
  battery: 76,
};

function readConnection(): WearableConnection | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WearableConnection;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatMetric(value?: number | null, suffix = "") {
  if (value === null || value === undefined) return "--";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function getBmiLabel(value?: number | null) {
  if (!value) return "Sem registro";
  if (value < 18.5) return "Abaixo do peso";
  if (value < 25) return "Faixa adequada";
  if (value < 30) return "Sobrepeso";
  return "Atenção clínica";
}

function ReportMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  helper,
  progress,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  helper: string;
  progress: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/5 bg-[hsl(var(--card))] p-5 shadow-elegant">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          ao vivo
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      <Progress value={progress} className="mt-5 h-2 bg-[hsl(var(--muted))] [&>div]:bg-primary" />
    </div>
  );
}

export default function Wearables() {
  const { profile, loading: profileLoading } = useProfile();
  const { latestRecord, previousRecord, loading: bioLoading, getDifference } = useBioimpedance();
  const { toast } = useToast();
  const [connection, setConnection] = useState<WearableConnection | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setConnection(readConnection());
  }, []);

  const selectedProvider = providers.find((provider) => provider.id === connection?.provider);
  const weightDiff = getDifference(latestRecord?.weight_kg ?? null, previousRecord?.weight_kg ?? null);
  const fatDiff = getDifference(latestRecord?.body_fat_percent ?? null, previousRecord?.body_fat_percent ?? null);
  const reportDate = useMemo(() => new Date(), []);

  const handleConnect = (provider: (typeof providers)[number]) => {
    const now = new Date().toISOString();
    const nextConnection: WearableConnection = {
      provider: provider.id,
      connectedAt: now,
      lastSyncAt: now,
      deviceName: provider.deviceName,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnection));
    setConnection(nextConnection);
    toast({
      title: "Relógio conectado",
      description: `${provider.name} foi vinculado ao seu painel Vitalissy.`,
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConnection(null);
    toast({
      title: "Conexão removida",
      description: "Os dados do relógio deixaram de aparecer na dashboard.",
    });
  };

  const handleSync = () => {
    setSyncing(true);
    window.setTimeout(() => {
      const nextConnection = connection
        ? { ...connection, lastSyncAt: new Date().toISOString() }
        : null;

      if (nextConnection) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnection));
        setConnection(nextConnection);
      }

      setSyncing(false);
      toast({
        title: "Sincronização concluída",
        description: "As métricas vitais foram atualizadas.",
      });
    }, 700);
  };

  if (profileLoading || bioLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#2a1035_0%,#31123f_100%)]">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #wearable-report, #wearable-report * { visibility: visible; }
          #wearable-report {
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            color: #0f172a;
            padding: 28px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 pb-28 pt-4 md:px-7 md:pb-8 md:pt-7">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/5 bg-[rgba(50,17,67,0.96)] px-6 py-6 shadow-elegant lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar para dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Relógio e Ficha Vital</h1>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Conecte o relógio do paciente, acompanhe batimentos e gere uma ficha limpa para consulta ou impressão.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={handleSync} disabled={!connection || syncing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", syncing ? "animate-spin" : "")} />
              Sincronizar
            </Button>
            <Button type="button" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Gerar ficha
            </Button>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Conexão</h2>
                <p className="text-base text-muted-foreground">Escolha a origem dos dados vitais.</p>
              </div>
              <Watch className="h-6 w-6 text-primary" />
            </div>

            {connection ? (
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-semibold text-emerald-100">{selectedProvider?.name} conectado</p>
                      <p className="text-sm text-emerald-100/70">{connection.deviceName}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-2xl bg-background/20 px-4 py-3">
                    <span>Última sincronização</span>
                    <span className="text-foreground">{formatDateTime(connection.lastSyncAt)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-background/20 px-4 py-3">
                    <span>Bateria</span>
                    <span className="text-foreground">{sampleVitals.battery}%</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={handleDisconnect}>
                  Remover conexão
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleConnect(provider)}
                    className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/5 bg-background/20 p-4 text-left transition-colors hover:bg-[hsl(var(--secondary))]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <Bluetooth className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{provider.name}</span>
                        <span className="block text-sm text-muted-foreground">{provider.description}</span>
                      </span>
                    </span>
                    <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VitalCard
              icon={HeartPulse}
              label="Batimentos"
              value={`${sampleVitals.currentHeartRate} bpm`}
              helper={`repouso ${sampleVitals.restingHeartRate} bpm`}
              progress={78}
            />
            <VitalCard
              icon={Activity}
              label="Variabilidade"
              value={`${sampleVitals.heartRateVariability} ms`}
              helper="indicador de recuperação"
              progress={64}
            />
            <VitalCard
              icon={Moon}
              label="Sono"
              value={`${sampleVitals.sleepHours} h`}
              helper="última noite registrada"
              progress={82}
            />
            <VitalCard
              icon={Gauge}
              label="Recuperação"
              value={`${sampleVitals.recoveryScore}%`}
              helper="pronto para treino moderado"
              progress={sampleVitals.recoveryScore}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Leitura Clínica</h2>
                <p className="text-base text-muted-foreground">Resumo objetivo para acompanhamento.</p>
              </div>
              <FileText className="h-6 w-6 text-primary" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] bg-background/20 p-5">
                <p className="text-sm text-muted-foreground">Peso atual</p>
                <p className="mt-1 text-3xl font-semibold">{formatMetric(latestRecord?.weight_kg, " kg")}</p>
                <p className={cn("mt-2 text-sm", weightDiff && weightDiff < 0 ? "text-emerald-300" : "text-muted-foreground")}>
                  {weightDiff === null ? "sem comparativo" : `${weightDiff > 0 ? "+" : ""}${weightDiff} kg desde o exame anterior`}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-background/20 p-5">
                <p className="text-sm text-muted-foreground">Gordura corporal</p>
                <p className="mt-1 text-3xl font-semibold">{formatMetric(latestRecord?.body_fat_percent, "%")}</p>
                <p className={cn("mt-2 text-sm", fatDiff && fatDiff < 0 ? "text-emerald-300" : "text-muted-foreground")}>
                  {fatDiff === null ? "sem comparativo" : `${fatDiff > 0 ? "+" : ""}${fatDiff}% desde o exame anterior`}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-background/20 p-5">
                <p className="text-sm text-muted-foreground">IMC</p>
                <p className="mt-1 text-3xl font-semibold">{formatMetric(latestRecord?.bmi)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{getBmiLabel(latestRecord?.bmi)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-[hsl(var(--card))] p-6 shadow-elegant">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Privacidade</h2>
                <p className="text-base text-muted-foreground">Dados sensíveis protegidos.</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl bg-background/20 p-4">Permissões podem ser removidas pelo paciente a qualquer momento.</div>
              <div className="rounded-2xl bg-background/20 p-4">A ficha mostra apenas dados úteis para acompanhamento físico e clínico.</div>
              <div className="rounded-2xl bg-background/20 p-4">Integrações reais devem usar OAuth e consentimento explícito.</div>
            </div>
          </div>
        </section>
      </div>

      <section id="wearable-report" className="mx-auto hidden max-w-5xl bg-white p-8 text-slate-950 print:block">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Vitalissy</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Ficha de Acompanhamento Vital</h1>
              <p className="mt-2 text-sm text-slate-500">Emitida em {formatDateTime(reportDate.toISOString())}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Fonte</p>
              <p className="font-semibold">{selectedProvider?.name ?? "Relógio não conectado"}</p>
              <p className="text-xs text-slate-500">{connection ? formatDateTime(connection.lastSyncAt) : "Sem sincronização"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <ReportMetric label="Paciente" value={profile?.full_name ?? "Paciente"} helper={`Altura: ${profile?.height_cm ?? "--"} cm`} />
          <ReportMetric label="Peso" value={formatMetric(latestRecord?.weight_kg ?? Number(profile?.weight_kg), " kg")} helper="último dado disponível" />
          <ReportMetric label="IMC" value={formatMetric(latestRecord?.bmi)} helper={getBmiLabel(latestRecord?.bmi)} />
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Sinais do Relógio</h2>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <ReportMetric label="Batimento atual" value={`${sampleVitals.currentHeartRate} bpm`} helper={`repouso ${sampleVitals.restingHeartRate} bpm`} />
            <ReportMetric label="VFC" value={`${sampleVitals.heartRateVariability} ms`} helper="variabilidade cardíaca" />
            <ReportMetric label="Oxigenação" value={`${sampleVitals.oxygenSaturation}%`} helper="SpO2 estimado" />
            <ReportMetric label="Sono" value={`${sampleVitals.sleepHours} h`} helper="última noite" />
            <ReportMetric label="Passos" value={formatMetric(sampleVitals.steps)} helper="dia atual" />
            <ReportMetric label="Calorias ativas" value={`${sampleVitals.activeCalories} kcal`} helper="dia atual" />
            <ReportMetric label="Recuperação" value={`${sampleVitals.recoveryScore}%`} helper="prontidão geral" />
            <ReportMetric label="Estresse" value={`${sampleVitals.stressScore}%`} helper="carga estimada" />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Composição Corporal</h2>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <ReportMetric label="Gordura corporal" value={formatMetric(latestRecord?.body_fat_percent, "%")} />
            <ReportMetric label="Massa muscular" value={formatMetric(latestRecord?.muscle_mass_kg, " kg")} />
            <ReportMetric label="Água corporal" value={formatMetric(latestRecord?.water_percent, "%")} />
            <ReportMetric label="Gordura visceral" value={formatMetric(latestRecord?.visceral_fat)} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold">Observações</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Ficha resumida para acompanhamento de evolução. Os dados de relógio devem ser interpretados como apoio à rotina e não substituem avaliação médica, exame físico ou análise profissional.
          </p>
        </div>
      </section>
    </div>
  );
}
