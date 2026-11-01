import {
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 * Local SQLite storage with zero external dependencies.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  shgGroup: text("shgGroup"),
  phone: text("phone"),
  preferredLanguage: text("preferredLanguage", { enum: ["en", "hi"] })
    .default("en")
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const modules = sqliteTable("modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleHi: text("titleHi"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  descriptionHi: text("descriptionHi"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  quizData: text("quizData"),
  published: integer("published").notNull().default(1),
  archived: integer("archived").notNull().default(0),
  createdBy: integer("createdBy"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("adminId").notNull(),
  message: text("message").notNull(),
  urgent: integer("urgent").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export const incidentReports = sqliteTable("incident_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  description: text("description").notNull(),
  category: text("category").notNull(),
  anonymous: integer("anonymous").notNull().default(1),
  status: text("status", { enum: ["New", "In Review", "Resolved"] })
    .notNull()
    .default("New"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type IncidentReport = typeof incidentReports.$inferSelect;
export type InsertIncidentReport = typeof incidentReports.$inferInsert;

export const learningProgress = sqliteTable(
  "learning_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    moduleId: text("moduleId").notNull(),
    quizScore: integer("quizScore").notNull().default(0),
    questionCount: integer("questionCount").notNull().default(0),
    completedAt: integer("completedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
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

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  moduleId: text("moduleId").notNull(),
  quizScore: integer("quizScore").notNull(),
  questionCount: integer("questionCount").notNull(),
  answers: text("answers").notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export const forumPosts = sqliteTable("forum_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  anonymous: integer("anonymous").notNull().default(0),
  pinned: integer("pinned").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

export const forumReplies = sqliteTable("forum_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  body: text("body").notNull(),
  anonymous: integer("anonymous").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;
