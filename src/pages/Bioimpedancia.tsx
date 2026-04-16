import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Bioimpedancia() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Bioimpedância</h1>
      </div>

      {/* Last Exam Card */}
      <div className="bg-card p-4 rounded-2xl space-y-1">
        <p className="text-base">Último exame: --</p>
        <p className="text-sm text-muted-foreground">Comparativo com anterior: --</p>
      </div>

      {/* Orientations Card */}
      <div className="bg-card p-4 rounded-2xl space-y-2">
        <p className="text-base font-medium">Orientações</p>
        <p className="text-sm text-muted-foreground">
          Prepare-se para o exame mantendo jejum de 4 horas, evitando exercícios intensos 24h antes e mantendo boa hidratação.
        </p>
      </div>
    </div>
  );
}
