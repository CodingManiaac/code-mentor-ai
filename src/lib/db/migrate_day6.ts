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

    // 1. Create coding_sessions table
    console.log("Creating coding_sessions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "coding_sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "language" text NOT NULL,
        "problemTitle" text NOT NULL,
        "currentCode" text NOT NULL,
        "timeSpent" integer DEFAULT 0 NOT NULL,
        "passedTestCases" integer DEFAULT 0 NOT NULL,
        "totalTestCases" integer DEFAULT 0 NOT NULL,
        "difficulty" text NOT NULL,
        "status" text DEFAULT 'in_progress' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("coding_sessions created!");

    // 2. Create code_versions table
    console.log("Creating code_versions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "code_versions" (
        "id" text PRIMARY KEY NOT NULL,
        "sessionId" text NOT NULL REFERENCES "coding_sessions"("id") ON DELETE cascade,
        "versionNumber" integer NOT NULL,
        "codeText" text NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("code_versions created!");

    // 3. Create coding_stats table
    console.log("Creating coding_stats table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "coding_stats" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "problemsSolved" integer DEFAULT 0 NOT NULL,
        "averageTime" integer DEFAULT 0 NOT NULL,
        "averageComplexity" text DEFAULT 'O(n)' NOT NULL,
        "strengths" text DEFAULT '' NOT NULL,
        "weaknesses" text DEFAULT '' NOT NULL,
        "streak" integer DEFAULT 0 NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("coding_stats created!");

    console.log("All Day 6 tables migrated successfully! 🎉");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

run();
