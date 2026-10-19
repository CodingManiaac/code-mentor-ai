import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userPreferences, achievements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        score: userPreferences.score,
        accuracy: userPreferences.averageAccuracy,
        level: userPreferences.level,
        streak: userPreferences.currentStreak,
      })
      .from(users)
      .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
      .orderBy(desc(userPreferences.score))
      .limit(10);

    // Fetch achievements to map badges count
    const rankedList = await Promise.all(
      list.map(async (u: any, idx: number) => {
        const badges = await db
          .select()
          .from(achievements)
          .where(eq(achievements.userId, u.id));
        
        return {
          rank: idx + 1,
          name: u.name || u.email?.split("@")[0] || "Anonymous Student",
          score: u.score || 0,
          accuracy: u.accuracy || 0,
          level: u.level || 1,
          streak: u.streak || 0,
          badgesCount: badges.length,
          badgesList: badges.map((b: any) => b.badge),
        };
      })
    );

    return NextResponse.json(rankedList);
  } catch (err: any) {
    console.error("Leaderboard query failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
