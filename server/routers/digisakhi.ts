import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  createAnnouncement,
  createForumPost,
  createForumReply,
  createIncidentReport,
  createModule,
  createQuizAttempt,
  ensureDefaultModules,
  getAdminStats,
  getAnnouncements,
  getIncidentReportsForAdmin,
  getModulesForAdmin,
  getForumPosts,
  getForumReplies,
  getLearningProgress,
  getPublishedModuleBySlug,
  getPublishedModules,
  getQuizAttempts,
  setForumPostPinned,
  setModuleLifecycle,
  updateIncidentStatus,
  updateModule,
  updateUserProfile,
  upsertLearningProgress,
} from "../db";

const quizQuestionInput = z.object({
  q: z.string().min(5),
  qHi: z.string().min(5),
  a: z.array(z.string().min(1)).length(3),
  aHi: z.array(z.string().min(1)).length(3),
  correct: z.number().int().min(0).max(2),
  explanation: z.string().min(5),
  explanationHi: z.string().min(5),
});

const moduleInput = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3),
  title: z.string().min(3),
  titleHi: z.string().min(3),
  category: z.string().min(2),
  description: z.string().min(10),
  descriptionHi: z.string().min(10),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  quizQuestions: z.array(quizQuestionInput).length(5),
});

const defaultModuleSeeds = [
  {
    slug: "privacy",
    title: "Keep your circle truly yours",
    titleHi: "अपना डिजिटल घेरा सुरक्षित रखें",
    category: "Social media privacy",
    description:
      "Small privacy choices can protect your photos, family and everyday routines.",
    descriptionHi:
      "छोटी-छोटी गोपनीयता सेटिंग्स आपकी तस्वीरों, परिवार और रोज़मर्रा की जानकारी को सुरक्षित रख सकती हैं।",
    published: 1,
  },
  {
    slug: "scams",
    title: "Pause before you pay",
    titleHi: "भुगतान से पहले रुकें",
    category: "Scams & phishing",
    description:
      "Learn the warning signs hiding in urgent messages, fake links and calls.",
    descriptionHi:
      "जल्दबाज़ी वाले संदेशों, नकली लिंक और कॉल में छिपे खतरे पहचानना सीखें।",
    published: 1,
  },
  {
    slug: "upi",
    title: "Your PIN is private",
    titleHi: "आपका PIN निजी है",
    category: "UPI safety",
    description:
      "A simple guide to safer payments, collect requests and trusted contacts.",
    descriptionHi:
      "सुरक्षित भुगतान, कलेक्ट अनुरोध और भरोसेमंद संपर्कों की सरल जानकारी।",
    published: 1,
  },
  {
    slug: "photos",
    title: "Share with care",
    titleHi: "सोचकर साझा करें",
    category: "Personal data",
    description:
      "Feel more in control of your photos, documents and phone permissions.",
    descriptionHi:
      "अपनी तस्वीरों, दस्तावेज़ों और फ़ोन अनुमतियों पर अधिक नियंत्रण रखें।",
    published: 1,
  },
] as const;

const requiredModules = ["privacy", "scams", "upi", "photos"] as const;
const defaultCorrectAnswers: Record<string, readonly number[]> = {
  privacy: [1, 0, 1, 1, 0],
  scams: [1, 0, 1, 1, 1],
  upi: [0, 1, 1, 0, 1],
  photos: [0, 1, 1, 0, 1],
};
const scamExplanationInput = z.object({
  flags: z.array(z.string().min(1)).min(1).max(8),
  risk: z.enum(["check", "high"]),
  language: z.enum(["en", "hi"]),
});

export const digisakhiRouter = router({
  modules: publicProcedure.query(async () => {
    await ensureDefaultModules(defaultModuleSeeds.map(seed => ({ ...seed })));
    return getPublishedModules();
  }),
  adminModules: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    return getModulesForAdmin();
  }),
  announcements: publicProcedure.query(async () => {
    const items = await getAnnouncements();
    return items.map(({ id, message, urgent, createdAt }) => ({
      id,
      message,
      urgent,
      createdAt,
    }));
  }),
  explainScam: publicProcedure
    .input(scamExplanationInput)
    .mutation(async ({ input }) => {
      const languageName = input.language === "hi" ? "Hindi" : "English";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are DigiSakhi, a calm digital safety educator for women in India. Explain scam warning signals in ${languageName}. Never claim certainty that a message is a scam. Use simple, reassuring language. Do not ask for personal information, OTPs, PINs, passwords, or the original message. Return only JSON matching the requested schema.`,
          },
          {
            role: "user",
            content: `Explain why a locally detected message deserves caution. The original message is private and is not provided. Detected signals: ${input.flags.join(", ")}. Local risk: ${input.risk}. Give one short explanation, three practical next steps, and a one-line reminder that the result is guidance rather than proof.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "scam_explanation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                explanation: { type: "string" },
                nextSteps: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 3,
                },
                reminder: { type: "string" },
              },
              required: ["explanation", "nextSteps", "reminder"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string")
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "The safety explanation was unavailable.",
        });
      try {
        const parsed = JSON.parse(content) as {
          explanation: string;
          nextSteps: string[];
          reminder: string;
        };
        if (
          !parsed.explanation ||
          parsed.nextSteps?.length !== 3 ||
          !parsed.reminder
        )
          throw new Error("Incomplete explanation");
        return parsed;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "The safety explanation was unavailable.",
        });
      }
    }),
  reportIncident: publicProcedure
    .input(
      z.object({
        description: z.string().trim().min(10),
        category: z.string().trim().min(2),
        anonymous: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await createIncidentReport({
        description: input.description.trim(),
        category: input.category.trim(),
        anonymous: input.anonymous ? 1 : 0,
        userId: input.anonymous ? null : (ctx.user?.id ?? null),
        status: "New",
      });
      return {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
      };
    }),
  progress: protectedProcedure.query(({ ctx }) =>
    getLearningProgress(ctx.user.id)
  ),
  attempts: protectedProcedure.query(({ ctx }) => getQuizAttempts(ctx.user.id)),
  completeModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().min(1),
        quizScore: z.number().int().min(0).max(5),
        questionCount: z.literal(5),
        answers: z
          .array(
            z.object({
              selected: z.number().int().min(0).max(2),
              correct: z.number().int().min(0).max(2),
            })
          )
          .length(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const module = await getPublishedModuleBySlug(input.moduleId);
      if (!module) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This learning module is not available.",
        });
      }
      let canonicalAnswers = defaultCorrectAnswers[input.moduleId];
      if (module.quizData) {
        try {
          const quiz = JSON.parse(module.quizData) as Array<{
            correct: number;
          }>;
          if (quiz.length !== 5) throw new Error("Invalid quiz data");
          canonicalAnswers = quiz.map(item => item.correct);
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "This learning module is temporarily unavailable.",
          });
        }
      }
      if (!canonicalAnswers || canonicalAnswers.length !== 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This learning module is not eligible for completion.",
        });
      }
      const expectedScore = input.answers.reduce(
        (total, answer, index) =>
          total + (answer.selected === canonicalAnswers[index] ? 1 : 0),
        0
      );
      if (
        input.quizScore !== expectedScore ||
        input.answers.some(
          (answer, index) => answer.correct !== canonicalAnswers[index]
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The quiz answers could not be verified.",
        });
      }
      const progress = await upsertLearningProgress({
        userId: ctx.user.id,
        moduleId: input.moduleId,
        quizScore: input.quizScore,
        questionCount: input.questionCount,
      });
      const attempt = await createQuizAttempt({
        userId: ctx.user.id,
        moduleId: input.moduleId,
        quizScore: input.quizScore,
        questionCount: input.questionCount,
        answers: JSON.stringify(input.answers),
      });
      return { progress, attempt };
    }),
  certificate: protectedProcedure.query(async ({ ctx }) => {
    const progress = await getLearningProgress(ctx.user.id);
    const completed = new Set(progress.map(item => item.moduleId));
    const unlocked = requiredModules.every(moduleId => completed.has(moduleId));
    return {
      unlocked,
      memberName: ctx.user.name ?? "DigiSakhi member",
      shgGroup: ctx.user.shgGroup ?? null,
      completedCount: requiredModules.filter(moduleId =>
        completed.has(moduleId)
      ).length,
      requiredCount: requiredModules.length,
      unlockedAt: unlocked
        ? (progress
            .map(item => item.completedAt)
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null)
        : null,
    };
  }),
  profile: protectedProcedure.query(({ ctx }) => ({
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      shgGroup: ctx.user.shgGroup,
      phone: ctx.user.phone,
      preferredLanguage: ctx.user.preferredLanguage,
    },
    needsSetup: !ctx.user.shgGroup || !ctx.user.phone,
  })),
  updateProfile: protectedProcedure
    .input(
      z.object({
        shgGroup: z.string().min(2),
        phone: z.string().min(7),
        preferredLanguage: z.enum(["en", "hi"]),
      })
    )
    .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  forumPosts: publicProcedure.query(async () => {
    const posts = await getForumPosts();
    return Promise.all(
      posts.map(async ({ id, title, body, anonymous, pinned, createdAt }) => ({
        id,
        title,
        body,
        anonymous,
        pinned,
        createdAt,
        replyCount: (await getForumReplies(id)).length,
      }))
    );
  }),
  forumReplies: publicProcedure
    .input(z.object({ postId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const replies = await getForumReplies(input.postId);
      return replies.map(({ id, postId, body, anonymous, createdAt }) => ({
        id,
        postId,
        body,
        anonymous,
        createdAt,
      }));
    }),
  createForumPost: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(5).max(180),
        body: z.string().trim().min(10),
        anonymous: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) =>
      createForumPost({
        userId: ctx.user.id,
        ...input,
        anonymous: input.anonymous ? 1 : 0,
        pinned: 0,
      })
    ),
  createForumReply: protectedProcedure
    .input(
      z.object({
        postId: z.number().int().positive(),
        body: z.string().trim().min(2),
        anonymous: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) =>
      createForumReply({
        userId: ctx.user.id,
        ...input,
        anonymous: input.anonymous ? 1 : 0,
      })
    ),
  pinForumPost: protectedProcedure
    .input(
      z.object({ postId: z.number().int().positive(), pinned: z.boolean() })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      return setForumPostPinned(input.postId, input.pinned);
    }),
  adminStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    return getAdminStats();
  }),
  incidentReports: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    return getIncidentReportsForAdmin();
  }),
  updateIncidentStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.number().int().positive(),
        status: z.enum(["New", "In Review", "Resolved"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      return updateIncidentStatus(input.reportId, input.status);
    }),
  publishAnnouncement: protectedProcedure
    .input(
      z.object({
        message: z.string().min(5),
        urgent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      const announcement = await createAnnouncement({
        adminId: ctx.user.id,
        message: input.message.trim(),
        urgent: input.urgent ? 1 : 0,
      });
      return {
        ...announcement,
        notification: input.urgent ? "members-in-app" : "dashboard",
      };
    }),
  createModule: protectedProcedure
    .input(moduleInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      const { quizQuestions, ...module } = input;
      return createModule({
        ...module,
        quizData: JSON.stringify(quizQuestions),
        createdBy: ctx.user.id,
        published: 1,
      });
    }),
  updateModule: protectedProcedure
    .input(moduleInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      const { id, quizQuestions, ...module } = input;
      return updateModule(id, {
        ...module,
        quizData: JSON.stringify(quizQuestions),
      });
    }),
  setModuleLifecycle: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        published: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      return setModuleLifecycle(input.id, {
        ...(input.published === undefined
          ? {}
          : { published: input.published ? 1 : 0 }),
        ...(input.archived === undefined
          ? {}
          : { archived: input.archived ? 1 : 0 }),
      });
    }),
});
