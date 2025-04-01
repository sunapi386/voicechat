// src/app/api/ephemeral-key/route.ts
import { getAISystemPrompt } from "@/lib/ai-prompt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Todo: authenticate the request
  // Check the language
  if (!request.headers.get("Language")) {
    return NextResponse.json(
      { error: "Missing language header: en-US es-ES" },
      { status: 400 }
    );
  }

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
    const english = request.headers.get("Language") === "en-US";
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
          modalities: ["audio", "text"],
          instructions: getAISystemPrompt(english ? "english" : "spanish"),
          voice: "sage",
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
    console.log("OpenAI API Response:", data);
    return NextResponse.json({ ephemeral_key: data.client_secret });
  } catch (error) {
    console.error("Error generating ephemeral key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
