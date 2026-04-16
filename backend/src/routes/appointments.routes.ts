import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  parseAppointmentStatus,
  parseAppointmentType,
  serializeAppointmentStatus,
  serializeAppointmentType,
} from "../utils/serializers.js";
import { logAudit } from "../services/audit.service.js";
import { getRouteParam } from "../utils/params.js";

const router = Router();

const createSchema = z.object({
  type: z.enum(["consulta_online", "consulta_presencial", "bioimpedancia"]),
});

const updateSchema = z.object({
  scheduled_date: z.string().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  admin_notes: z.string().nullable().optional(),
});

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      appointments: appointments.map((item) => ({
        ...item,
        type: parseAppointmentType(item.type),
        status: parseAppointmentStatus(item.status),
      })),
    });
  }),
);

router.post(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = createSchema.parse(req.body);
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.auth!.userId,
        type: serializeAppointmentType(data.type),
      },
    });

    return res.status(201).json({
      appointment: {
        ...appointment,
        type: parseAppointmentType(appointment.type),
        status: parseAppointmentStatus(appointment.status),
      },
    });
  }),
);

router.delete(
  "/mine/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const appointmentId = getRouteParam(req.params.id, "id");
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: req.auth!.userId,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento nao encontrado" });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({ message: "Somente agendamentos pendentes podem ser removidos" });
    }

    await prisma.appointment.delete({ where: { id: appointment.id } });

    return res.status(204).send();
  }),
);

router.get(
  "/admin",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      appointments: appointments.map((item) => ({
        id: item.id,
        user_id: item.userId,
        type: parseAppointmentType(item.type),
        status: parseAppointmentStatus(item.status),
        scheduled_date: item.scheduledDate,
        scheduled_time: item.scheduledTime,
        admin_notes: item.adminNotes,
        created_at: item.createdAt,
        profiles: item.user.profile
          ? {
              full_name: item.user.profile.fullName,
              email: item.user.email,
              phone: item.user.profile.phone,
            }
          : null,
      })),
    });
  }),
);

router.patch(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const appointmentId = getRouteParam(req.params.id, "id");
    const data = updateSchema.parse(req.body);
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledDate: data.scheduled_date ? new Date(data.scheduled_date) : null,
        scheduledTime: data.scheduled_time ?? null,
        status: data.status ? serializeAppointmentStatus(data.status) : undefined,
        adminNotes: data.admin_notes ?? null,
      },
    });

    await logAudit({
      actorUserId: req.auth!.userId,
      targetUserId: appointment.userId,
      action: "update_appointment",
      entityType: "appointment",
      entityId: appointment.id,
      details: data,
    });

    return res.json({
      appointment: {
        ...appointment,
        type: parseAppointmentType(appointment.type),
        status: parseAppointmentStatus(appointment.status),
      },
    });
  }),
);

export { router as appointmentsRouter };
