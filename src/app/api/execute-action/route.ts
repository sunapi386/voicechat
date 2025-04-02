// src/app/api/execute-action/route.ts
import { executeWebhook } from "@/lib/webhooks";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing action type or payload" },
        { status: 400 }
      );
    }

    const success = await executeWebhook(type, payload);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to execute webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Action '${type}' successfully triggered.`,
    });
  } catch (error) {
    console.error("Error executing action:", error);
    return NextResponse.json(
      {
        error: error || "Internal Server Error during action execution",
      },
      { status: 500 }
    );
  }
}
