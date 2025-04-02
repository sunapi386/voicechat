import { prisma } from "@/lib/db";
import { formatDate, sanitizeMarkdown } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Parse the JSON strings
    const transcript = JSON.parse(conversation.transcript);
    const summary = JSON.parse(conversation.summary);
    const actionables = JSON.parse(conversation.actionables);
    const executedActions = JSON.parse(conversation.executedActions);

    // Create markdown content
    const markdownContent = `# Conversation Summary
Date: ${formatDate(conversation.createdAt)}
Duration: ${conversation.duration || "N/A"}

## Visit Summary
${sanitizeMarkdown(summary.visitSummary)}

## Chief Complaint
${sanitizeMarkdown(summary.chiefComplaint)}

## Key Findings
${
  summary.keyFindings.length > 0
    ? summary.keyFindings
        .map((finding: string) => `- ${sanitizeMarkdown(finding)}`)
        .join("\n")
    : "No key findings recorded"
}

## Diagnosis
${sanitizeMarkdown(summary.diagnosis)}

## Treatment Plan
${sanitizeMarkdown(summary.treatmentPlan)}

## Follow-up
${sanitizeMarkdown(summary.followUp)}

## Medications
${
  summary.medications.length > 0
    ? summary.medications
        .map((med: string) => `- ${sanitizeMarkdown(med)}`)
        .join("\n")
    : "No medications prescribed"
}

## Actions Taken
${executedActions
  .map(
    (action: any) => `
### ${sanitizeMarkdown(action.type)}
- Status: ${action.success ? "Completed" : "Pending"}
${
  action.metadata?.notes
    ? `- Notes: ${sanitizeMarkdown(action.metadata.notes)}`
    : ""
}
${action.metadata?.date ? `- Date: ${action.metadata.date}` : ""}
`
  )
  .join("\n")}

## Transcript
${transcript
  .map(
    (entry: any) => `
**${entry.role}**: ${sanitizeMarkdown(entry.text)}
`
  )
  .join("\n")}

---
Generated on: ${formatDate(new Date())}
`;

    // Create response with markdown file
    const response = new Response(markdownContent);
    response.headers.set("Content-Type", "text/markdown; charset=utf-8");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="conversation-${id}.md"`
    );

    return response;
  } catch (error) {
    console.error("Error generating export:", error);
    return NextResponse.json(
      { error: "Error generating export" },
      { status: 500 }
    );
  }
}
