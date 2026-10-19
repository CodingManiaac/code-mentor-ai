import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { codingSessions, codeVersions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const problemTitle = searchParams.get("problemTitle");

    if (!problemTitle) {
      return NextResponse.json({ error: "Missing problemTitle parameter" }, { status: 400 });
    }

    // 1. Fetch active session
    const activeSession = await db
      .select()
      .from(codingSessions)
      .where(
        and(
          eq(codingSessions.userId, userId),
          eq(codingSessions.problemTitle, problemTitle)
        )
      )
      .limit(1);

    if (activeSession.length === 0) {
      return NextResponse.json({ versions: [] });
    }

    // 2. Fetch all incremental versions ordered by versionNumber ascending
    const list = await db
      .select()
      .from(codeVersions)
      .where(eq(codeVersions.sessionId, activeSession[0].id))
      .orderBy(codeVersions.versionNumber);

    return NextResponse.json({
      versions: list.map((v: any) => ({
        versionNumber: v.versionNumber,
        codeText: v.codeText,
        timestamp: v.timestamp,
      })),
    });
  } catch (err: any) {
    console.error("Replay history fetch failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
