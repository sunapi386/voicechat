// src/app/api/conversation/[id]/route.ts
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Destructure and await the params
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: conversation.id,
      transcript: JSON.parse(conversation.transcript),
      summary: JSON.parse(conversation.summary),
      actionables: JSON.parse(conversation.actionables),
      detectedIntents: JSON.parse(conversation.detectedIntents),
      executedActions: JSON.parse(conversation.executedActions),
      createdAt: conversation.createdAt,
      patientId: conversation.patientId,
      duration: conversation.duration,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Error fetching conversation" },
      { status: 500 }
    );
  }
}
