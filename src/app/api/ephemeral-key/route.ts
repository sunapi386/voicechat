// src/app/api/ephemeral-key/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Get this from environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error("Missing OpenAI API key");
    return NextResponse.json(
      { error: "Internal server error: missing OPENAI_API_KEY key" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Can make this configurable or use an environment variable
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate ephemeral key" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ ephemeral_key: data.client_secret });
  } catch (error) {
    console.error("Error generating ephemeral key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
