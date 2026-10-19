import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, details } = await req.json();

    console.log(`[Composio Integrations Triggered] User ID: ${userId}, Action: ${action}`);
    console.log("[Composio Details]:", JSON.stringify(details, null, 2));

    const actionsPerformed: string[] = [];

    if (action === "QUIZ_COMPLETED") {
      const topic = details.topic || "Data Structures";
      const accuracy = details.accuracy || 0;
      const xp = details.xpEarned || 0;

      // 1. Google Docs Note Generation
      console.log(`[Composio] Creating structured study notes for '${topic}' in Google Docs...`);
      actionsPerformed.push(`Google Docs: Created '${topic} Revision Guide'`);

      // 2. Google Drive saving
      console.log(`[Composio] Uploading quiz results and guide to Google Drive (/CodeMentorAI/${topic}/)...`);
      actionsPerformed.push(`Google Drive: Saved '${topic}_summary.pdf'`);

      // 3. Google Calendar reminder
      console.log(`[Composio] Scheduling revision session in Google Calendar for ${topic} in 3 days...`);
      actionsPerformed.push("Google Calendar: Scheduled spaced repetition reminder");

      // 4. GitHub solved problem commit
      console.log(`[Composio] Creating practice repository code-mentor-dsa and committing '${topic}' quiz progress (+${xp} XP)...`);
      actionsPerformed.push(`GitHub: Committed progress to 'code-mentor-dsa' repo`);

      // 5. Gmail report summary dispatch
      console.log(`[Composio] Dispatching weekly progress report to student's email...`);
      actionsPerformed.push(`Gmail: Dispatched quiz report (${accuracy}% Accuracy)`);
    } else if (action === "NOTES_EXPORTED") {
      const topic = details.topic || "General revision";
      console.log(`[Composio] Creating Google Docs note for ${topic}...`);
      actionsPerformed.push("Google Docs: Document created successfully");
      console.log("[Composio] Saving export directly inside user Google Drive folder...");
      actionsPerformed.push("Google Drive: Uploaded exported file");
    }

    return NextResponse.json({
      success: true,
      message: "Composio actions executed successfully (Simulated integration context)",
      actions: actionsPerformed,
    });
  } catch (err: any) {
    console.error("Composio API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
