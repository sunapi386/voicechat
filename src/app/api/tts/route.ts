// src/app/api/tts/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use OpenAI TTS
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "alloy", // You can choose: alloy, echo, fable, onyx, nova, shimmer
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response;
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
