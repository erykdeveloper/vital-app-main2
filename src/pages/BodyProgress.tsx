import { useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAchievements } from '@/hooks/useAchievements';
import { useBioimpedance } from '@/hooks/useBioimpedance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MetricRow } from '@/components/bioimpedance/MetricRow';
import { EvolutionChart } from '@/components/bioimpedance/EvolutionChart';
import { PostureAnalysis } from '@/components/bioimpedance/PostureAnalysis';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BodyProgress() {
  const { profile, loading } = useProfile();
  const { userAchievements, loading: achievementsLoading } = useAchievements();
  const { records, latestRecord, previousRecord, loading: bioLoading, getDifference, hasRecords } = useBioimpedance();
  const navigate = useNavigate();
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [compareRecordId, setCompareRecordId] = useState<string | null>(null);

  // Redirect non-premium users
  if (!loading && profile && !profile.is_premium) {
    navigate('/');
    return null;
  }

  if (loading || achievementsLoading || bioLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Get selected record or latest
  const selectedRecord = selectedRecordId 
    ? records.find(r => r.id === selectedRecordId) || latestRecord
    : latestRecord;
  
  // Get comparison record
  const compareRecord = compareRecordId
    ? records.find(r => r.id === compareRecordId)
    : previousRecord;

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/profile" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Progresso Corporal</h1>
      </div>

      {/* Exam Selector */}
      {hasRecords && (
        <div className="bg-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Exames registrados: {records.length}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Exame principal</label>
              <Select 
                value={selectedRecordId || latestRecord?.id || ''} 
                onValueChange={setSelectedRecordId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar exame" />
                </SelectTrigger>
                <SelectContent>
                  {records.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {records.length > 1 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Comparar com</label>
                <Select 
                  value={compareRecordId || previousRecord?.id || ''} 
                  onValueChange={setCompareRecordId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecionar exame" />
                  </SelectTrigger>
                  <SelectContent>
                    {records
                      .filter(r => r.id !== (selectedRecordId || latestRecord?.id))
                      .map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial Weight Card */}
      <div className="bg-card p-4 rounded-2xl space-y-1">
        <p className="text-base">
          Peso inicial: <span className="font-semibold">{profile?.weight_kg || '--'} kg</span>
        </p>
        {selectedRecord && (
          <p className="text-base">
            Peso atual: <span className="font-semibold">{selectedRecord.weight_kg || '--'} kg</span>
            {compareRecord?.weight_kg && selectedRecord.weight_kg && (
              <span className={`ml-2 text-sm ${
                getDifference(selectedRecord.weight_kg, compareRecord.weight_kg)! < 0 
                  ? 'text-green-500' 
                  : getDifference(selectedRecord.weight_kg, compareRecord.weight_kg)! > 0 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
              }`}>
                ({getDifference(selectedRecord.weight_kg, compareRecord.weight_kg)! >= 0 ? '+' : ''}
                {getDifference(selectedRecord.weight_kg, compareRecord.weight_kg)} kg)
              </span>
            )}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Data de entrada: {profile?.entry_date 
            ? format(new Date(profile.entry_date), 'dd/MM/yyyy') 
            : '--/--/----'}
        </p>
      </div>

      {/* Evolution Chart */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Evolução</h2>
        <EvolutionChart records={records} />
      </div>

      {/* Body Composition Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Composição Corporal</h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Indicador</span>
            <span className="text-sm font-semibold text-foreground text-center">Valor</span>
            <span className="text-sm font-semibold text-foreground text-right">Padrão</span>
          </div>
          
          <div className="divide-y divide-border">
            <MetricRow 
              label="Peso" 
              value={selectedRecord?.weight_kg} 
              unit=" kg"
              previousValue={compareRecord?.weight_kg}
              standard={profile ? `${(profile.height_cm / 100 * profile.height_cm / 100 * 18.5).toFixed(0)} - ${(profile.height_cm / 100 * profile.height_cm / 100 * 24.9).toFixed(0)} kg` : '--'}
              isLowerBetter={true}
            />
            <MetricRow 
              label="IMC" 
              value={selectedRecord?.bmi} 
              previousValue={compareRecord?.bmi}
              standard="18.5 - 24.9"
              isLowerBetter={true}
            />
            <MetricRow 
              label="Gordura Corporal" 
              value={selectedRecord?.body_fat_percent} 
              unit="%"
              previousValue={compareRecord?.body_fat_percent}
              standard="15 - 25%"
              isLowerBetter={true}
            />
            <MetricRow 
              label="Massa Muscular" 
              value={selectedRecord?.muscle_percent} 
              unit="%"
              previousValue={compareRecord?.muscle_percent}
              standard="40 - 50%"
              isLowerBetter={false}
            />
            <MetricRow 
              label="Peso Muscular" 
              value={selectedRecord?.muscle_mass_kg} 
              unit=" kg"
              previousValue={compareRecord?.muscle_mass_kg}
              isLowerBetter={false}
            />
            <MetricRow 
              label="Água Corporal" 
              value={selectedRecord?.water_percent} 
              unit="%"
              previousValue={compareRecord?.water_percent}
              standard="50 - 65%"
              isLowerBetter={false}
            />
            <MetricRow 
              label="Massa Livre de Gordura" 
              value={selectedRecord?.fat_free_mass_kg} 
              unit=" kg"
              previousValue={compareRecord?.fat_free_mass_kg}
              isLowerBetter={false}
            />
            <MetricRow 
              label="Gordura Subcutânea" 
              value={selectedRecord?.subcutaneous_fat_percent} 
              unit="%"
              previousValue={compareRecord?.subcutaneous_fat_percent}
              isLowerBetter={true}
            />
            <MetricRow 
              label="Gordura Visceral" 
              value={selectedRecord?.visceral_fat} 
              previousValue={compareRecord?.visceral_fat}
              standard="1 - 9"
              isLowerBetter={true}
            />
            <MetricRow 
              label="Proteína" 
              value={selectedRecord?.protein_percent} 
              unit="%"
              previousValue={compareRecord?.protein_percent}
              standard="16 - 20%"
              isLowerBetter={false}
            />
            <MetricRow 
              label="Massa Óssea" 
              value={selectedRecord?.bone_mass_kg} 
              unit=" kg"
              previousValue={compareRecord?.bone_mass_kg}
              isLowerBetter={false}
            />
          </div>
        </div>
      </div>

      {/* Obesity Analysis */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Análise de Obesidade</h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Indicador</span>
            <span className="text-sm font-semibold text-foreground text-center">Valor</span>
            <span className="text-sm font-semibold text-foreground text-right">Padrão</span>
          </div>
          
          <div className="divide-y divide-border">
            <MetricRow 
              label="Peso da Gordura" 
              value={selectedRecord?.fat_weight_kg} 
              unit=" kg"
              previousValue={compareRecord?.fat_weight_kg}
              isLowerBetter={true}
            />
            <MetricRow 
              label="Relação Cintura-Quadril" 
              value={selectedRecord?.waist_hip_ratio} 
              previousValue={compareRecord?.waist_hip_ratio}
              standard="< 0.90"
              isLowerBetter={true}
            />
            <MetricRow 
              label="TMB (Metab. Basal)" 
              value={selectedRecord?.bmr_kcal} 
              unit=" kcal"
              previousValue={compareRecord?.bmr_kcal}
              showDifference={false}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {selectedRecord && (selectedRecord.ideal_weight_kg || selectedRecord.weight_control_tip || selectedRecord.fat_control_tip || selectedRecord.muscle_control_tip) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recomendações</h2>
          <div className="bg-card rounded-2xl p-4 space-y-3">
            {selectedRecord.ideal_weight_kg && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Peso Ideal</span>
                <span className="text-sm font-medium">{selectedRecord.ideal_weight_kg} kg</span>
              </div>
            )}
            {selectedRecord.weight_control_tip && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Controle de Peso</span>
                <span className={`text-sm font-medium ${selectedRecord.weight_control_tip < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {selectedRecord.weight_control_tip > 0 ? '+' : ''}{selectedRecord.weight_control_tip} kg
                </span>
              </div>
            )}
            {selectedRecord.fat_control_tip && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Controle de Gordura</span>
                <span className={`text-sm font-medium ${selectedRecord.fat_control_tip < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {selectedRecord.fat_control_tip > 0 ? '+' : ''}{selectedRecord.fat_control_tip} kg
                </span>
              </div>
            )}
            {selectedRecord.muscle_control_tip && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ganho de Massa</span>
                <span className={`text-sm font-medium ${selectedRecord.muscle_control_tip > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedRecord.muscle_control_tip > 0 ? '+' : ''}{selectedRecord.muscle_control_tip} kg
                </span>
              </div>
            )}
            {selectedRecord.daily_calories && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Calorias Diárias</span>
                <span className="text-sm font-medium">{selectedRecord.daily_calories} kcal</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body Measurements */}
      {selectedRecord && (selectedRecord.waist_cm || selectedRecord.hip_cm || selectedRecord.arm_cm || selectedRecord.thigh_cm) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Medidas Corporais</h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Região</span>
              <span className="text-sm font-semibold text-foreground text-center">Medida</span>
              <span className="text-sm font-semibold text-foreground text-right">Variação</span>
            </div>
            
            <div className="divide-y divide-border">
              <MetricRow 
                label="Cintura" 
                value={selectedRecord?.waist_cm} 
                unit=" cm"
                previousValue={compareRecord?.waist_cm}
                isLowerBetter={true}
              />
              <MetricRow 
                label="Quadril" 
                value={selectedRecord?.hip_cm} 
                unit=" cm"
                previousValue={compareRecord?.hip_cm}
                isLowerBetter={true}
              />
              <MetricRow 
                label="Braço" 
                value={selectedRecord?.arm_cm} 
                unit=" cm"
                previousValue={compareRecord?.arm_cm}
                isLowerBetter={false}
              />
              <MetricRow 
                label="Coxa" 
                value={selectedRecord?.thigh_cm} 
                unit=" cm"
                previousValue={compareRecord?.thigh_cm}
                isLowerBetter={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Posture Analysis */}
      {selectedRecord && (selectedRecord.shoulder_imbalance_cm !== null || selectedRecord.spine_curvature_cm !== null || selectedRecord.head_forward_degrees !== null) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Avaliação Postural</h2>
          <PostureAnalysis record={selectedRecord} previousRecord={compareRecord} />
        </div>
      )}

      {/* Achievements Card */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Minhas Conquistas</h2>
        <div className="bg-card p-4 rounded-2xl">
          {userAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conquista ainda.</p>
          ) : (
            <div className="space-y-3">
              {userAchievements.map((ua) => (
                <div
                  key={ua.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-accent/20"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center border-2 border-accent shrink-0">
                    <span className="text-xl">{ua.achievement.icon || '🏆'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-accent">{ua.achievement.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ua.achievement.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {format(new Date(ua.unlocked_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="space-y-4 mt-6">
        <p className="text-center text-muted-foreground text-sm">
          {hasRecords 
            ? 'Agende sua próxima bioimpedância para acompanhar sua evolução.'
            : 'Para acompanhar sua evolução corporal, é necessário realizar sua bioimpedância com a equipe Vitalissy.'}
        </p>
        <div className="flex justify-center">
          <Link 
            to="/schedule/bioimpedancia"
            className="w-full max-w-md bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-4 rounded-xl text-center transition-colors"
          >
            Agendar Bioimpedância
          </Link>
        </div>
      </div>
    </div>
  );
}
