import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  History,
  Home,
  ListChecks,
  PersonStanding,
  RotateCcw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { fetchStrengthWorkouts } from "@/lib/workoutApi";
import { useAuth } from "@/hooks/useAuth";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useWorkoutDraft } from "@/hooks/useWorkoutDraft";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { AddedExerciseCard } from "@/components/workouts/AddedExerciseCard";
import { ExerciseInputForm } from "@/components/workouts/ExerciseInputForm";
import { PreviousWorkoutsModal } from "@/components/workouts/PreviousWorkoutsModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

interface WorkoutDraftData {
  objective: string;
  addedExercises: Exercise[];
  currentExercise: Exercise;
  durationHours: number | '';
  durationMin: number | '';
  durationSec: number | '';
  calories: number | '';
}

const emptyExercise: Exercise = {
  name: "",
  sets: [
    { reps: 0, weight: 0 },
    { reps: 0, weight: 0 },
    { reps: 0, weight: 0 },
  ],
};

const getFilledSets = (sets: ExerciseSet[]) =>
  sets
    .map((set) => ({
      reps: Number(set.reps) || 0,
      weight: Number(set.weight) || 0,
    }))
    .filter((set) => set.reps > 0 || set.weight > 0);

const normalizeExercise = (exercise: Exercise): Exercise => ({
  name: exercise.name.trim(),
  sets: getFilledSets(exercise.sets),
});

const workoutTypeConfig = {
  academia: { label: "Academia", icon: Dumbbell },
  "em-casa": { label: "Em Casa", icon: Home },
  crossfit: { label: "CrossFit", icon: Flame },
  calistenia: { label: "Calistenia", icon: PersonStanding },
};

const getDayOfWeek = (date: Date): string => {
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[date.getDay()];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function WorkoutForm() {
  const { type = "academia" } = useParams<{ type: string }>();
  const { user } = useAuth();
  const today = new Date();

  const config = workoutTypeConfig[type as keyof typeof workoutTypeConfig] || workoutTypeConfig.academia;
  const IconComponent = config.icon;

  // Draft persistence
  const { saveDraft, loadDraft, clearDraft } = useWorkoutDraft<WorkoutDraftData>(type);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [objective, setObjective] = useState("");
  
  // Exercícios já adicionados (confirmados)
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);
  
  // Exercício sendo preenchido no formulário
  const [currentExercise, setCurrentExercise] = useState<Exercise>({ ...emptyExercise });
  
  // Índice do exercício sendo editado (null = novo)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [durationHours, setDurationHours] = useState<number | "">("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [durationSec, setDurationSec] = useState<number | "">("");
  const [calories, setCalories] = useState<number | "">("");

  // Modal de treinos anteriores
  const [showPreviousWorkouts, setShowPreviousWorkouts] = useState(false);
  const [loadingLastWorkout, setLoadingLastWorkout] = useState(false);
  const [confirmReplaceDialog, setConfirmReplaceDialog] = useState(false);
  const [pendingWorkoutToLoad, setPendingWorkoutToLoad] = useState<{
    exercises: Exercise[];
    objective: string;
    date: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "info" | "success" | "error"; message: string } | null>(null);

  // Detectar se há dados não salvos
  const hasCurrentExerciseData = !!(
    currentExercise.name.trim() || 
    currentExercise.sets.some(s => s.reps > 0 || s.weight > 0)
  );
  
  const hasUnsavedChanges = !!(
    objective.trim() ||
    addedExercises.length > 0 ||
    hasCurrentExerciseData ||
    durationHours ||
    durationMin ||
    durationSec ||
    calories
  );

  // Hook para bloquear navegação
  const { isBlocked, proceed, reset } = useUnsavedChangesWarning({
    hasUnsavedChanges
  });

  // Carregar rascunho ao montar
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setObjective(draft.objective || '');
      if (draft.addedExercises && draft.addedExercises.length > 0) {
        setAddedExercises(draft.addedExercises);
      }
      if (draft.currentExercise) {
        setCurrentExercise(draft.currentExercise);
      }
      setDurationHours(draft.durationHours || '');
      setDurationMin(draft.durationMin || '');
      setDurationSec(draft.durationSec || '');
      setCalories(draft.calories || '');
      toast.info('Rascunho recuperado automaticamente');
    }
    setDraftLoaded(true);
  }, []);

  // Salvar automaticamente no localStorage
  useEffect(() => {
    if (!draftLoaded) return;
    if (hasUnsavedChanges) {
      saveDraft({
        objective,
        addedExercises,
        currentExercise,
        durationHours,
        durationMin,
        durationSec,
        calories
      });
    }
  }, [objective, addedExercises, currentExercise, durationHours, durationMin, durationSec, calories, hasUnsavedChanges, draftLoaded, saveDraft]);

  // Função para validar input numérico com limite
  const handleDurationInput = (value: string, maxValue: number, setter: (val: number | "") => void) => {
    const numbersOnly = value.replace(/\D/g, "");
    if (numbersOnly === "") {
      setter("");
      return;
    }
    const numValue = parseInt(numbersOnly, 10);
    const clampedValue = Math.min(numValue, maxValue);
    setter(clampedValue);
  };

  // Timer states
  const [restTime, setRestTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showTimerOverlay, setShowTimerOverlay] = useState(false);

  // Wake Lock and Audio refs
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const savePressLockRef = useRef(false);

  // Request Wake Lock to prevent screen from locking
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log("Wake Lock não disponível");
    }
  };

  // Release Wake Lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Play alarm sound when timer ends
  const playAlarmSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Play 3 beeps
      [0, 0.15, 0.3].forEach((delay) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 880;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.5, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + 0.1);
      });
    } catch (e) {
      console.log("Audio não disponível");
    }
  };

  // Timer effect using timestamps for accuracy
  useEffect(() => {
    if (!endTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsResting(false);
        setEndTime(null);
        setShowTimerOverlay(false);
        releaseWakeLock();

        // Sound + vibration + toast
        playAlarmSound();
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
        toast.success("Descanso finalizado! 💪");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [endTime]);

  const startRest = async () => {
    setEndTime(Date.now() + restTime * 1000);
    setTimeLeft(restTime);
    setIsResting(true);
    setShowTimerOverlay(true);
    await requestWakeLock();
  };

  const stopRest = () => {
    setIsResting(false);
    setEndTime(null);
    setTimeLeft(0);
    setShowTimerOverlay(false);
    releaseWakeLock();
  };

  // Adicionar exercício atual à lista
  const handleAddCurrentExercise = () => {
    const exerciseToAdd = normalizeExercise(currentExercise);

    if (!exerciseToAdd.name) {
      toast.error("Informe o nome do exercício");
      return;
    }

    if (exerciseToAdd.sets.length === 0) {
      toast.error("Informe pelo menos uma série com repetições");
      return;
    }

    if (exerciseToAdd.sets.some((set) => set.reps <= 0)) {
      toast.error("Cada série preenchida precisa ter pelo menos 1 repetição");
      return;
    }

    if (editingIndex !== null) {
      // Modo edição: atualizar exercício existente
      const updated = [...addedExercises];
      updated[editingIndex] = exerciseToAdd;
      setAddedExercises(updated);
      setEditingIndex(null);
      toast.success("Exercício atualizado!");
    } else {
      // Modo novo: adicionar à lista
      setAddedExercises([...addedExercises, exerciseToAdd]);
      toast.success("Exercício adicionado!");
    }

    // Limpar formulário
    setCurrentExercise({
      name: "",
      sets: [
        { reps: 0, weight: 0 },
        { reps: 0, weight: 0 },
        { reps: 0, weight: 0 },
      ],
    });
  };

  // Editar exercício já adicionado
  const handleEditExercise = (index: number) => {
    setCurrentExercise({ ...addedExercises[index] });
    setEditingIndex(index);
  };

  // Remover exercício da lista
  const handleRemoveExercise = (index: number) => {
    setAddedExercises(addedExercises.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentExercise({ ...emptyExercise });
    }
    toast.success("Exercício removido");
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentExercise({ ...emptyExercise });
  };

  // Buscar último treino similar
  const handleRepeatLastWorkout = async () => {
    if (!user) return;

    const searchTerm = objective.trim();
    
    setLoadingLastWorkout(true);
    try {
      const workouts = await fetchStrengthWorkouts();
      const filteredWorkouts = workouts
        .filter((workout) => workout.workout_type === type)
        .filter((workout) =>
          searchTerm
            ? workout.objective.toLowerCase().includes(searchTerm.toLowerCase())
            : true,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (filteredWorkouts.length === 0) {
        toast.error(searchTerm 
          ? `Nenhum treino de "${searchTerm}" encontrado` 
          : "Nenhum treino anterior encontrado"
        );
        return;
      }

      const workout = filteredWorkouts[0];
      const exercises = workout.exercises || [];

      if (exercises.length === 0) {
        toast.error("O treino encontrado não tem exercícios");
        return;
      }

      // Se já tem exercícios, perguntar antes
      if (addedExercises.length > 0) {
        setPendingWorkoutToLoad({
          exercises,
          objective: workout.objective,
          date: workout.date,
        });
        setConfirmReplaceDialog(true);
      } else {
        loadWorkoutExercises(exercises, workout.objective, workout.date);
      }
    } catch (error) {
      console.error("Erro ao buscar treino:", error);
      toast.error("Erro ao buscar treino anterior");
    } finally {
      setLoadingLastWorkout(false);
    }
  };

  // Carregar exercícios de um treino
  const loadWorkoutExercises = (exercises: Exercise[], workoutObjective: string, dateStr: string) => {
    const exercisesToLoad = exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
      })),
    }));

    setAddedExercises(exercisesToLoad);
    if (!objective.trim()) {
      setObjective(workoutObjective);
    }

    const formattedDate = format(new Date(dateStr + "T12:00:00"), "dd/MM", { locale: ptBR });
    toast.success(`Carregado treino de ${formattedDate} com ${exercisesToLoad.length} exercícios`);
  };

  // Callback do modal de treinos anteriores
  const handleSelectPreviousWorkout = (workout: { exercises: Exercise[]; objective: string; date: string }) => {
    if (addedExercises.length > 0) {
      setPendingWorkoutToLoad({
        exercises: workout.exercises,
        objective: workout.objective,
        date: workout.date,
      });
      setConfirmReplaceDialog(true);
    } else {
      loadWorkoutExercises(workout.exercises, workout.objective, workout.date);
    }
  };

  // Confirmar substituição de exercícios
  const handleConfirmReplace = () => {
    if (pendingWorkoutToLoad) {
      loadWorkoutExercises(
        pendingWorkoutToLoad.exercises,
        pendingWorkoutToLoad.objective,
        pendingWorkoutToLoad.date
      );
    }
    setPendingWorkoutToLoad(null);
    setConfirmReplaceDialog(false);
  };

  const handleSaveWorkout = async () => {
    setSaveFeedback({ type: "info", message: "Enviando treino para o banco de dados..." });

    if (!user) {
      const message = "Você precisa estar logado novamente para salvar o treino";
      setSaveFeedback({ type: "error", message });
      toast.error(message);
      return false;
    }

    const workoutObjective = objective.trim() || config.label;
    let exercisesForSave = addedExercises.map(normalizeExercise);

    if (hasCurrentExerciseData) {
      const currentExerciseForSave = normalizeExercise(currentExercise);
      const currentExerciseIsComplete =
        currentExerciseForSave.name &&
        currentExerciseForSave.sets.length > 0 &&
        currentExerciseForSave.sets.every((set) => set.reps > 0);

      if (currentExerciseIsComplete && editingIndex !== null) {
        exercisesForSave = exercisesForSave.map((exercise, index) =>
          index === editingIndex ? currentExerciseForSave : exercise,
        );
      } else if (currentExerciseIsComplete) {
        exercisesForSave = [...exercisesForSave, currentExerciseForSave];
      } else if (addedExercises.length === 0) {
        const message = "Complete o exercício em aberto antes de salvar";
        setSaveFeedback({ type: "error", message });
        toast.error(message);
        return false;
      }
    }

    if (exercisesForSave.length === 0) {
      const message = "Adicione pelo menos um exercício";
      setSaveFeedback({ type: "error", message });
      toast.error(message);
      return false;
    }

    const exercisesToSave = exercisesForSave.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets,
    }));

    const invalidExercise = exercisesToSave.find(
      (exercise) => !exercise.name || exercise.sets.length === 0 || exercise.sets.some((set) => set.reps <= 0),
    );

    if (invalidExercise) {
      const message = "Revise os exercícios: cada série precisa ter pelo menos 1 repetição.";
      setSaveFeedback({ type: "error", message });
      toast.error(message);
      return false;
    }

    const totalMinutes =
      (Number(durationHours) || 0) * 60 + (Number(durationMin) || 0) + (Number(durationSec) || 0) / 60;
    const durationMin = totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes)) : null;

    setSaving(true);
    try {
      const workoutData = {
        date: today.toISOString().split("T")[0],
        objective: workoutObjective,
        duration_min: durationMin,
        calories: calories || null,
        exercises: exercisesToSave as unknown,
        workout_type: type,
      };

      await api.post('/workouts/strength', workoutData);

      toast.success("Treino salvo com sucesso!");
      setSaveFeedback({ type: "success", message: "Treino salvo no banco de dados do usuário logado." });
      clearDraft();
      setObjective("");
      setAddedExercises([]);
      setCurrentExercise({ ...emptyExercise });
      setEditingIndex(null);
      setDurationHours("");
      setDurationMin("");
      setDurationSec("");
      setCalories("");
      return true;
    } catch (error: any) {
      const message = error.message || '';
      let userMessage = '';
      
      if (message.includes('Load Failed') || 
          message.includes('NetworkError') ||
          message.includes('fetch') ||
          message.includes('network')) {
        userMessage = 'Erro de conexão. Seus dados estão salvos localmente. Tente novamente.';
      } else {
        userMessage = `Erro ao salvar treino: ${message || 'tente novamente em alguns instantes'}`;
      }
      setSaveFeedback({ type: "error", message: userMessage });
      toast.error(userMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar e navegar (usado no dialog de alterações não salvas)
  const handleSaveAndNavigate = async () => {
    const saved = await handleSaveWorkout();
    if (saved) {
      proceed();
    }
  };

  // Função para descartar e navegar (usado no dialog de alterações não salvas)
  const handleDiscardAndNavigate = () => {
    clearDraft();
    proceed();
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const totalSets = addedExercises.reduce((total, exercise) => total + getFilledSets(exercise.sets).length, 0);
  const totalMinutesPreview =
    (Number(durationHours) || 0) * 60 + (Number(durationMin) || 0) + (Number(durationSec) || 0) / 60;
  const saveExerciseCount = addedExercises.length + (hasCurrentExerciseData && editingIndex === null ? 1 : 0);
  const saveButtonLabel = saving ? "Salvando..." : `Salvar Treino (${saveExerciseCount} exercícios)`;
  const saveDisabled = saving || (addedExercises.length === 0 && !hasCurrentExerciseData);
  const saveFeedbackClassName =
    saveFeedback?.type === "success"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : saveFeedback?.type === "info"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-destructive/30 bg-destructive/10 text-destructive";

  const handleSaveButtonPress = () => {
    if (saveDisabled || savePressLockRef.current) return;

    savePressLockRef.current = true;
    void handleSaveWorkout().finally(() => {
      window.setTimeout(() => {
        savePressLockRef.current = false;
      }, 300);
    });
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background-strong))_100%)]">
      <div className="mx-auto flex w-full max-w-[1180px] min-w-0 flex-col gap-6 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8rem)] pt-2 sm:px-4 md:px-7 md:pb-8 md:pt-7">
      <header className="sticky top-0 z-50 -mx-3 flex h-14 items-center justify-center border-b border-white/5 bg-background/90 px-3 backdrop-blur md:hidden">
        <Link
          to="/workouts"
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-card/85 text-muted-foreground shadow-elegant hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold">{config.label}</h1>
        <button
          type="button"
          onClick={() => setShowPreviousWorkouts(true)}
          className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full bg-card/85 text-muted-foreground shadow-elegant hover:text-foreground"
          aria-label="Treinos anteriores"
        >
          <History className="h-5 w-5" />
        </button>
      </header>

      <section className="overflow-hidden rounded-[2rem] border border-white/5 bg-card/90 shadow-elegant">
        <div className="relative min-h-[220px] p-6 md:min-h-[260px] md:p-7">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: "url('/images/workout-examples-ai.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/78 to-background" />
          <div className="relative flex h-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-4">
              <Link
                to="/workouts"
                className="hidden h-11 w-11 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <CalendarCheck className="h-4 w-4" />
                {getDayOfWeek(today)}, {formatDate(today)}
              </div>
              <div>
                <h1 className="hidden text-4xl font-bold leading-tight tracking-normal md:block md:text-5xl">
                  {config.label}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-lg">
                  Monte o treino do dia, repita treinos anteriores e salve seu progresso em poucos passos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-background/45 p-3 backdrop-blur">
                <ListChecks className="mb-2 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{addedExercises.length}</p>
                <p className="text-xs text-muted-foreground">exercícios</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-3 backdrop-blur">
                <Dumbbell className="mb-2 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{totalSets}</p>
                <p className="text-xs text-muted-foreground">séries</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-3 backdrop-blur">
                <Clock className="mb-2 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{Math.round(totalMinutesPreview) || "--"}</p>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex gap-3 overflow-x-auto pb-1">
        {[
          { label: "Hoje", active: true },
          { label: hasUnsavedChanges ? "Rascunho salvo" : "Sem rascunho", active: hasUnsavedChanges },
          { label: `${addedExercises.length} exercícios`, active: addedExercises.length > 0 },
        ].map((chip) => (
          <span
            key={chip.label}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold ${
              chip.active
                ? "border-primary/35 bg-primary/15 text-primary"
                : "border-white/5 bg-card/70 text-muted-foreground"
            }`}
          >
            {chip.label}
          </span>
        ))}
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
      {/* Workout Form */}
      <div className="rounded-[2rem] border border-white/5 bg-card/85 p-5 shadow-elegant space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/15 rounded-2xl flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label className="text-lg font-semibold">Treino do dia</Label>
            <p className="text-sm text-muted-foreground">Dê um nome para organizar o histórico.</p>
          </div>
        </div>
        <Input
          placeholder="Peito/Tríceps, Full body, Lower..."
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="h-14 rounded-xl border-white/5 bg-secondary/70 text-base focus-visible:ring-offset-0"
        />

        {/* Botões de Repetir Treino */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRepeatLastWorkout}
            disabled={loadingLastWorkout}
            className="h-12 rounded-xl border-white/10 bg-background/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {loadingLastWorkout ? "Buscando..." : "Repetir último"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreviousWorkouts(true)}
            className="h-12 rounded-xl border-white/10 bg-background/30"
          >
            <History className="w-4 h-4 mr-2" />
            Ver anteriores
          </Button>
        </div>

        <div className="border-t border-white/10" />

        {/* Lista de Exercícios Adicionados */}
        {addedExercises.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Exercícios adicionados ({addedExercises.length})
              </Label>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {totalSets} séries
              </span>
            </div>
            <div className="space-y-2">
              {addedExercises.map((exercise, index) => (
                <AddedExerciseCard
                  key={index}
                  exercise={exercise}
                  index={index}
                  onEdit={handleEditExercise}
                  onRemove={handleRemoveExercise}
                />
              ))}
            </div>
            <div className="border-t border-white/10" />
            <button
              type="button"
              onPointerUp={handleSaveButtonPress}
              onClick={handleSaveButtonPress}
              disabled={saveDisabled}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50 lg:hidden"
            >
              {saveButtonLabel}
            </button>
            {saveFeedback && (
              <p className={`rounded-xl border px-3 py-2 text-sm font-medium ${saveFeedbackClassName}`}>
                {saveFeedback.message}
              </p>
            )}
          </div>
        )}

        {/* Formulário para Novo Exercício */}
        <div className="rounded-2xl bg-secondary/35 p-3">
          <ExerciseInputForm
            currentExercise={currentExercise}
            onExerciseChange={setCurrentExercise}
            onAddExercise={handleAddCurrentExercise}
            onCancelEdit={handleCancelEdit}
            isEditing={editingIndex !== null}
          />
        </div>

        {/* Rest Timer Settings */}
        <div className="rounded-2xl border border-white/5 bg-background/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Descanso entre séries</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Select
                value={restTime.toString()}
                onValueChange={(value) => setRestTime(Number(value))}
                disabled={isResting}
              >
                <SelectTrigger className="h-10 w-[92px] rounded-xl border-white/10 bg-secondary/70 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="45">45s</SelectItem>
                  <SelectItem value="60">1min</SelectItem>
                  <SelectItem value="90">1:30</SelectItem>
                  <SelectItem value="120">2min</SelectItem>
                  <SelectItem value="180">3min</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={startRest}
                disabled={isResting}
                className="h-10 rounded-xl bg-accent px-3 text-accent-foreground hover:bg-accent/90"
              >
                Iniciar
              </Button>
            </div>
          </div>
        </div>
      </div>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
      {/* Workout Summary */}
      <div className="space-y-4 rounded-[1.5rem] border border-white/5 bg-card/85 p-4 shadow-elegant sm:rounded-[2rem] sm:p-5">
        <div>
          <h2 className="text-lg font-semibold">Resumo do treino</h2>
          <p className="text-sm text-muted-foreground">Complete antes de salvar no histórico.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <Label className="text-sm">Duração</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  maxLength={2}
                  value={durationHours === "" ? "" : durationHours}
                  onChange={(e) => handleDurationInput(e.target.value, 23, setDurationHours)}
                  className="h-12 rounded-xl border-white/5 bg-secondary/70 pr-6 text-center focus-visible:ring-offset-0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  maxLength={2}
                  value={durationMin === "" ? "" : durationMin}
                  onChange={(e) => handleDurationInput(e.target.value, 59, setDurationMin)}
                  className="h-12 rounded-xl border-white/5 bg-secondary/70 pr-7 text-center focus-visible:ring-offset-0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
              </div>
              <div className="relative col-span-2 sm:col-span-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  maxLength={2}
                  value={durationSec === "" ? "" : durationSec}
                  onChange={(e) => handleDurationInput(e.target.value, 59, setDurationSec)}
                  className="h-12 rounded-xl border-white/5 bg-secondary/70 pr-6 text-center focus-visible:ring-offset-0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              <Label className="text-sm">Calorias</Label>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              maxLength={5}
              value={calories}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setCalories(value ? Number(value) : "");
              }}
              className="h-12 rounded-xl border-white/5 bg-secondary/70 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/45 p-3 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{addedExercises.length}</p>
            <p className="text-[11px] text-muted-foreground">exerc.</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{totalSets}</p>
            <p className="text-[11px] text-muted-foreground">séries</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{calories || "--"}</p>
            <p className="text-[11px] text-muted-foreground">kcal</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSaveButtonPress}
          disabled={saveDisabled}
          className="hidden h-14 w-full rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow hover:opacity-95 lg:inline-flex"
        >
          {saveButtonLabel}
        </Button>
        {saveFeedback && (
          <p className={`rounded-xl border px-3 py-2 text-sm font-medium ${saveFeedbackClassName}`}>
            {saveFeedback.message}
          </p>
        )}
      </div>
        </aside>
      </div>

      {/* Floating Timer Button */}
      {!showTimerOverlay && isResting && (
        <button
          onClick={() => {
            setShowTimerOverlay(true);
          }}
          className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 lg:bottom-6 ${
            isResting ? "bg-accent animate-pulse" : "bg-card border-2 border-accent hover:scale-110"
          }`}
        >
          <span className="font-mono text-sm font-bold text-accent-foreground">{formatTimerDisplay(timeLeft)}</span>
        </button>
      )}

      {/* Timer Overlay */}
      {showTimerOverlay && isResting && (
        <div className="fixed inset-0 bg-background/95 z-[100] flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-6 text-lg">Descansando...</p>
          <button
            onClick={stopRest}
            className={`w-52 h-52 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              timeLeft <= 3 ? "bg-destructive animate-pulse shadow-destructive/50" : "bg-accent shadow-accent/30"
            }`}
          >
            <span
              className={`text-6xl font-bold font-mono ${
                timeLeft <= 3 ? "text-destructive-foreground" : "text-accent-foreground"
              }`}
            >
              {formatTimerDisplay(timeLeft)}
            </span>
          </button>
          <p className="text-sm text-muted-foreground mt-6">Toque para parar</p>

          {/* Quick time adjust buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndTime((prev) => (prev ? prev - 10000 : null))}
              className="text-xs"
            >
              -10s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndTime((prev) => (prev ? prev + 10000 : null))}
              className="text-xs"
            >
              +10s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndTime((prev) => (prev ? prev + 30000 : null))}
              className="text-xs"
            >
              +30s
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de alterações não salvas */}
      <UnsavedChangesDialog
        open={isBlocked}
        onDiscard={handleDiscardAndNavigate}
        onSave={handleSaveAndNavigate}
        onContinue={reset}
        saving={saving}
      />

      {/* Modal de Treinos Anteriores */}
      <PreviousWorkoutsModal
        open={showPreviousWorkouts}
        onClose={() => setShowPreviousWorkouts(false)}
        onSelectWorkout={handleSelectPreviousWorkout}
        workoutType={type}
      />

      {/* Dialog de Confirmar Substituição */}
      <AlertDialog open={confirmReplaceDialog} onOpenChange={setConfirmReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir exercícios?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já tem {addedExercises.length} exercício(s) adicionado(s). 
              Deseja substituir pelos exercícios do treino anterior?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingWorkoutToLoad(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
