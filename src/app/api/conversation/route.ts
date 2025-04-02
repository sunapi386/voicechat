// src/app/api/conversation/route.ts
import { SUMMARY_PROMPT } from "@/lib/ai-prompt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { executeWebhook, SUPPORTED_ACTIONS } from "@/lib/webhooks";

// Define types
interface TranscriptMessage {
  role: string;
  text: string;
}

interface BaseIntent {
  [key: string]: unknown;
}

interface FollowupIntent extends BaseIntent {
  detected: boolean;
  date?: string;
  notes?: string;
}

interface LabOrderIntent extends BaseIntent {
  detected: boolean;
  testType?: string;
  notes?: string;
}

interface DetectedIntents {
  scheduleFollowup: FollowupIntent;
  sendLabOrder: LabOrderIntent;
}

interface ActionToolData {
  date?: string;
  notes?: string;
  testType?: string;
  [key: string]: unknown;
}

interface ExecutedAction {
  type: string;
  success: boolean;
  metadata: FollowupIntent | LabOrderIntent;
}

const actionTools = {
  async scheduleFollowup(data: ActionToolData): Promise<boolean> {
    return executeWebhook(SUPPORTED_ACTIONS.SCHEDULE_FOLLOWUP, data);
  },

  async sendLabOrder(data: ActionToolData): Promise<boolean> {
    return executeWebhook(SUPPORTED_ACTIONS.SEND_LAB_ORDER, data);
  },
};

export async function POST(request: Request) {
  try {
    const { transcript } = (await request.json()) as {
      transcript: TranscriptMessage[];
    };

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    const conversationText = transcript
      .map((msg: TranscriptMessage) => `${msg.role.toUpperCase()}: ${msg.text}`)
      .join("\n\n");

    if (!conversationText.trim()) {
      return NextResponse.json(
        { error: "No valid conversation content found" },
        { status: 400 }
      );
    }

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
    const { summary, actionables, detectedIntents } = aiResponse as {
      summary: string;
      actionables: string[];
      detectedIntents: DetectedIntents;
    };

    const executedActions: ExecutedAction[] = [];
    if (detectedIntents.scheduleFollowup.detected) {
      const success = await actionTools.scheduleFollowup(
        detectedIntents.scheduleFollowup
      );
      executedActions.push({
        type: SUPPORTED_ACTIONS.SCHEDULE_FOLLOWUP,
        success,
        metadata: detectedIntents.scheduleFollowup,
      });
    }

    if (detectedIntents.sendLabOrder.detected) {
      const success = await actionTools.sendLabOrder(
        detectedIntents.sendLabOrder
      );
      executedActions.push({
        type: SUPPORTED_ACTIONS.SEND_LAB_ORDER,
        success,
        metadata: detectedIntents.sendLabOrder,
      });
    }

    const savedConversation = await prisma.conversation.create({
      data: {
        transcript: JSON.stringify(transcript),
        summary: JSON.stringify(summary),
        actionables: JSON.stringify(actionables),
        detectedIntents: JSON.stringify(detectedIntents),
        executedActions: JSON.stringify(executedActions),
      },
    });

    return NextResponse.json({
      message: "Conversation processed successfully",
      id: savedConversation.id,
      summary,
      detectedIntents,
      executedActions,
    });
  } catch (error) {
    console.error("Error processing conversation:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal Server Error processing conversation";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
  } catch (error) {
    return NextResponse.json(
      { error: error || "Error fetching conversations" },
      { status: 500 }
    );
  }
}
