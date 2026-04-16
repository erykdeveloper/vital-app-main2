import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { UserRole } from "@prisma/client";
import multer from "multer";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { serializeProfile } from "../utils/serializers.js";

const router = Router();

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, env.UPLOAD_DIR),
  filename: (req: AuthenticatedRequest, file, callback) => {
    const ext = path.extname(file.originalname) || ".jpg";
    callback(null, `${req.auth!.userId}-avatar${ext}`);
  },
});

const upload = multer({ storage });

const updateSchema = z.object({
  full_name: z.string().min(3).optional(),
  phone: z.string().nullable().optional(),
  age: z.number().int().positive().optional(),
  height_cm: z.number().int().positive().optional(),
  weight_kg: z.number().positive().optional(),
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { profile: true, roles: true },
    });

    if (!user?.profile) {
      return res.status(404).json({ message: "Perfil nao encontrado" });
    }

    return res.json({
      profile: serializeProfile(
        user.profile,
        user.email,
        user.roles.some((role) => role.role === UserRole.ADMIN),
      ),
    });
  }),
);

router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = updateSchema.parse(req.body);
    const profile = await prisma.profile.update({
      where: { userId: req.auth!.userId },
      data: {
        fullName: data.full_name,
        phone: data.phone,
        age: data.age,
        heightCm: data.height_cm,
        weightKg: data.weight_kg?.toString(),
      },
    });

    return res.json({
      profile: serializeProfile(profile, req.auth!.email, req.auth!.roles.includes(UserRole.ADMIN)),
    });
  }),
);

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Arquivo nao enviado" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const profile = await prisma.profile.update({
      where: { userId: req.auth!.userId },
      data: { avatarUrl },
    });

    return res.json({
      profile: serializeProfile(profile, req.auth!.email, req.auth!.roles.includes(UserRole.ADMIN)),
    });
  }),
);

export { router as profileRouter };
