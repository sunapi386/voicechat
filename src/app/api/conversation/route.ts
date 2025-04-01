// src/app/api/conversation/route.ts
import { SUMMARY_PROMPT } from "@/lib/ai-prompt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    console.log("Received conversation to save:");
    console.log("Transcript Length:", transcript?.length);

    // Filter out system messages and transform to readable text
    const conversationText = transcript
      .map(
        (msg) =>
          // Format each message as "Role: Message"
          `${msg.role.toUpperCase()}: ${msg.text}`
      )
      .join("\n\n"); // Add spacing between messages

    if (!conversationText.trim()) {
      return NextResponse.json(
        { error: "No valid conversation content found" },
        { status: 400 }
      );
    }

    console.log("Processed conversation text:", conversationText);

    // Get summary and actionables using fetch
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SUMMARY_PROMPT,
          },
          {
            role: "user",
            content: conversationText,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const completionData = await response.json();
    const aiResponse = JSON.parse(
      completionData.choices[0].message.content || "{}"
    );

    const { summary, actionables } = aiResponse;

    console.log("Summary:", summary);
    console.log("Detected Actions:", actionables);

    // Database saving
    const savedConversation = await prisma.conversation.create({
      data: {
        transcript: JSON.stringify(transcript),
        summary: JSON.stringify(summary),
        actionables: JSON.stringify(actionables),
        // Add other fields as needed
      },
    });

    console.log("Saved conversation with ID:", savedConversation.id);

    return NextResponse.json({
      message: "Conversation saved successfully",
      id: savedConversation.id,
    });
  } catch (error: any) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error saving conversation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      conversations.map((conv) => ({
        id: conv.id,
        date: conv.createdAt.toLocaleDateString(),
        patientId: conv.patientId || "Unknown",
        duration: conv.duration || "00:00",
        summary: conv.summary,
        actions: JSON.parse(conv.actionables).length,
      }))
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error fetching conversations" },
      { status: 500 }
    );
  }
}
