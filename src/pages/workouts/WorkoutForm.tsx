import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Dumbbell, Clock, Flame, Home, PersonStanding, RotateCcw, History } from "lucide-react";
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
    if (!currentExercise.name.trim()) {
      toast.error("Informe o nome do exercício");
      return;
    }

    if (editingIndex !== null) {
      // Modo edição: atualizar exercício existente
      const updated = [...addedExercises];
      updated[editingIndex] = currentExercise;
      setAddedExercises(updated);
      setEditingIndex(null);
      toast.success("Exercício atualizado!");
    } else {
      // Modo novo: adicionar à lista
      setAddedExercises([...addedExercises, currentExercise]);
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
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (!objective.trim()) {
      toast.error("Informe o tipo de treino");
      return;
    }

    if (addedExercises.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    const totalMinutes =
      (Number(durationHours) || 0) * 60 + (Number(durationMin) || 0) + (Number(durationSec) || 0) / 60;

    setSaving(true);
    try {
      const workoutData = {
        user_id: user.id,
        date: today.toISOString().split("T")[0],
        objective: objective.trim(),
        duration_min: totalMinutes > 0 ? Math.round(totalMinutes * 100) / 100 : null,
        calories: calories || null,
        exercises: addedExercises as unknown,
        workout_type: type,
      };

      await api.post('/workouts/strength', workoutData);

      toast.success("Treino salvo com sucesso!");
      clearDraft();
      setObjective("");
      setAddedExercises([]);
      setCurrentExercise({ ...emptyExercise });
      setEditingIndex(null);
      setDurationHours("");
      setDurationMin("");
      setDurationSec("");
      setCalories("");
    } catch (error: any) {
      const message = error.message || '';
      
      if (message.includes('Load Failed') || 
          message.includes('NetworkError') ||
          message.includes('fetch') ||
          message.includes('network')) {
        toast.error('Erro de conexão. Seus dados estão salvos localmente. Tente novamente.');
      } else {
        toast.error('Erro ao salvar treino: ' + message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar e navegar (usado no dialog de alterações não salvas)
  const handleSaveAndNavigate = async () => {
    await handleSaveWorkout();
    proceed();
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

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/workouts" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{config.label}</h1>
            <p className="text-muted-foreground text-sm">
              {getDayOfWeek(today)}, {formatDate(today)}
            </p>
          </div>
        </div>
      </div>

      {/* Workout Form */}
      <div className="bg-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-accent" />
          </div>
          <Label className="text-lg font-semibold">Treino do dia</Label>
        </div>
        <Input
          placeholder="Peito/Tríceps…"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="bg-background border-border"
        />

        {/* Botões de Repetir Treino */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRepeatLastWorkout}
            disabled={loadingLastWorkout}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {loadingLastWorkout ? "Buscando..." : "Repetir Último"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreviousWorkouts(true)}
            className="flex-1"
          >
            <History className="w-4 h-4 mr-2" />
            Ver Anteriores
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Lista de Exercícios Adicionados */}
        {addedExercises.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Exercícios Adicionados ({addedExercises.length})
              </Label>
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
            <div className="border-t border-border" />
          </div>
        )}

        {/* Formulário para Novo Exercício */}
        <ExerciseInputForm
          currentExercise={currentExercise}
          onExerciseChange={setCurrentExercise}
          onAddExercise={handleAddCurrentExercise}
          onCancelEdit={handleCancelEdit}
          isEditing={editingIndex !== null}
        />

        {/* Rest Timer Settings */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Definir descanso:</span>
            <Select
              value={restTime.toString()}
              onValueChange={(value) => setRestTime(Number(value))}
              disabled={isResting}
            >
              <SelectTrigger className="w-[70px] h-7 bg-background text-xs">
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
          </div>
        </div>
      </div>

      {/* Workout Summary */}
      <div className="bg-card rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Resumo do Treino</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <Label className="text-sm">Duração</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  maxLength={2}
                  value={durationHours === "" ? "" : durationHours}
                  onChange={(e) => handleDurationInput(e.target.value, 23, setDurationHours)}
                  className="bg-background border-border pr-6"
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
                  className="bg-background border-border pr-7"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  maxLength={2}
                  value={durationSec === "" ? "" : durationSec}
                  onChange={(e) => handleDurationInput(e.target.value, 59, setDurationSec)}
                  className="bg-background border-border pr-6"
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
              className="bg-background border-border"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveWorkout}
        disabled={saving || addedExercises.length === 0}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold"
      >
        {saving ? "Salvando..." : `Salvar Treino (${addedExercises.length} exercícios)`}
      </Button>

      {/* Floating Timer Button - Always visible */}
      {!showTimerOverlay && (
        <button
          onClick={() => {
            if (!isResting) {
              startRest();
            }
            setShowTimerOverlay(true);
          }}
          className={`fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            isResting ? "bg-accent animate-pulse" : "bg-card border-2 border-accent hover:scale-110"
          }`}
        >
          {isResting ? (
            <span className="text-sm font-bold font-mono text-accent-foreground">{formatTimerDisplay(timeLeft)}</span>
          ) : (
            <span className="text-3xl">🖐️</span>
          )}
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
  );
}
