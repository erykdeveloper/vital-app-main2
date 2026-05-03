import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRouteParam } from "../utils/params.js";
import {
  connectWearable,
  disconnectWearable,
  getWearableSummary,
  markAllWearableNotificationsRead,
  markWearableNotificationRead,
  serializeWearableProvider,
  syncWearable,
} from "../services/wearables.service.js";

const router = Router();

const providerSchema = z.enum(["apple_health", "google_fit", "garmin", "fitbit"]);
const connectSchema = z.object({
  provider: providerSchema,
  device_name: z.string().trim().min(1).max(120).nullable().optional(),
  external_account_label: z.string().trim().max(160).nullable().optional(),
});

router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await getWearableSummary(req.auth!.userId);
    return res.json({ summary });
  }),
);

router.post(
  "/connect",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = connectSchema.parse(req.body);
    const summary = await connectWearable({
      userId: req.auth!.userId,
      provider: serializeWearableProvider(data.provider),
      deviceName: data.device_name,
      externalAccountLabel: data.external_account_label,
    });

    return res.status(201).json({ summary });
  }),
);

router.post(
  "/sync",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await syncWearable(req.auth!.userId);

    if (!summary) {
      return res.status(404).json({ message: "Nenhum relogio conectado" });
    }

    return res.json({ summary });
  }),
);

router.delete(
  "/connection",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await disconnectWearable(req.auth!.userId);
    return res.json({ summary });
  }),
);

router.patch(
  "/notifications/:id/read",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const notificationId = getRouteParam(req.params.id, "id");
    const summary = await markWearableNotificationRead(req.auth!.userId, notificationId);
    return res.json({ summary });
  }),
);

router.post(
  "/notifications/read-all",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await markAllWearableNotificationsRead(req.auth!.userId);
    return res.json({ summary });
  }),
);

export { router as wearablesRouter };
