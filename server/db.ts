import Database from "better-sqlite3";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import {
  Announcement,
  ForumPost,
  ForumReply,
  IncidentReport,
  InsertAnnouncement,
  InsertForumPost,
  InsertForumReply,
  InsertIncidentReport,
  InsertLearningProgress,
  InsertModule,
  InsertQuizAttempt,
  InsertUser,
  LearningProgress,
  Module,
  QuizAttempt,
  User,
  announcements,
  forumPosts,
  forumReplies,
  incidentReports,
  learningProgress,
  modules,
  quizAttempts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const defaultDb = isTest
  ? path.resolve(process.cwd(), `test_${process.pid}.db`)
  : path.resolve(process.cwd(), "digisakhi.db");

const dbPath = process.env.DATABASE_URL?.replace(/^sqlite:\/\//, "") || defaultDb;

const sqlite = new Database(dbPath, { timeout: 10000 });

try {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
} catch {
  // WAL or busy_timeout may already be set by another process
}

// Auto-initialize SQLite schema if missing
const tableExists = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
  .get();

if (!tableExists) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      openId TEXT NOT NULL,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      shgGroup TEXT,
      phone TEXT,
      preferredLanguage TEXT NOT NULL DEFAULT 'en',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastSignedIn INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_openId_unique ON users (openId);

    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      titleHi TEXT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      descriptionHi TEXT,
      imageUrl TEXT,
      videoUrl TEXT,
      quizData TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      archived INTEGER NOT NULL DEFAULT 0,
      createdBy INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS modules_slug_unique ON modules (slug);

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      adminId INTEGER NOT NULL,
      message TEXT NOT NULL,
      urgent INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incident_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      userId INTEGER,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      anonymous INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'New',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      userId INTEGER NOT NULL,
      moduleId TEXT NOT NULL,
      quizScore INTEGER NOT NULL DEFAULT 0,
      questionCount INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS learning_progress_user_module_unique ON learning_progress (userId, moduleId);

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      userId INTEGER NOT NULL,
      moduleId TEXT NOT NULL,
      quizScore INTEGER NOT NULL,
      questionCount INTEGER NOT NULL,
      answers TEXT NOT NULL,
      completedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      anonymous INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      body TEXT NOT NULL,
      anonymous INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
  `);
}

export const db = drizzle(sqlite);

export async function getDb() {
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const values: InsertUser = {
    openId: user.openId,
  };
  const updateSet: Record<string, unknown> = {};

  const textFields = [
    "name",
    "email",
    "loginMethod",
    "shgGroup",
    "phone",
  ] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.preferredLanguage !== undefined) {
    values.preferredLanguage = user.preferredLanguage;
    updateSet.preferredLanguage = user.preferredLanguage;
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

export async function getUserByIdentifier(identifier: string): Promise<User | undefined> {
  const clean = identifier.trim();
  const result = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.openId, clean),
        eq(users.phone, clean),
        eq(users.email, clean)
      )
    )
    .limit(1);

  return result[0];
}

export async function getOrCreateDemoUser(role: "user" | "admin"): Promise<User> {
  const openId = role === "admin" ? "demo_admin_pooja" : "demo_member_radha";
  const now = new Date();

  const demoData: InsertUser =
    role === "admin"
      ? {
          openId,
          name: "Pooja Sharma (SHG Coordinator)",
          email: "pooja.sharma@digisakhi.in",
          phone: "9876543211",
          role: "admin",
          shgGroup: "District Federation Coordinator",
          preferredLanguage: "hi",
          loginMethod: "demo",
          lastSignedIn: now,
          createdAt: now,
          updatedAt: now,
        }
      : {
          openId,
          name: "Radha Devi (राधा देवी)",
          email: "radha.devi@digisakhi.in",
          phone: "9876543210",
          role: "user",
          shgGroup: "Gulab Mahila Bachat Gat",
          preferredLanguage: "hi",
          loginMethod: "demo",
          lastSignedIn: now,
          createdAt: now,
          updatedAt: now,
        };

  const existing = await getUserByOpenId(openId);
  if (existing) {
    await upsertUser({
      openId,
      lastSignedIn: now,
    });
    return (await getUserByOpenId(openId)) || existing;
  }

  await upsertUser(demoData);
  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Demo user initialization failed");
  return created;
}

export async function authenticateOrRegisterUser(input: {
  identifier: string;
  name?: string;
  role?: "user" | "admin";
  shgGroup?: string;
  preferredLanguage?: "en" | "hi";
}): Promise<User> {
  const cleanId = input.identifier.trim();
  const now = new Date();
  const isPhone = /^[0-9+\s-]{8,15}$/.test(cleanId);
  const isEmail = cleanId.includes("@");
  const uniqueSuffix = Date.now().toString(36);
  const openId = `user_${isPhone ? cleanId.replace(/\D/g, "") : isEmail ? cleanId.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") : "sakhi"}_${uniqueSuffix}`.slice(0, 64);

  const existing = await getUserByIdentifier(cleanId);
  if (existing) {
    await upsertUser({
      openId: existing.openId,
      name: input.name ? input.name.trim() : existing.name,
      role: input.role ?? existing.role,
      shgGroup: input.shgGroup ?? existing.shgGroup,
      preferredLanguage: input.preferredLanguage ?? existing.preferredLanguage,
      lastSignedIn: now,
    });
    return (await getUserByOpenId(existing.openId)) || existing;
  }

  const newUser: InsertUser = {
    openId,
    name: input.name?.trim() || (isPhone ? `Sakhi ${cleanId.slice(-4)}` : cleanId),
    phone: isPhone ? cleanId.replace(/\D/g, "") : null,
    email: isEmail ? cleanId : null,
    role: input.role ?? "user",
    shgGroup: input.shgGroup || "Mahila Bachat Gat",
    preferredLanguage: input.preferredLanguage || "hi",
    loginMethod: "direct",
    lastSignedIn: now,
    createdAt: now,
    updatedAt: now,
  };

  await upsertUser(newUser);
  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Failed to register user");
  return created;
}

export async function updateUserProfile(
  userId: number,
  input: { shgGroup: string; phone: string; preferredLanguage: "en" | "hi" }
): Promise<User> {
  const [result] = await db
    .update(users)
    .set(input)
    .where(eq(users.id, userId))
    .returning();
  if (!result) throw new Error("Profile was not found");
  return result;
}

export async function createIncidentReport(
  input: InsertIncidentReport
): Promise<IncidentReport> {
  const [created] = await db.insert(incidentReports).values(input).returning();
  if (!created) throw new Error("Incident report was not created");
  return created;
}

export async function getIncidentReportsForAdmin(): Promise<IncidentReport[]> {
  return db
    .select()
    .from(incidentReports)
    .orderBy(desc(incidentReports.createdAt))
    .limit(25);
}

export async function updateIncidentStatus(
  reportId: number,
  status: "New" | "In Review" | "Resolved"
): Promise<IncidentReport> {
  const [result] = await db
    .update(incidentReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(incidentReports.id, reportId))
    .returning();
  if (!result) throw new Error("Incident report was not found");
  return result;
}

export async function getLearningProgress(
  userId: number
): Promise<LearningProgress[]> {
  return db
    .select()
    .from(learningProgress)
    .where(eq(learningProgress.userId, userId))
    .orderBy(desc(learningProgress.updatedAt));
}

export async function upsertLearningProgress(
  input: InsertLearningProgress
): Promise<LearningProgress> {
  const [result] = await db
    .insert(learningProgress)
    .values(input)
    .onConflictDoUpdate({
      target: [learningProgress.userId, learningProgress.moduleId],
      set: {
        quizScore: input.quizScore,
        questionCount: input.questionCount,
        completedAt: input.completedAt ?? new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!result) throw new Error("Learning progress was not saved");
  return result;
}

export async function getPublishedModules(): Promise<Module[]> {
  return db
    .select()
    .from(modules)
    .where(and(eq(modules.published, 1), eq(modules.archived, 0)))
    .orderBy(modules.id);
}

export async function getPublishedModuleBySlug(
  slug: string
): Promise<Module | undefined> {
  const result = await db
    .select()
    .from(modules)
    .where(
      and(
        eq(modules.slug, slug),
        eq(modules.published, 1),
        eq(modules.archived, 0)
      )
    )
    .limit(1);
  return result[0];
}

export async function ensureDefaultModules(
  seed: InsertModule[]
): Promise<Module[]> {
  const existing = await db
    .select()
    .from(modules)
    .where(and(eq(modules.published, 1), eq(modules.archived, 0)))
    .orderBy(modules.id);
  if (existing.length > 0) return existing;

  for (const module of seed) {
    await db
      .insert(modules)
      .values(module)
      .onConflictDoUpdate({
        target: modules.slug,
        set: { published: 1, archived: 0 },
      });
  }

  return db
    .select()
    .from(modules)
    .where(and(eq(modules.published, 1), eq(modules.archived, 0)))
    .orderBy(modules.id);
}

export async function createModule(input: InsertModule): Promise<Module> {
  const [created] = await db.insert(modules).values(input).returning();
  if (!created) throw new Error("Module was not created");
  return created;
}

export async function getModulesForAdmin(): Promise<Module[]> {
  return db.select().from(modules).orderBy(modules.id);
}

export async function updateModule(
  moduleId: number,
  input: Partial<InsertModule>
): Promise<Module> {
  const [result] = await db
    .update(modules)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(modules.id, moduleId))
    .returning();
  if (!result) throw new Error("Module was not found");
  return result;
}

export async function setModuleLifecycle(
  moduleId: number,
  input: { published?: number; archived?: number }
): Promise<Module> {
  return updateModule(moduleId, input);
}

export async function createAnnouncement(
  input: InsertAnnouncement
): Promise<Announcement> {
  const [created] = await db.insert(announcements).values(input).returning();
  if (!created) throw new Error("Announcement was not created");
  return created;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createQuizAttempt(
  input: InsertQuizAttempt
): Promise<QuizAttempt> {
  const [created] = await db.insert(quizAttempts).values(input).returning();
  if (!created) throw new Error("Quiz attempt was not created");
  return created;
}

export async function getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
  return db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.completedAt));
}

export async function createForumPost(
  input: InsertForumPost
): Promise<ForumPost> {
  const [created] = await db.insert(forumPosts).values(input).returning();
  if (!created) throw new Error("Forum post was not created");
  return created;
}

export async function getForumPosts(): Promise<ForumPost[]> {
  return db
    .select()
    .from(forumPosts)
    .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt));
}

export async function createForumReply(
  input: InsertForumReply
): Promise<ForumReply> {
  const [created] = await db.insert(forumReplies).values(input).returning();
  if (!created) throw new Error("Forum reply was not created");
  return created;
}

export async function getForumReplies(postId: number): Promise<ForumReply[]> {
  return db
    .select()
    .from(forumReplies)
    .where(eq(forumReplies.postId, postId))
    .orderBy(forumReplies.createdAt);
}

export async function setForumPostPinned(
  postId: number,
  pinned: boolean
): Promise<ForumPost> {
  const [result] = await db
    .update(forumPosts)
    .set({ pinned: pinned ? 1 : 0 })
    .where(eq(forumPosts.id, postId))
    .returning();
  if (!result) throw new Error("Forum post was not found");
  return result;
}

export async function getAdminStats() {
  const [
    members,
    completedModules,
    averageScore,
    newReports,
    attempts,
    moduleAnalytics,
  ] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db.select({ value: sql<number>`count(*)` }).from(learningProgress),
    db
      .select({
        value: sql<number>`coalesce(avg(${quizAttempts.quizScore} * 100.0 / nullif(${quizAttempts.questionCount}, 0)), 0)`,
      })
      .from(quizAttempts),
    db
      .select({ value: sql<number>`count(*)` })
      .from(incidentReports)
      .where(eq(incidentReports.status, "New")),
    db.select({ value: sql<number>`count(*)` }).from(quizAttempts),
    db
      .select({
        moduleId: quizAttempts.moduleId,
        attempts: sql<number>`count(*)`,
        completions: sql<number>`count(distinct ${quizAttempts.userId})`,
        averageScore: sql<number>`coalesce(avg(${quizAttempts.quizScore} * 100.0 / nullif(${quizAttempts.questionCount}, 0)), 0)`,
      })
      .from(quizAttempts)
      .groupBy(quizAttempts.moduleId),
  ]);

  return {
    members: Number(members[0]?.value ?? 0),
    completedModules: Number(completedModules[0]?.value ?? 0),
    averageScore: Math.round(Number(averageScore[0]?.value ?? 0)),
    newReports: Number(newReports[0]?.value ?? 0),
    attempts: Number(attempts[0]?.value ?? 0),
    moduleAnalytics: moduleAnalytics.map(item => ({
      moduleId: item.moduleId,
      attempts: Number(item.attempts ?? 0),
      completions: Number(item.completions ?? 0),
      averageScore: Math.round(Number(item.averageScore ?? 0)),
    })),
  };
}
