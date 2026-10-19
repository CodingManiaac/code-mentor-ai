import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupermemoryProfile } from "@/lib/memory";

// 1. GET - Retrieve user settings, profile details, and Supermemory telemetry
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    });

    // If no preferences record exists, create one with defaults
    if (!prefs) {
      const inserted = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          explanationLevel: "intermediate",
          preferredLanguage: "javascript",
          themeAccent: "indigo",
          score: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalQuizzes: 0,
          averageAccuracy: 0,
          learningGoal: "Master Data Structures",
        })
        .returning();
      prefs = inserted[0];
    }

    // Fetch deep supermemory details
    const supermemory = await getSupermemoryProfile(session.user.id);

    return NextResponse.json({
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      preferences: {
        ...prefs,
        ...supermemory,
      },
    });
  } catch (error) {
    console.error("GET user preferences error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST - Save user settings, profile details, and Learning Goal updates
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, explanationLevel, preferredLanguage, themeAccent, learningGoal } = await req.json();

    // Update user profile name if provided
    if (name && name.trim()) {
      await db
        .update(users)
        .set({ name: name.trim() })
        .where(eq(users.id, session.user.id));
    }

    // Upsert preferences record
    const updatedPrefs = await db
      .insert(userPreferences)
      .values({
        userId: session.user.id,
        explanationLevel: explanationLevel || "intermediate",
        preferredLanguage: preferredLanguage || "javascript",
        themeAccent: themeAccent || "indigo",
        learningGoal: learningGoal || "Master Data Structures",
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          explanationLevel: explanationLevel || "intermediate",
          preferredLanguage: preferredLanguage || "javascript",
          themeAccent: themeAccent || "indigo",
          learningGoal: learningGoal || "Master Data Structures",
        },
      })
      .returning();

    // Fetch deep supermemory details again to keep responses rich
    const supermemory = await getSupermemoryProfile(session.user.id);

    return NextResponse.json({
      message: "Preferences updated successfully",
      name: name?.trim() || session.user.name,
      preferences: {
        ...updatedPrefs[0],
        ...supermemory,
      },
    });
  } catch (error) {
    console.error("POST user preferences error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
