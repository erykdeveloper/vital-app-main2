import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Appointment {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

// Admin: fetch all appointments with user info (queries separadas para evitar erro de FK)
export function useAllAppointments() {
  return useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => {
      const response = await api.get<{ appointments: Appointment[] }>('/appointments/admin');
      return response.appointments;
    },
  });
}

// Admin: count pending appointments
export function usePendingAppointmentsCount() {
  return useQuery({
    queryKey: ['appointments', 'pending-count'],
    queryFn: async () => {
      const response = await api.get<{ appointments: Appointment[] }>('/appointments/admin');
      return response.appointments.filter((appointment) => appointment.status === 'pending').length;
    },
  });
}

// User: fetch own appointments
export function useMyAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', 'my', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await api.get<{ appointments: Appointment[] }>('/appointments/mine');
      return response.appointments;
    },
    enabled: !!user,
  });
}

// User: create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (type: string) => {
      if (!user) throw new Error('User not authenticated');
      const response = await api.post<{ appointment: Appointment }>('/appointments/mine', { type });
      return response.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Admin: update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      scheduled_date,
      scheduled_time,
      status,
      admin_notes,
    }: {
      id: string;
      scheduled_date?: string | null;
      scheduled_time?: string | null;
      status?: string;
      admin_notes?: string | null;
    }) => {
      const response = await api.patch<{ appointment: Appointment }>(`/appointments/admin/${id}`, {
        scheduled_date: scheduled_date ?? null,
        scheduled_time: scheduled_time ?? null,
        status: status ?? undefined,
        admin_notes: admin_notes ?? null,
      });
      return response.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// User: delete pending appointment
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/appointments/mine/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
