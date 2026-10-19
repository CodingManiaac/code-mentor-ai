import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { codingSessions, codeVersions, codingStats } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      language,
      problemTitle,
      code,
      timeSpent = 0,
      passedTestCases = 0,
      totalTestCases = 0,
      difficulty = "medium",
      status = "in_progress",
    } = await req.json();

    if (!problemTitle || !code || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Transaction to handle session upsert and version logs
    const result = await db.transaction(async (tx: any) => {
      // Check if session exists
      const existing = await tx
        .select()
        .from(codingSessions)
        .where(
          and(
            eq(codingSessions.userId, userId),
            eq(codingSessions.problemTitle, problemTitle)
          )
        )
        .limit(1);

      let sessionId = "";
      let nextVersionNumber = 1;

      if (existing.length > 0) {
        sessionId = existing[0].id;
        
        await tx
          .update(codingSessions)
          .set({
            currentCode: code,
            timeSpent: existing[0].timeSpent + timeSpent,
            passedTestCases,
            totalTestCases,
            status,
          })
          .where(eq(codingSessions.id, sessionId));

        // Get last version number
        const lastVersion = await tx
          .select()
          .from(codeVersions)
          .where(eq(codeVersions.sessionId, sessionId))
          .orderBy(desc(codeVersions.versionNumber))
          .limit(1);

        if (lastVersion.length > 0) {
          nextVersionNumber = lastVersion[0].versionNumber + 1;
        }
      } else {
        const inserted = await tx
          .insert(codingSessions)
          .values({
            userId,
            language,
            problemTitle,
            currentCode: code,
            timeSpent,
            passedTestCases,
            totalTestCases,
            difficulty,
            status,
          })
          .returning();
        
        sessionId = inserted[0].id;
      }

      // Insert version log (for Session Replay)
      await tx.insert(codeVersions).values({
        sessionId,
        versionNumber: nextVersionNumber,
        codeText: code,
      });

      // Update Coding Stats if completed
      if (status === "completed") {
        const stats = await tx
          .select()
          .from(codingStats)
          .where(eq(codingStats.userId, userId))
          .limit(1);

        if (stats.length > 0) {
          const nextSolved = stats[0].problemsSolved + 1;
          const nextAvgTime = Math.round((stats[0].averageTime * stats[0].problemsSolved + timeSpent) / nextSolved);
          
          await tx
            .update(codingStats)
            .set({
              problemsSolved: nextSolved,
              averageTime: nextAvgTime,
              streak: stats[0].streak + 1,
              updatedAt: new Date(),
            })
            .where(eq(codingStats.id, stats[0].id));
        } else {
          await tx.insert(codingStats).values({
            userId,
            problemsSolved: 1,
            averageTime: timeSpent,
            averageComplexity: "O(n)",
            strengths: problemTitle,
            weaknesses: "",
            streak: 1,
          });
        }
      }

      return { sessionId, versionNumber: nextVersionNumber };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Save code session failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
