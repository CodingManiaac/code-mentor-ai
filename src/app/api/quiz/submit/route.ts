import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  quizAttempts,
  quizSubmissions,
  userPreferences,
  learningProgress,
  achievements,
  userMemory,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      chatId,
      topic,
      difficulty,
      timeTaken,
      summary,
      submissions = [],
    } = await req.json();

    if (!chatId || !topic || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Calculate accuracy and XP
    const questionsCount = submissions.length;
    const correctAnswers = submissions.filter((s: any) => s.isCorrect === 1).length;
    const incorrectAnswers = questionsCount - correctAnswers;
    const accuracy = questionsCount > 0 ? Math.round((correctAnswers / questionsCount) * 100) : 0;
    
    const xpEarned = submissions.reduce((sum: number, s: any) => sum + s.pointsEarned, 0);

    // 2. Start a transaction to ensure atomic updates
    const result = await db.transaction(async (tx: any) => {
      // Create quiz attempt
      const attempt = await tx
        .insert(quizAttempts)
        .values({
          userId,
          chatId,
          topic,
          difficulty,
          questionsCount,
          correctAnswers,
          incorrectAnswers,
          accuracy,
          xpEarned,
          timeTaken,
          summary: summary || `Quiz completed on ${topic} with ${accuracy}% accuracy.`,
        })
        .returning();

      const attemptId = attempt[0].id;

      // Create individual question submissions
      if (submissions.length > 0) {
        await tx.insert(quizSubmissions).values(
          submissions.map((s: any) => ({
            attemptId,
            userId,
            questionIndex: s.questionIndex,
            question: s.question,
            selectedOption: s.selectedOption || "N/A",
            correctOption: s.correctOption || "N/A",
            isCorrect: s.isCorrect,
            pointsEarned: s.pointsEarned,
            concept: s.concept || topic,
          }))
        );

        // Update Supermemory for each unique concept tested
        for (const s of submissions) {
          const concept = s.concept || topic;
          const status = s.isCorrect === 1 ? "strong" : "weak";

          // Find if concept memory exists
          const existingMem = await tx
            .select()
            .from(userMemory)
            .where(and(eq(userMemory.userId, userId), eq(userMemory.concept, concept)))
            .limit(1);

          if (existingMem.length > 0) {
            const nextStatus = s.isCorrect === 1 
              ? (existingMem[0].status === "weak" ? "strong" : "mastered") 
              : "weak";
            
            await tx
              .update(userMemory)
              .set({
                status: nextStatus,
                notes: `Tested on ${new Date().toLocaleDateString()}. Selected: ${s.selectedOption}. Correct: ${s.correctOption}.`,
                lastTested: new Date(),
              })
              .where(eq(userMemory.id, existingMem[0].id));
          } else {
            await tx.insert(userMemory).values({
              userId,
              concept,
              status,
              notes: `First tested on ${new Date().toLocaleDateString()}. Result: ${s.isCorrect === 1 ? 'Correct' : 'Incorrect'}.`,
              lastTested: new Date(),
            });
          }
        }
      }

      // Fetch user preferences to update streak and score
      const prefs = await tx
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      const currentPrefs = prefs[0];
      
      let nextScore = Math.max(0, (currentPrefs?.score || 0) + xpEarned);
      let nextLevel = Math.floor(nextScore / 500) + 1;
      let nextStreak = currentPrefs?.currentStreak || 0;
      let nextLongestStreak = currentPrefs?.longestStreak || 0;

      // Determine streak update
      const lastAttempt = await tx
        .select()
        .from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.chatId, chatId)))
        .orderBy(desc(quizAttempts.completedAt))
        .offset(1) // get previous attempt
        .limit(1);

      const now = new Date();
      if (lastAttempt.length > 0) {
        const lastDate = new Date(lastAttempt[0].completedAt);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          nextStreak += 1;
        } else if (diffDays > 1) {
          nextStreak = 1;
        }
      } else {
        nextStreak = 1;
      }
      nextLongestStreak = Math.max(nextLongestStreak, nextStreak);

      const nextTotalQuizzes = (currentPrefs?.totalQuizzes || 0) + 1;
      const nextTotalCorrect = (currentPrefs?.totalCorrect || 0) + correctAnswers;
      const nextTotalIncorrect = (currentPrefs?.totalIncorrect || 0) + incorrectAnswers;
      const nextAvgAccuracy = nextTotalCorrect + nextTotalIncorrect > 0
        ? Math.round((nextTotalCorrect / (nextTotalCorrect + nextTotalIncorrect)) * 100)
        : 0;

      // Update preferences
      await tx
        .update(userPreferences)
        .set({
          score: nextScore,
          level: nextLevel,
          currentStreak: nextStreak,
          longestStreak: nextLongestStreak,
          totalCorrect: nextTotalCorrect,
          totalIncorrect: nextTotalIncorrect,
          totalQuizzes: nextTotalQuizzes,
          averageAccuracy: nextAvgAccuracy,
        })
        .where(eq(userPreferences.userId, userId));

      // 3. Update Learning progress / Mastery level (Adaptive Difficulty Engine)
      const existingProgress = await tx
        .select()
        .from(learningProgress)
        .where(and(eq(learningProgress.userId, userId), eq(learningProgress.topic, topic)))
        .limit(1);

      let nextMastery = existingProgress[0]?.mastery || 0;
      nextMastery = Math.max(0, Math.min(100, correctAnswers > 0 ? nextMastery + Math.round((correctAnswers / questionsCount) * 20) : nextMastery - 10));

      // Adaptive difficulty calculation
      let nextDifficulty = "easy";
      if (accuracy >= 90) {
        nextDifficulty = "hard";
      } else if (accuracy >= 60) {
        nextDifficulty = "medium";
      }

      if (existingProgress.length > 0) {
        await tx
          .update(learningProgress)
          .set({
            mastery: nextMastery,
            lastPracticed: new Date(),
            recommendedDifficulty: nextDifficulty,
          })
          .where(eq(learningProgress.id, existingProgress[0].id));
      } else {
        await tx.insert(learningProgress).values({
          userId,
          topic,
          mastery: nextMastery,
          lastPracticed: new Date(),
          recommendedDifficulty: nextDifficulty,
        });
      }

      // 4. Achievement & Badges unlocks checklist
      const newBadges: string[] = [];
      const userBadges = await tx
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));
      
      const badgeList = userBadges.map((a: any) => a.badge);

      const checkUnlock = async (badgeName: string, condition: boolean) => {
        if (condition && !badgeList.includes(badgeName)) {
          await tx.insert(achievements).values({
            userId,
            badge: badgeName,
          });
          newBadges.push(badgeName);
        }
      };

      await checkUnlock("First Quiz Completed", nextTotalQuizzes >= 1);
      await checkUnlock("100 XP Club", nextScore >= 100);
      await checkUnlock("1000 XP Master", nextScore >= 1000);
      await checkUnlock("7-Day Streak Warrior", nextStreak >= 7);
      await checkUnlock("Perfect Quiz Score", accuracy === 100);
      await checkUnlock(`${topic} Master`, nextMastery >= 90);

      // Trigger mocked Composio notification hooks
      try {
        await fetch(`${req.url.split("/api/")[0]}/api/composio/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            action: "QUIZ_COMPLETED",
            details: {
              topic,
              accuracy,
              xpEarned,
              streak: nextStreak,
            },
          }),
        });
      } catch (e) {
        console.warn("Composio webhook call failed", e);
      }

      return {
        score: nextScore,
        level: nextLevel,
        currentStreak: nextStreak,
        longestStreak: nextLongestStreak,
        totalQuizzes: nextTotalQuizzes,
        averageAccuracy: nextAvgAccuracy,
        topicMastery: nextMastery,
        newBadges,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Quiz submission route failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
