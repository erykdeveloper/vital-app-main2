import { ArrowLeft, Dumbbell, Home, Flame, PersonStanding, Footprints, Bike, MoreHorizontal, Zap, History } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WorkoutCardProps {
  to: string;
  icon: React.ElementType;
  label: string;
  description?: string;
}

function WorkoutCard({ to, icon: Icon, label, description }: WorkoutCardProps) {
  return (
    <Link to={to}>
      <div className="bg-card rounded-xl p-4 flex items-center gap-3 hover:bg-secondary transition-colors h-full">
        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <div className="min-w-0">
          <span className="font-medium block">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Workouts() {
  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Diário de Treinos</h1>
          <p className="text-muted-foreground text-sm">
            Escolha sua modalidade
          </p>
        </div>
      </div>

      {/* Musculação Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-accent" />
          Musculação
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <WorkoutCard
            to="/workouts/musculacao/academia"
            icon={Dumbbell}
            label="Academia"
          />
          <WorkoutCard
            to="/workouts/musculacao/em-casa"
            icon={Home}
            label="Em Casa"
          />
          <WorkoutCard
            to="/workouts/musculacao/crossfit"
            icon={Flame}
            label="CrossFit"
          />
          <WorkoutCard
            to="/workouts/musculacao/calistenia"
            icon={PersonStanding}
            label="Calistenia"
          />
        </div>
      </div>

      {/* Cardio Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Footprints className="w-5 h-5 text-accent" />
          Cardio
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <WorkoutCard
            to="/workouts/cardio/corrida"
            icon={Footprints}
            label="Corrida"
          />
          <WorkoutCard
            to="/workouts/cardio/ciclismo"
            icon={Bike}
            label="Ciclismo"
          />
          <WorkoutCard
            to="/workouts/cardio/hiit"
            icon={Zap}
            label="HIIT"
          />
          <WorkoutCard
            to="/workouts/cardio/outras"
            icon={MoreHorizontal}
            label="Outras"
          />
        </div>
      </div>

      {/* Histórico Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          Histórico
        </h2>
        <WorkoutCard
          to="/workouts/history"
          icon={History}
          label="Ver Histórico"
          description="Treinos realizados"
        />
      </div>
    </div>
  );
}