import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { logAudit } from "../services/audit.service.js";
import { serializeProfile } from "../utils/serializers.js";
import { getRouteParam } from "../utils/params.js";

const router = Router();

const premiumSchema = z.object({
  is_premium: z.boolean(),
});

const roleSchema = z.object({
  is_admin: z.boolean(),
});

router.use(requireAuth, requireAdmin);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        roles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      users: users
        .filter((user) => user.profile)
        .map((user) =>
          serializeProfile(
            user.profile!,
            user.email,
            user.roles.some((role) => role.role === UserRole.ADMIN),
          ),
        ),
    });
  }),
);

router.patch(
  "/users/:userId/premium",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = premiumSchema.parse(req.body);
    const userId = getRouteParam(req.params.userId, "userId");
    const profile = await prisma.profile.update({
      where: { userId },
      data: { isPremium: data.is_premium },
      include: { user: { include: { roles: true } } },
    });

    await logAudit({
      actorUserId: req.auth!.userId,
      targetUserId: profile.userId,
      action: "update_premium",
      entityType: "profile",
      entityId: profile.userId,
      details: data,
    });

    return res.json({
      profile: serializeProfile(
        profile,
        profile.user.email,
        profile.user.roles.some((role) => role.role === UserRole.ADMIN),
      ),
    });
  }),
);

router.patch(
  "/users/:userId/admin-role",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = roleSchema.parse(req.body);
    const targetUserId = getRouteParam(req.params.userId, "userId");

    if (targetUserId === req.auth!.userId && !data.is_admin) {
      return res.status(400).json({ message: "Voce nao pode remover seu proprio acesso admin" });
    }

    if (data.is_admin) {
      await prisma.userRoleAssignment.upsert({
        where: {
          userId_role: {
            userId: targetUserId,
            role: UserRole.ADMIN,
          },
        },
        update: {},
        create: {
          userId: targetUserId,
          role: UserRole.ADMIN,
          createdBy: req.auth!.userId,
        },
      });
    } else {
      await prisma.userRoleAssignment.deleteMany({
        where: {
          userId: targetUserId,
          role: UserRole.ADMIN,
        },
      });
    }

    await logAudit({
      actorUserId: req.auth!.userId,
      targetUserId,
      action: data.is_admin ? "grant_role" : "revoke_role",
      entityType: "user_role",
      entityId: targetUserId,
      details: { role: "ADMIN" },
    });

    return res.status(204).send();
  }),
);

router.get(
  "/audit-logs",
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({ logs });
  }),
);

router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status.toLowerCase(),
        total_cents: order.totalCents,
        currency: order.currency,
        customer_email: order.customerEmail,
        customer_name: order.customerName,
        user_id: order.userId,
        created_at: order.createdAt,
        paid_at: order.paidAt,
        items: order.items.map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          total_cents: item.totalCents,
        })),
        payments: order.payments.map((payment) => ({
          id: payment.id,
          provider: payment.provider.toLowerCase(),
          method: payment.method.toLowerCase(),
          status: payment.status.toLowerCase(),
          amount_cents: payment.amountCents,
          provider_payment_id: payment.providerPaymentId,
          created_at: payment.createdAt,
        })),
      })),
    });
  }),
);

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      products: products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price_cents: product.priceCents,
        currency: product.currency,
        status: product.status.toLowerCase(),
        billing_cycle: product.billingCycle.toLowerCase(),
        grants_premium: product.grantsPremium,
        metadata: product.metadata,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      })),
    });
  }),
);

router.delete(
  "/users/:userId",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetUserId = getRouteParam(req.params.userId, "userId");

    if (targetUserId === req.auth!.userId) {
      return res.status(400).json({ message: "Voce nao pode excluir sua propria conta admin" });
    }

    await logAudit({
      actorUserId: req.auth!.userId,
      targetUserId,
      action: "delete_user",
      entityType: "user",
      entityId: targetUserId,
    });

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return res.status(204).send();
  }),
);

export { router as adminRouter };
