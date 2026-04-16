import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const bodyLocations = [
  { value: 'abdomen', label: 'Abdômen' },
  { value: 'coxa', label: 'Coxa' },
  { value: 'braco', label: 'Braço' },
];

const medications = [
  'Mounjaro (Tirzepatida)',
  'Ozempic (Semaglutida)',
  'Wegovy (Semaglutida)',
  'Saxenda (Liraglutida)',
  'Trizepatide (Compounded)',
  'Testosterone Cipionate',
  'Testosterone Enanthate',
  'Deposteron',
  'Durateston',
  'Oxandrolona (Compounded)',
  'Nandrolona (Deca)',
  'Boldenona',
  'Vitamin B12 (Cyanocobalamin)',
  'Vitamin D3 Injectable',
  'Complexo B',
  'Glutathione',
  'L-Carnitine Injectable',
  'Lipotropic IM',
  'Metabolic Blend IM',
  'Detox Blend IM',
];

export default function NewInjectable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedMedication, setSelectedMedication] = useState('');
  const [customMedication, setCustomMedication] = useState('');
  const [dose, setDose] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const medication = selectedMedication === 'other' ? customMedication : selectedMedication;

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/injectables', {
        medication,
        dose,
        date,
        time,
        location,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injectables'] });
      toast.success('Aplicação registrada com sucesso!');
      navigate('/injectables');
    },
    onError: (error) => {
      toast.error('Erro ao salvar aplicação: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication || !dose || !date || !time || !location) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/injectables" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Aplicação</h1>
          <p className="text-muted-foreground text-sm">Registre sua aplicação</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication">Medicamento *</Label>
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med} value={med}>
                    {med}
                  </SelectItem>
                ))}
                <SelectItem value="other">Outro (digitar manualmente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedMedication === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customMedication">Nome do Medicamento *</Label>
              <Input
                id="customMedication"
                placeholder="Digite o nome do medicamento"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                className="bg-background"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dose">Dose *</Label>
            <Input
              id="dose"
              placeholder="Ex: 0.5ml, 100mg"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local de Aplicação *</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {bodyLocations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionais (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background min-h-[100px]"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Salvando...' : 'Salvar Aplicação'}
        </Button>
      </form>
    </div>
  );
}
