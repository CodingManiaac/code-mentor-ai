import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: "E:/code-mentor-ai/.env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log("Connecting to Database...");

    // 1. Extend user_preferences table
    console.log("Extending user_preferences table...");
    await sql`
      ALTER TABLE "user_preferences" 
      ADD COLUMN IF NOT EXISTS "score" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "level" integer DEFAULT 1 NOT NULL,
      ADD COLUMN IF NOT EXISTS "currentStreak" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "longestStreak" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "totalCorrect" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "totalIncorrect" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "totalQuizzes" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "averageAccuracy" integer DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "learningGoal" text DEFAULT 'Master Data Structures' NOT NULL;
    `;
    console.log("user_preferences extended!");

    // 2. Create quiz_attempts table
    console.log("Creating quiz_attempts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "quiz_attempts" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "chatId" text NOT NULL REFERENCES "chat"("id") ON DELETE cascade,
        "topic" text NOT NULL,
        "difficulty" text NOT NULL,
        "questionsCount" integer NOT NULL,
        "correctAnswers" integer NOT NULL,
        "incorrectAnswers" integer NOT NULL,
        "accuracy" integer NOT NULL,
        "xpEarned" integer NOT NULL,
        "timeTaken" integer NOT NULL,
        "summary" text,
        "completedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("quiz_attempts created!");

    // 3. Create quiz_submissions table
    console.log("Creating quiz_submissions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "quiz_submissions" (
        "id" text PRIMARY KEY NOT NULL,
        "attemptId" text NOT NULL REFERENCES "quiz_attempts"("id") ON DELETE cascade,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "questionIndex" integer NOT NULL,
        "question" text NOT NULL,
        "selectedOption" text NOT NULL,
        "correctOption" text NOT NULL,
        "isCorrect" integer NOT NULL,
        "pointsEarned" integer NOT NULL,
        "concept" text NOT NULL,
        "submittedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("quiz_submissions created!");

    // 4. Create learning_progress table
    console.log("Creating learning_progress table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "learning_progress" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "topic" text NOT NULL,
        "mastery" integer DEFAULT 0 NOT NULL,
        "lastPracticed" timestamp DEFAULT now() NOT NULL,
        "recommendedDifficulty" text DEFAULT 'easy' NOT NULL
      );
    `;
    console.log("learning_progress created!");

    // 5. Create achievements table
    console.log("Creating achievements table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "badge" text NOT NULL,
        "earnedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("achievements created!");

    // 6. Create user_memory table
    console.log("Creating user_memory table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "user_memory" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "concept" text NOT NULL,
        "status" text NOT NULL,
        "notes" text,
        "lastTested" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("user_memory created!");

    // 7. Create daily_missions table
    console.log("Creating daily_missions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "daily_missions" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "date" text NOT NULL,
        "missionList" text NOT NULL,
        "completedList" text NOT NULL,
        "rewarded" integer DEFAULT 0 NOT NULL
      );
    `;
    console.log("daily_missions created!");

    console.log("All Day 5 tables migrated successfully! 🎉");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

run();
