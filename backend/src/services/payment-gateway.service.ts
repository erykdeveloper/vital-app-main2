import crypto from "node:crypto";
import { PaymentProvider, type PaymentMethod } from "@prisma/client";
import { env } from "../config/env.js";

export interface CheckoutRequest {
  orderId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  customerEmail: string;
  description: string;
}

export interface CheckoutResponse {
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerPreferenceId?: string;
  checkoutUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  expiresAt?: Date;
}

const providerMap: Record<typeof env.PAYMENT_PROVIDER, PaymentProvider> = {
  manual: PaymentProvider.MANUAL,
  mercado_pago: PaymentProvider.MERCADO_PAGO,
  stripe: PaymentProvider.STRIPE,
  pagarme: PaymentProvider.PAGARME,
  asaas: PaymentProvider.ASAAS,
};

export function getConfiguredPaymentProvider() {
  return providerMap[env.PAYMENT_PROVIDER];
}

export async function createGatewayCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
  const provider = getConfiguredPaymentProvider();

  if (provider === PaymentProvider.MANUAL) {
    return {
      provider,
      providerPaymentId: `manual_${request.paymentId}`,
      checkoutUrl: `${env.APP_URL}/premium?payment=pending&order_id=${request.orderId}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    };
  }

  // Gateway SDK/API integration point:
  // - create a checkout/preference/payment intent at the provider;
  // - use tokenized card data only at the provider side;
  // - save only provider IDs, checkout URL and PIX payloads here.
  throw new Error(
    `Gateway ${provider} ainda nao foi conectado. Configure o adapter em payment-gateway.service.ts.`,
  );
}

export function verifyWebhookSignature(rawBody: Buffer | undefined, signature: string | undefined) {
  if (!env.PAYMENT_WEBHOOK_SECRET) {
    return env.NODE_ENV !== "production";
  }

  if (!rawBody || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.PAYMENT_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}
