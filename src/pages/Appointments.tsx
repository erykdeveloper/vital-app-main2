import { useState } from 'react';
import { Calendar, Clock, Video, MapPin, Scale, ChevronRight, Trash2 } from 'lucide-react';
import { useMyAppointments, useCreateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const typeLabels: Record<string, string> = {
  consulta_online: 'Online',
  consulta_presencial: 'Presencial',
  bioimpedancia: 'Bioimpedância',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando contato', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Agendado', color: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Concluído', color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
};

const appointmentTypes = [
  {
    id: 'consulta_online',
    title: 'Online',
    description: 'Atendimento via videochamada',
    icon: Video,
  },
  {
    id: 'consulta_presencial',
    title: 'Presencial',
    description: 'Atendimento em consultório',
    icon: MapPin,
  },
  {
    id: 'bioimpedancia',
    title: 'Bioimpedância',
    description: 'Avaliação de composição corporal',
    icon: Scale,
  },
];

export default function Appointments() {
  const { data: appointments = [], isLoading } = useMyAppointments();
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const { toast } = useToast();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      toast({
        title: 'Solicitação cancelada',
        description: 'A consulta foi removida com sucesso.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: err.message,
      });
    }
  };

  const handleSchedule = async (type: typeof appointmentTypes[0]) => {
    setLoadingType(type.id);

    try {
      await createAppointment.mutateAsync(type.id);

      toast({
        title: 'Solicitação enviada!',
        description: 'Entraremos em contato pelo WhatsApp para confirmar.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao solicitar',
        description: err.message,
      });
    } finally {
      setLoadingType(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatScheduledInfo = (appointment: any) => {
    if (appointment.scheduled_date && appointment.scheduled_time) {
      const date = new Date(appointment.scheduled_date);
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      return `${formattedDate} às ${appointment.scheduled_time.slice(0, 5)}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agendar Consulta</h1>
        <p className="text-muted-foreground">Escolha o tipo de consulta desejada</p>
      </div>

      {/* Appointment Type Cards */}
      <div className="space-y-3">
        {appointmentTypes.map((type) => {
          const Icon = type.icon;
          const isLoading = loadingType === type.id;

          return (
            <Card
              key={type.id}
              className="cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => !isLoading && handleSchedule(type)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-accent/20">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointments History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico</h2>

        {appointments.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agende sua primeira consulta acima!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const status = statusLabels[appointment.status] || statusLabels.pending;
              const scheduledInfo = formatScheduledInfo(appointment);

              return (
                <div key={appointment.id} className="bg-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">
                      {typeLabels[appointment.type] || appointment.type}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${status.color}`}
                      >
                        {status.label}
                      </span>
                      {appointment.status === 'pending' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar solicitação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A solicitação de consulta será removida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(appointment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancelar consulta
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {scheduledInfo ? (
                      <div className="flex items-center gap-2 text-accent font-medium">
                        <Clock className="w-4 h-4" />
                        Agendado: {scheduledInfo}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Solicitado em {formatDate(appointment.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
