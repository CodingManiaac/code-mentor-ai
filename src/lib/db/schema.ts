import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";

// --- AUTH.JS NEXTAUTH TABLES ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- APP SPECIFIC TABLES ---

export const chats = pgTable("chat", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  mode: text("mode").$type<"teacher" | "coding">().notNull().default("teacher"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const files = pgTable("file", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mimeType").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

import { relations } from "drizzle-orm";

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  files: many(files),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  chat: one(chats, {
    fields: [files.chatId],
    references: [chats.id],
  }),
}));

export const userPreferences = pgTable("user_preferences", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  explanationLevel: text("explanationLevel").default("intermediate").notNull(), // novice, intermediate, expert
  preferredLanguage: text("preferredLanguage").default("javascript").notNull(),
  themeAccent: text("themeAccent").default("indigo").notNull(), // indigo, emerald, pink
  score: integer("score").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  totalCorrect: integer("totalCorrect").default(0).notNull(),
  totalIncorrect: integer("totalIncorrect").default(0).notNull(),
  totalQuizzes: integer("totalQuizzes").default(0).notNull(),
  averageAccuracy: integer("averageAccuracy").default(0).notNull(),
  learningGoal: text("learningGoal").default("Master Data Structures").notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  chatId: text("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  questionsCount: integer("questionsCount").notNull(),
  correctAnswers: integer("correctAnswers").notNull(),
  incorrectAnswers: integer("incorrectAnswers").notNull(),
  accuracy: integer("accuracy").notNull(), // percentage
  xpEarned: integer("xpEarned").notNull(),
  timeTaken: integer("timeTaken").notNull(), // in seconds
  summary: text("summary"), // AI summary output
  completedAt: timestamp("completedAt", { mode: "date" }).defaultNow().notNull(),
});

export const quizSubmissions = pgTable("quiz_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  attemptId: text("attemptId")
    .notNull()
    .references(() => quizAttempts.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionIndex: integer("questionIndex").notNull(),
  question: text("question").notNull(),
  selectedOption: text("selectedOption").notNull(),
  correctOption: text("correctOption").notNull(),
  isCorrect: integer("isCorrect").notNull(), // 0 = false, 1 = true
  pointsEarned: integer("pointsEarned").notNull(),
  concept: text("concept").notNull(),
  submittedAt: timestamp("submittedAt", { mode: "date" }).defaultNow().notNull(),
});

export const learningProgress = pgTable("learning_progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  mastery: integer("mastery").default(0).notNull(), // 0 - 100
  lastPracticed: timestamp("lastPracticed", { mode: "date" }).defaultNow().notNull(),
  recommendedDifficulty: text("recommendedDifficulty").default("easy").notNull(), // easy, medium, hard
});

export const achievements = pgTable("achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badge: text("badge").notNull(), // 'First Quiz', '100 XP', etc.
  earnedAt: timestamp("earnedAt", { mode: "date" }).defaultNow().notNull(),
});

export const userMemory = pgTable("user_memory", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  concept: text("concept").notNull(), // 'rotations', 'traversal'
  status: text("status").notNull(), // 'weak', 'strong', 'mastered'
  notes: text("notes"),
  lastTested: timestamp("lastTested", { mode: "date" }).defaultNow().notNull(),
});

export const dailyMissions = pgTable("daily_missions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  missionList: text("missionList").notNull(), // JSON string representing missions array
  completedList: text("completedList").notNull(), // JSON string representing completed missions
  rewarded: integer("rewarded").default(0).notNull(), // 0 = false, 1 = true
});

export const codingSessions = pgTable("coding_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  problemTitle: text("problemTitle").notNull(),
  currentCode: text("currentCode").notNull(),
  timeSpent: integer("timeSpent").default(0).notNull(),
  passedTestCases: integer("passedTestCases").default(0).notNull(),
  totalTestCases: integer("totalTestCases").default(0).notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  status: text("status").default("in_progress").notNull(), // in_progress, completed
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const codeVersions = pgTable("code_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId")
    .notNull()
    .references(() => codingSessions.id, { onDelete: "cascade" }),
  versionNumber: integer("versionNumber").notNull(),
  codeText: text("codeText").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
});

export const codingStats = pgTable("coding_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemsSolved: integer("problemsSolved").default(0).notNull(),
  averageTime: integer("averageTime").default(0).notNull(), // in seconds
  averageComplexity: text("averageComplexity").default("O(n)").notNull(), // e.g., O(n log n)
  strengths: text("strengths").default("").notNull(), // comma separated list
  weaknesses: text("weaknesses").default("").notNull(), // comma separated list
  streak: integer("streak").default(0).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  chats: many(chats),
  quizAttempts: many(quizAttempts),
  learningProgress: many(learningProgress),
  achievements: many(achievements),
  memory: many(userMemory),
  dailyMissions: many(dailyMissions),
  codingSessions: many(codingSessions),
  codingStats: many(codingStats),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  chat: one(chats, { fields: [quizAttempts.chatId], references: [chats.id] }),
  submissions: many(quizSubmissions),
}));

export const quizSubmissionsRelations = relations(quizSubmissions, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [quizSubmissions.attemptId], references: [quizAttempts.id] }),
  user: one(users, { fields: [quizSubmissions.userId], references: [users.id] }),
}));

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, { fields: [learningProgress.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const userMemoryRelations = relations(userMemory, ({ one }) => ({
  user: one(users, { fields: [userMemory.userId], references: [users.id] }),
}));

export const dailyMissionsRelations = relations(dailyMissions, ({ one }) => ({
  user: one(users, { fields: [dailyMissions.userId], references: [users.id] }),
}));

export const codingSessionsRelations = relations(codingSessions, ({ one, many }) => ({
  user: one(users, { fields: [codingSessions.userId], references: [users.id] }),
  versions: many(codeVersions),
}));

export const codeVersionsRelations = relations(codeVersions, ({ one }) => ({
  session: one(codingSessions, { fields: [codeVersions.sessionId], references: [codingSessions.id] }),
}));

export const codingStatsRelations = relations(codingStats, ({ one }) => ({
  user: one(users, { fields: [codingStats.userId], references: [users.id] }),
}));
