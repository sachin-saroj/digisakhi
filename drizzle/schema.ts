import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  shgGroup: varchar("shgGroup", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "hi"])
    .default("en")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: text("title").notNull(),
  titleHi: text("titleHi"),
  category: varchar("category", { length: 96 }).notNull(),
  description: text("description").notNull(),
  descriptionHi: text("descriptionHi"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  videoUrl: varchar("videoUrl", { length: 512 }),
  quizData: text("quizData"),
  published: int("published").notNull().default(1),
  archived: int("archived").notNull().default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  message: text("message").notNull(),
  urgent: int("urgent").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export const incidentReports = mysqlTable("incident_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  anonymous: int("anonymous").notNull().default(1),
  status: mysqlEnum("status", ["New", "In Review", "Resolved"])
    .notNull()
    .default("New"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IncidentReport = typeof incidentReports.$inferSelect;
export type InsertIncidentReport = typeof incidentReports.$inferInsert;

export const learningProgress = mysqlTable(
  "learning_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    moduleId: varchar("moduleId", { length: 64 }).notNull(),
    quizScore: int("quizScore").notNull().default(0),
    questionCount: int("questionCount").notNull().default(0),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userModuleUnique: unique("learning_progress_user_module_unique").on(
      table.userId,
      table.moduleId
    ),
  })
);
export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: varchar("moduleId", { length: 64 }).notNull(),
  quizScore: int("quizScore").notNull(),
  questionCount: int("questionCount").notNull(),
  answers: text("answers").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export const forumPosts = mysqlTable("forum_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  anonymous: int("anonymous").notNull().default(0),
  pinned: int("pinned").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

export const forumReplies = mysqlTable("forum_replies", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  body: text("body").notNull(),
  anonymous: int("anonymous").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;
