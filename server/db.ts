import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  IncidentReport,
  InsertIncidentReport,
  InsertLearningProgress,
  InsertModule,
  InsertQuizAttempt,
  InsertAnnouncement,
  InsertForumPost,
  InsertForumReply,
  InsertUser,
  LearningProgress,
  Module,
  QuizAttempt,
  Announcement,
  ForumPost,
  ForumReply,
  announcements,
  incidentReports,
  learningProgress,
  modules,
  quizAttempts,
  forumPosts,
  forumReplies,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const isCloud =
        process.env.DATABASE_URL.includes("tidbcloud") ||
        process.env.DATABASE_URL.includes("aws") ||
        process.env.DATABASE_URL.includes("ssl");
      _db = drizzle({
        connection: {
          uri: process.env.DATABASE_URL,
          ssl: isCloud ? { rejectUnauthorized: true } : undefined,
        },
      });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  input: { shgGroup: string; phone: string; preferredLanguage: "en" | "hi" }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set(input).where(eq(users.id, userId));
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!result[0]) throw new Error("Profile was not found");
  return result[0];
}

export async function createIncidentReport(
  input: InsertIncidentReport
): Promise<IncidentReport> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(incidentReports).values(input);
  const id = Number(result[0].insertId);
  const created = await db
    .select()
    .from(incidentReports)
    .where(eq(incidentReports.id, id))
    .limit(1);
  if (!created[0]) throw new Error("Incident report was not created");
  return created[0];
}

export async function getIncidentReportsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: incidentReports.id,
      description: incidentReports.description,
      category: incidentReports.category,
      anonymous: incidentReports.anonymous,
      status: incidentReports.status,
      createdAt: incidentReports.createdAt,
      updatedAt: incidentReports.updatedAt,
    })
    .from(incidentReports)
    .orderBy(desc(incidentReports.createdAt))
    .limit(25);
}

export async function updateIncidentStatus(
  reportId: number,
  status: "New" | "In Review" | "Resolved"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(incidentReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(incidentReports.id, reportId));
  const result = await db
    .select({
      id: incidentReports.id,
      description: incidentReports.description,
      category: incidentReports.category,
      anonymous: incidentReports.anonymous,
      status: incidentReports.status,
      createdAt: incidentReports.createdAt,
      updatedAt: incidentReports.updatedAt,
    })
    .from(incidentReports)
    .where(eq(incidentReports.id, reportId))
    .limit(1);
  if (!result[0]) throw new Error("Incident report was not found");
  return result[0];
}

export async function getLearningProgress(
  userId: number
): Promise<LearningProgress[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(learningProgress)
    .where(eq(learningProgress.userId, userId))
    .orderBy(desc(learningProgress.updatedAt));
}

export async function upsertLearningProgress(
  input: InsertLearningProgress
): Promise<LearningProgress> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .insert(learningProgress)
    .values(input)
    .onDuplicateKeyUpdate({
      set: {
        quizScore: input.quizScore,
        questionCount: input.questionCount,
        completedAt: input.completedAt ?? new Date(),
        updatedAt: new Date(),
      },
    });
  const result = await db
    .select()
    .from(learningProgress)
    .where(
      and(
        eq(learningProgress.userId, input.userId),
        eq(learningProgress.moduleId, input.moduleId)
      )
    )
    .limit(1);
  if (!result[0]) throw new Error("Learning progress was not saved");
  return result[0];
}

export async function getPublishedModules(): Promise<Module[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(modules)
    .where(and(eq(modules.published, 1), eq(modules.archived, 0)))
    .orderBy(modules.id);
}

export async function getPublishedModuleBySlug(
  slug: string
): Promise<Module | undefined> {
  const db = await getDb();
  if (!db) return undefined;
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
  const db = await getDb();
  if (!db) return [];
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
      .onDuplicateKeyUpdate({ set: { published: 1, archived: 0 } });
  }
  return db
    .select()
    .from(modules)
    .where(and(eq(modules.published, 1), eq(modules.archived, 0)))
    .orderBy(modules.id);
}

export async function createModule(input: InsertModule): Promise<Module> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(modules).values(input);
  const created = await db
    .select()
    .from(modules)
    .where(eq(modules.id, Number(result[0].insertId)))
    .limit(1);
  if (!created[0]) throw new Error("Module was not created");
  return created[0];
}

export async function getModulesForAdmin(): Promise<Module[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(modules).orderBy(modules.id);
}

export async function updateModule(
  moduleId: number,
  input: Partial<InsertModule>
): Promise<Module> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(modules)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(modules.id, moduleId));
  const result = await db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);
  if (!result[0]) throw new Error("Module was not found");
  return result[0];
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
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(announcements).values(input);
  const created = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, Number(result[0].insertId)))
    .limit(1);
  if (!created[0]) throw new Error("Announcement was not created");
  return created[0];
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createQuizAttempt(
  input: InsertQuizAttempt
): Promise<QuizAttempt> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(quizAttempts).values(input);
  const created = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.id, Number(result[0].insertId)))
    .limit(1);
  if (!created[0]) throw new Error("Quiz attempt was not created");
  return created[0];
}

export async function getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.completedAt));
}

export async function createForumPost(
  input: InsertForumPost
): Promise<ForumPost> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(forumPosts).values(input);
  const created = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.id, Number(result[0].insertId)))
    .limit(1);
  if (!created[0]) throw new Error("Forum post was not created");
  return created[0];
}

export async function getForumPosts(): Promise<ForumPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(forumPosts)
    .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt));
}

export async function createForumReply(
  input: InsertForumReply
): Promise<ForumReply> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(forumReplies).values(input);
  const created = await db
    .select()
    .from(forumReplies)
    .where(eq(forumReplies.id, Number(result[0].insertId)))
    .limit(1);
  if (!created[0]) throw new Error("Forum reply was not created");
  return created[0];
}

export async function getForumReplies(postId: number): Promise<ForumReply[]> {
  const db = await getDb();
  if (!db) return [];
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
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(forumPosts)
    .set({ pinned: pinned ? 1 : 0 })
    .where(eq(forumPosts.id, postId));
  const result = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.id, postId))
    .limit(1);
  if (!result[0]) throw new Error("Forum post was not found");
  return result[0];
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db)
    return {
      members: 0,
      completedModules: 0,
      averageScore: 0,
      newReports: 0,
      attempts: 0,
      moduleAnalytics: [],
    };
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
        value: sql<number>`coalesce(avg(${quizAttempts.quizScore} / nullif(${quizAttempts.questionCount}, 0) * 100), 0)`,
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
        averageScore: sql<number>`coalesce(avg(${quizAttempts.quizScore} / nullif(${quizAttempts.questionCount}, 0) * 100), 0)`,
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
