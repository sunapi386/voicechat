// src/lib/webhooks.ts
export const WEBHOOK_URLS = {
  LAB_ORDER:
    process.env.WEBHOOK_URL_LAB_ORDER || "https://webhook.site/lab-order",
  FOLLOW_UP:
    process.env.WEBHOOK_URL_FOLLOW_UP || "https://webhook.site/follow-up",
} as const;

export const SUPPORTED_ACTIONS = {
  SCHEDULE_FOLLOWUP: "SCHEDULE_FOLLOWUP",
  SEND_LAB_ORDER: "SEND_LAB_ORDER",
} as const;

export interface WebhookPayload {
  actionType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export async function executeWebhook(
  type: keyof typeof SUPPORTED_ACTIONS,
  data: Record<string, unknown>
): Promise<boolean> {
  const webhookUrl =
    type === SUPPORTED_ACTIONS.SEND_LAB_ORDER
      ? WEBHOOK_URLS.LAB_ORDER
      : WEBHOOK_URLS.FOLLOW_UP;

  const payload: WebhookPayload = {
    actionType: type,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        `Webhook call to ${webhookUrl} returned status: ${response.status}`
      );
    }

    return response.ok;
  } catch (error) {
    console.error(`Webhook execution failed for ${type}:`, error);
    return false;
  }
}
