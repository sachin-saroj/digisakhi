import "dotenv/config";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test",
      email: "test@example.com",
      name: "Test",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("DigiSakhi role guards", () => {
  it("allows an admin to publish an urgent announcement", async () => {
    const result = await appRouter
      .createCaller(context("admin"))
      .digisakhi.publishAnnouncement({
        message: "Pause before opening unknown links",
        urgent: true,
      });
    expect(result.notification).toBe("members-in-app");
    expect(result.adminId).toBe(1);
  });

  it("blocks members from publishing announcements", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.publishAnnouncement({
        message: "Not allowed",
        urgent: false,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects modules that do not contain exactly five quiz questions", async () => {
    await expect(
      appRouter.createCaller(context("admin")).digisakhi.createModule({
        slug: "incomplete-module",
        title: "Incomplete module",
        titleHi: "अधूरा मॉड्यूल",
        category: "Safety",
        description: "A module with an invalid question count.",
        descriptionHi: "गलत सवाल संख्या वाला मॉड्यूल।",
        quizQuestions: [],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects completion payloads that do not include five answers", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.completeModule({
        moduleId: "privacy",
        quizScore: 0,
        questionCount: 5,
        answers: [],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects completion payloads whose answer key does not match the module", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.completeModule({
        moduleId: "privacy",
        quizScore: 0,
        questionCount: 5,
        answers: Array.from({ length: 5 }, () => ({ selected: 0, correct: 0 })),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks members from reviewing incident reports", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.incidentReports()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks members from changing incident status", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.updateIncidentStatus({
        reportId: 1,
        status: "In Review",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks members from module administration", async () => {
    await expect(
      appRouter.createCaller(context("user")).digisakhi.adminModules()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      appRouter.createCaller(context("user")).digisakhi.setModuleLifecycle({
        id: 1,
        published: false,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
