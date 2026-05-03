import crypto from "node:crypto";
import {
  Prisma,
  WearableConnectionStatus,
  WearableNotificationSeverity,
  WearableNotificationType,
  WearableProvider,
  type WearableConnection,
  type WearableNotification,
  type WearableReading,
} from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const SECRET_VERSION = "v1";

const providerLabels: Record<WearableProvider, string> = {
  [WearableProvider.APPLE_HEALTH]: "Apple Health",
  [WearableProvider.GOOGLE_FIT]: "Google Fit",
  [WearableProvider.GARMIN]: "Garmin",
  [WearableProvider.FITBIT]: "Fitbit",
};

const providerDeviceNames: Record<WearableProvider, string> = {
  [WearableProvider.APPLE_HEALTH]: "Apple Watch",
  [WearableProvider.GOOGLE_FIT]: "Wear OS",
  [WearableProvider.GARMIN]: "Garmin Watch",
  [WearableProvider.FITBIT]: "Fitbit",
};

function encryptionKey() {
  return crypto.createHash("sha256").update(env.JWT_SECRET).digest();
}

function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [SECRET_VERSION, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

function providerOffset(provider: WearableProvider) {
  const offsets: Record<WearableProvider, number> = {
    [WearableProvider.APPLE_HEALTH]: 0,
    [WearableProvider.GOOGLE_FIT]: 2,
    [WearableProvider.GARMIN]: -1,
    [WearableProvider.FITBIT]: 1,
  };

  return offsets[provider];
}

function buildDemoReading(provider: WearableProvider) {
  const offset = providerOffset(provider);
  const minuteOffset = new Date().getMinutes() % 7;

  return {
    heartRateBpm: 76 + offset + minuteOffset,
    restingHeartRateBpm: 62 + offset,
    hrvMs: 48 - offset,
    spo2Percent: new Prisma.Decimal(97),
    activeCalories: 486 + offset * 12 + minuteOffset * 4,
    steps: 8420 + minuteOffset * 28,
    sleepMinutes: 444 + offset * 6,
    recoveryScore: 82 - Math.abs(offset),
    stressScore: 28 + Math.abs(offset),
    batteryPercent: 76 - minuteOffset,
  };
}

function serializeConnection(connection: WearableConnection | null) {
  if (!connection) return null;

  return {
    id: connection.id,
    provider: parseWearableProvider(connection.provider),
    provider_label: providerLabels[connection.provider],
    status: connection.status.toLowerCase(),
    device_name: connection.deviceName,
    external_account_label: connection.externalAccountLabel,
    consent_version: connection.consentVersion,
    connected_at: connection.connectedAt,
    last_sync_at: connection.lastSyncAt,
    disconnected_at: connection.disconnectedAt,
  };
}

function serializeReading(reading: WearableReading | null) {
  if (!reading) return null;

  return {
    id: reading.id,
    provider: parseWearableProvider(reading.provider),
    recorded_at: reading.recordedAt,
    heart_rate_bpm: reading.heartRateBpm,
    resting_heart_rate_bpm: reading.restingHeartRateBpm,
    hrv_ms: reading.hrvMs,
    spo2_percent: reading.spo2Percent ? Number(reading.spo2Percent) : null,
    active_calories: reading.activeCalories,
    steps: reading.steps,
    sleep_minutes: reading.sleepMinutes,
    recovery_score: reading.recoveryScore,
    stress_score: reading.stressScore,
    battery_percent: reading.batteryPercent,
  };
}

function serializeNotification(notification: WearableNotification) {
  return {
    id: notification.id,
    type: notification.type.toLowerCase(),
    severity: notification.severity.toLowerCase(),
    title: notification.title,
    message: notification.message,
    is_read: notification.isRead,
    read_at: notification.readAt,
    created_at: notification.createdAt,
    metadata: notification.metadata,
  };
}

export function serializeWearableSummary(input: {
  connection: WearableConnection | null;
  latestReading: WearableReading | null;
  notifications: WearableNotification[];
  unreadCount: number;
}) {
  return {
    connection: serializeConnection(input.connection),
    latest_reading: serializeReading(input.latestReading),
    notifications: input.notifications.map(serializeNotification),
    unread_count: input.unreadCount,
  };
}

export function serializeWearableProvider(provider: string) {
  const mapping: Record<string, WearableProvider> = {
    apple_health: WearableProvider.APPLE_HEALTH,
    google_fit: WearableProvider.GOOGLE_FIT,
    garmin: WearableProvider.GARMIN,
    fitbit: WearableProvider.FITBIT,
  };

  return mapping[provider];
}

export function parseWearableProvider(provider: WearableProvider) {
  const mapping: Record<WearableProvider, string> = {
    [WearableProvider.APPLE_HEALTH]: "apple_health",
    [WearableProvider.GOOGLE_FIT]: "google_fit",
    [WearableProvider.GARMIN]: "garmin",
    [WearableProvider.FITBIT]: "fitbit",
  };

  return mapping[provider];
}

export async function getWearableSummary(userId: string) {
  const [connection, latestReading, notifications, unreadCount] = await Promise.all([
    prisma.wearableConnection.findFirst({
      where: { userId, status: { not: WearableConnectionStatus.DISCONNECTED } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.wearableReading.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.wearableNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.wearableNotification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return serializeWearableSummary({ connection, latestReading, notifications, unreadCount });
}

export async function connectWearable(input: {
  userId: string;
  provider: WearableProvider;
  deviceName?: string | null;
  externalAccountLabel?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  scopes?: string[];
}) {
  const now = new Date();
  const connection = await prisma.wearableConnection.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
    update: {
      status: WearableConnectionStatus.CONNECTED,
      deviceName: input.deviceName?.trim() || providerDeviceNames[input.provider],
      externalAccountLabel: input.externalAccountLabel?.trim() || null,
      ...(input.accessToken?.trim() ? { accessTokenEncrypted: encryptSecret(input.accessToken.trim()) } : {}),
      ...(input.refreshToken?.trim() ? { refreshTokenEncrypted: encryptSecret(input.refreshToken.trim()) } : {}),
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes ?? ["heart_rate", "sleep", "activity", "recovery"],
      consentVersion: "v1",
      connectedAt: now,
      lastSyncAt: now,
      disconnectedAt: null,
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      status: WearableConnectionStatus.CONNECTED,
      deviceName: input.deviceName?.trim() || providerDeviceNames[input.provider],
      externalAccountLabel: input.externalAccountLabel?.trim() || null,
      ...(input.accessToken?.trim() ? { accessTokenEncrypted: encryptSecret(input.accessToken.trim()) } : {}),
      ...(input.refreshToken?.trim() ? { refreshTokenEncrypted: encryptSecret(input.refreshToken.trim()) } : {}),
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes ?? ["heart_rate", "sleep", "activity", "recovery"],
      consentVersion: "v1",
      connectedAt: now,
      lastSyncAt: now,
    },
  });

  await createWearableReading(input.userId, connection);
  await prisma.wearableNotification.createMany({
    data: [
      {
        userId: input.userId,
        type: WearableNotificationType.CONSENT,
        severity: WearableNotificationSeverity.SUCCESS,
        title: "Relogio conectado",
        message: `${providerLabels[input.provider]} foi vinculado com permissoes de batimentos, sono e atividade.`,
        metadata: { provider: parseWearableProvider(input.provider) },
      },
      {
        userId: input.userId,
        type: WearableNotificationType.SYNC,
        severity: WearableNotificationSeverity.INFO,
        title: "Primeira sincronizacao concluida",
        message: "Criamos a primeira ficha vital com os dados mais recentes do relogio.",
        metadata: { provider: parseWearableProvider(input.provider) },
      },
    ],
  });

  return getWearableSummary(input.userId);
}

export async function createWearableReading(userId: string, connection: WearableConnection) {
  const reading = buildDemoReading(connection.provider);

  return prisma.wearableReading.create({
    data: {
      userId,
      connectionId: connection.id,
      provider: connection.provider,
      recordedAt: new Date(),
      ...reading,
      rawSummary: {
        source: "demo_sync",
        safety: "No raw OAuth token is exposed through API responses.",
      },
    },
  });
}

export async function syncWearable(userId: string) {
  const connection = await prisma.wearableConnection.findFirst({
    where: { userId, status: WearableConnectionStatus.CONNECTED },
    orderBy: { updatedAt: "desc" },
  });

  if (!connection) {
    return null;
  }

  const reading = await createWearableReading(userId, connection);

  await prisma.wearableConnection.update({
    where: { id: connection.id },
    data: { lastSyncAt: reading.recordedAt },
  });

  const notificationData: Prisma.WearableNotificationCreateManyInput[] = [
    {
      userId,
      type: WearableNotificationType.SYNC,
      severity: WearableNotificationSeverity.SUCCESS,
      title: "Relogio sincronizado",
      message: "Batimentos, sono e atividade foram atualizados com seguranca.",
      metadata: { reading_id: reading.id },
    },
  ];

  if ((reading.recoveryScore ?? 100) < 70) {
    notificationData.push({
      userId,
      type: WearableNotificationType.RECOVERY,
      severity: WearableNotificationSeverity.WARNING,
      title: "Recuperacao abaixo do ideal",
      message: "Considere reduzir a intensidade do treino hoje e priorizar sono e hidratacao.",
      metadata: { recovery_score: reading.recoveryScore },
    });
  }

  if ((reading.restingHeartRateBpm ?? 0) >= 75) {
    notificationData.push({
      userId,
      type: WearableNotificationType.HEART_RATE,
      severity: WearableNotificationSeverity.WARNING,
      title: "Batimento de repouso elevado",
      message: "Acompanhe a tendencia e procure orientacao profissional se isso persistir.",
      metadata: { resting_heart_rate_bpm: reading.restingHeartRateBpm },
    });
  }

  await prisma.wearableNotification.createMany({ data: notificationData });

  return getWearableSummary(userId);
}

export async function disconnectWearable(userId: string) {
  await prisma.wearableConnection.updateMany({
    where: { userId, status: { not: WearableConnectionStatus.DISCONNECTED } },
    data: {
      status: WearableConnectionStatus.DISCONNECTED,
      disconnectedAt: new Date(),
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
    },
  });

  await prisma.wearableNotification.create({
    data: {
      userId,
      type: WearableNotificationType.CONSENT,
      severity: WearableNotificationSeverity.INFO,
      title: "Conexao removida",
      message: "A permissao do relogio foi removida e os tokens armazenados foram apagados.",
    },
  });

  return getWearableSummary(userId);
}

export async function markWearableNotificationRead(userId: string, notificationId: string) {
  await prisma.wearableNotification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });

  return getWearableSummary(userId);
}

export async function markAllWearableNotificationsRead(userId: string) {
  await prisma.wearableNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return getWearableSummary(userId);
}
