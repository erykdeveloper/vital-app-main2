import { ArrowLeft, Syringe, Plus, Calendar, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InjectablesAnalytics } from '@/components/injectables/InjectablesAnalytics';

const locationLabels: Record<string, string> = {
  abdomen: 'Abdômen',
  coxa: 'Coxa',
  braco: 'Braço',
};

const bodyLocations = [
  { value: 'abdomen', label: 'Abdômen' },
  { value: 'coxa', label: 'Coxa' },
  { value: 'braco', label: 'Braço' },
];

interface Injectable {
  id: string;
  user_id: string;
  medication: string;
  dose: string;
  date: string;
  time: string;
  location: string;
  notes: string | null;
  created_at: string;
}

export default function Injectables() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingInjectable, setEditingInjectable] = useState<Injectable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit form state
  const [editMedication, setEditMedication] = useState('');
  const [editDose, setEditDose] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: injectables, isLoading: loadingInjectables } = useQuery({
    queryKey: ['injectables'],
    queryFn: async () => {
      const response = await api.get<{ injectables: Injectable[] }>('/injectables');
      return response.injectables;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/injectables/${id}`, {
          medication: editMedication,
          dose: editDose,
          date: editDate,
          time: editTime,
          location: editLocation,
          notes: editNotes || null,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injectables'] });
      toast.success('Aplicação atualizada!');
      setEditingInjectable(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/injectables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injectables'] });
      toast.success('Aplicação excluída!');
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });

  const openEditModal = (injectable: Injectable) => {
    setEditMedication(injectable.medication);
    setEditDose(injectable.dose);
    setEditDate(injectable.date);
    setEditTime(injectable.time);
    setEditLocation(injectable.location);
    setEditNotes(injectable.notes || '');
    setEditingInjectable(injectable);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInjectable) return;
    if (!editMedication || !editDose || !editDate || !editTime || !editLocation) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateMutation.mutate(editingInjectable.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!profile?.is_premium) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Monitoramento de Injetáveis</h1>
            <p className="text-muted-foreground text-sm">Gerencie suas aplicações</p>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {injectables && <InjectablesAnalytics injectables={injectables} />}

      {/* Add Button */}
      <Button 
        onClick={() => navigate('/injectables/new')}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Aplicação
      </Button>

      {/* List */}
      {loadingInjectables ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : injectables && injectables.length > 0 ? (
        <div className="space-y-4">
          {injectables.map((injectable) => (
            <div key={injectable.id} className="bg-card rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <Syringe className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{injectable.medication}</h3>
                    <p className="text-sm text-muted-foreground">{injectable.dose}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(injectable)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(injectable.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(injectable.date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{injectable.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{locationLabels[injectable.location] || injectable.location}</span>
                </div>
              </div>

              {injectable.notes && (
                <p className="text-sm text-muted-foreground border-t border-border pt-2">
                  {injectable.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
            <Syringe className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma aplicação registrada</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Comece a registrar suas aplicações para acompanhar seu histórico.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingInjectable} onOpenChange={(open) => !open && setEditingInjectable(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aplicação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-medication">Medicamento *</Label>
              <Input
                id="edit-medication"
                value={editMedication}
                onChange={(e) => setEditMedication(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dose">Dose *</Label>
              <Input
                id="edit-dose"
                value={editDose}
                onChange={(e) => setEditDose(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Data *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Horário *</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Local de Aplicação *</Label>
              <Select value={editLocation} onValueChange={setEditLocation}>
                <SelectTrigger>
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
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingInjectable(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aplicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A aplicação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
