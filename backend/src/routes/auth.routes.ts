import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { serializeProfile, serializeUser } from "../utils/serializers.js";

const router = Router();

const registerSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  age: z.number().int().positive(),
  height_cm: z.number().int().positive(),
  weight_kg: z.number().positive(),
  password: z.string().min(6),
  account_type: z.enum(["client", "personal"]).default("client"),
  trainer_application: z
    .object({
      cref: z.string().min(3),
      cref_state: z.string().min(2).max(2),
      specialties: z.string().trim().max(200).optional().nullable(),
      experience_years: z.number().int().min(0).max(80).optional().nullable(),
      instagram_handle: z.string().trim().max(100).optional().nullable(),
      proof_notes: z.string().trim().max(500).optional().nullable(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.account_type === "personal" && !data.trainer_application) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["trainer_application"],
      message: "Informe os dados para validar seu cadastro como personal",
    });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ message: "Email ja cadastrado" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            fullName: data.full_name,
            phone: data.phone ?? null,
            age: data.age,
            heightCm: data.height_cm,
            weightKg: data.weight_kg.toString(),
            entryDate: new Date(),
          },
        },
        trainerApplication:
          data.account_type === "personal"
            ? {
                create: {
                  fullName: data.full_name,
                  cref: data.trainer_application?.cref ?? "",
                  crefState: data.trainer_application?.cref_state ?? "",
                  specialties: data.trainer_application?.specialties ?? null,
                  experienceYears: data.trainer_application?.experience_years ?? null,
                  instagramHandle: data.trainer_application?.instagram_handle ?? null,
                  proofNotes: data.trainer_application?.proof_notes ?? null,
                },
              }
            : undefined,
      },
      include: {
        profile: true,
        roles: true,
        trainerApplication: true,
      },
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.role),
    });

    const achievement = await prisma.achievement.findFirst({
      where: { name: { equals: "Mudanca de Vida", mode: "insensitive" } },
    });

    if (achievement) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: achievement.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          achievementId: achievement.id,
        },
      });
    }

    return res.status(201).json({
      token,
      user: serializeUser(user, user.roles.map((role) => role.role)),
      profile: user.profile
        ? serializeProfile(user.profile, user.email, {
            isAdmin: user.roles.some((role) => role.role === UserRole.ADMIN),
            isPersonalTrainer: user.roles.some((role) => role.role === UserRole.PERSONAL_TRAINER),
            trainerApplicationStatus: user.trainerApplication?.status ?? null,
            trainerApplicationId: user.trainerApplication?.id ?? null,
          })
        : null,
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        profile: true,
        roles: true,
        trainerApplication: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    const matches = await bcrypt.compare(data.password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    const roles = user.roles.map((entry) => entry.role);
    const token = signToken({
      sub: user.id,
      email: user.email,
      roles,
    });

    return res.json({
      token,
      user: serializeUser(user, roles),
      profile: user.profile
        ? serializeProfile(user.profile, user.email, {
            isAdmin: roles.includes(UserRole.ADMIN),
            isPersonalTrainer: roles.includes(UserRole.PERSONAL_TRAINER),
            trainerApplicationStatus: user.trainerApplication?.status ?? null,
            trainerApplicationId: user.trainerApplication?.id ?? null,
          })
        : null,
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: {
        profile: true,
        roles: true,
        trainerApplication: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    const roles = user.roles.map((entry) => entry.role);

    return res.json({
      user: serializeUser(user, roles),
      profile: user.profile
        ? serializeProfile(user.profile, user.email, {
            isAdmin: roles.includes(UserRole.ADMIN),
            isPersonalTrainer: roles.includes(UserRole.PERSONAL_TRAINER),
            trainerApplicationStatus: user.trainerApplication?.status ?? null,
            trainerApplicationId: user.trainerApplication?.id ?? null,
          })
        : null,
    });
  }),
);

export { router as authRouter };
