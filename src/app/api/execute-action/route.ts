// src/app/api/execute-action/route.ts
import { NextResponse } from "next/server";

// Store your webhook URL securely, ideally in environment variables
const WEBHOOK_URL_LAB_ORDER =
  process.env.WEBHOOK_URL_LAB_ORDER ||
  "https://webhook.site/your_unique_lab_order_id";
const WEBHOOK_URL_FOLLOW_UP =
  process.env.WEBHOOK_URL_FOLLOW_UP ||
  "https://webhook.site/your_unique_follow_up_id";
// Add more URLs as needed

export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing action type or payload" },
        { status: 400 }
      );
    }

    let targetWebhookUrl: string | null = null;

    // Determine the correct webhook URL based on the action type
    switch (type) {
      case "lab_order":
        targetWebhookUrl = WEBHOOK_URL_LAB_ORDER;
        break;
      case "follow_up":
        targetWebhookUrl = WEBHOOK_URL_FOLLOW_UP;
        break;
      // Add more cases for different actions
      default:
        return NextResponse.json(
          { error: `Unsupported action type: ${type}` },
          { status: 400 }
        );
    }

    console.log(`Executing action: ${type} - Sending to: ${targetWebhookUrl}`);
    console.log("Payload:", payload);

    // Simulate calling the webhook
    const webhookResponse = await fetch(targetWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType: type,
        data: payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      // Even if webhook.site returns an error, we might still consider it "sent"
      console.warn(
        `Webhook call to ${targetWebhookUrl} returned status: ${webhookResponse.status}`
      );
      // Decide if this should be a client-facing error or just logged
    }

    // You might get a response ID or confirmation from webhook.site if needed

    return NextResponse.json({
      message: `Action '${type}' successfully triggered.`,
    });
  } catch (error: any) {
    console.error("Error executing action:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal Server Error during action execution",
      },
      { status: 500 }
    );
  }
}
