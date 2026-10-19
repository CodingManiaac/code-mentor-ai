import Supermemory from 'supermemory';
import { db } from "./db";
import { userMemory, userPreferences, learningProgress, quizAttempts } from "./db/schema";
import { eq, desc, and } from "drizzle-orm";

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY || "mock_key",
});

export async function saveMemory(
  userId: string,
  text: string
) {
  try {
    if (!process.env.SUPERMEMORY_API_KEY) {
      console.log('Mock memory save (no API key)');
      return;
    }
    await client.add({
      content: text,
      containerTags: [userId],
    });
    console.log('Memory saved');
  } catch (error) {
    console.error('Save memory error:', error);
  }
}

export async function retrieveMemory(
  userId: string,
  query: string
) {
  try {
    if (!process.env.SUPERMEMORY_API_KEY) {
      return '{"response": "Mock memory response"}';
    }
    const result = await client.profile({
      containerTag: userId,
      q: query,
    });
    return JSON.stringify(result);
  } catch (error) {
    console.error('Retrieve memory error:', error);
    return '';
  }
}

export interface SupermemoryProfile {
  learningGoal: string;
  level: number;
  score: number;
  currentStreak: number;
  longestStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalQuizzes: number;
  averageAccuracy: number;
  weakConcepts: string[];
  strongConcepts: string[];
  masteredConcepts: string[];
  lastQuizTopic: string | null;
  lastQuizAccuracy: number | null;
  lastQuizDifficulty: string | null;
  masteries: { topic: string; mastery: number }[];
}

export async function getSupermemoryProfile(userId: string): Promise<SupermemoryProfile> {
  try {
    // 1. Fetch weak, strong, mastered concepts
    const memoryItems = await db
      .select()
      .from(userMemory)
      .where(eq(userMemory.userId, userId));
    
    // 2. Fetch learning goal & level stats
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    const userGoal = prefs[0]?.learningGoal || "Master Data Structures";
    const userLevel = prefs[0]?.level || 1;
    const userScore = prefs[0]?.score || 0;
    const userStreak = prefs[0]?.currentStreak || 0;
    const userLongestStreak = prefs[0]?.longestStreak || 0;
    const userTotalCorrect = prefs[0]?.totalCorrect || 0;
    const userTotalIncorrect = prefs[0]?.totalIncorrect || 0;
    const userTotalQuizzes = prefs[0]?.totalQuizzes || 0;
    const userAvgAccuracy = prefs[0]?.averageAccuracy || 0;

    // 3. Fetch progress masteries
    const progress = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));

    // 4. Fetch last quiz attempt
    const lastAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);

    const lastQuiz = lastAttempts[0] || null;

    // Categorize memory concepts
    const weak = memoryItems.filter((m: any) => m.status === "weak").map((m: any) => m.concept);
    const strong = memoryItems.filter((m: any) => m.status === "strong").map((m: any) => m.concept);
    const mastered = memoryItems.filter((m: any) => m.status === "mastered").map((m: any) => m.concept);

    return {
      learningGoal: userGoal,
      level: userLevel,
      score: userScore,
      currentStreak: userStreak,
      longestStreak: userLongestStreak,
      totalCorrect: userTotalCorrect,
      totalIncorrect: userTotalIncorrect,
      totalQuizzes: userTotalQuizzes,
      averageAccuracy: userAvgAccuracy,
      weakConcepts: weak,
      strongConcepts: strong,
      masteredConcepts: mastered,
      lastQuizTopic: lastQuiz ? lastQuiz.topic : null,
      lastQuizAccuracy: lastQuiz ? lastQuiz.accuracy : null,
      lastQuizDifficulty: lastQuiz ? lastQuiz.difficulty : null,
      masteries: progress.map((p: any) => ({ topic: p.topic, mastery: p.mastery })),
    };
  } catch (err) {
    console.error("Failed to fetch supermemory:", err);
    return {
      learningGoal: "Master Data Structures",
      level: 1,
      score: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalQuizzes: 0,
      averageAccuracy: 0,
      weakConcepts: [],
      strongConcepts: [],
      masteredConcepts: [],
      lastQuizTopic: null,
      lastQuizAccuracy: null,
      lastQuizDifficulty: null,
      masteries: [],
    };
  }
}

export async function updateSupermemory(
  userId: string,
  concept: string,
  status: "weak" | "strong" | "mastered",
  notes?: string
): Promise<void> {
  try {
    // Check if concept exists
    const existing = await db
      .select()
      .from(userMemory)
      .where(and(eq(userMemory.userId, userId), eq(userMemory.concept, concept)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userMemory)
        .set({
          status,
          notes: notes || existing[0].notes,
          lastTested: new Date(),
        })
        .where(eq(userMemory.id, existing[0].id));
    } else {
      await db.insert(userMemory).values({
        userId,
        concept,
        status,
        notes: notes || `Auto-updated on ${new Date().toLocaleDateString()}`,
        lastTested: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to update supermemory:", err);
  }
}