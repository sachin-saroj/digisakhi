import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { digisakhiRouter } from "./routers/digisakhi";

export const appRouter = router({
  system: systemRouter,
  digisakhi: digisakhiRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    demoLogin: publicProcedure
      .input(z.object({ role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getOrCreateDemoUser(input.role);
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "Demo User",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user };
      }),
    login: publicProcedure
      .input(
        z.object({
          identifier: z.string().min(2, "Please enter phone, email, or username"),
          name: z.string().optional(),
          role: z.enum(["user", "admin"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.authenticateOrRegisterUser({
          identifier: input.identifier,
          name: input.name,
          role: input.role,
        });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "Member",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          phone: z.string().min(10, "Please enter a valid mobile number"),
          email: z.string().email().optional().or(z.literal("")),
          role: z.enum(["user", "admin"]).default("user"),
          shgGroup: z.string().optional(),
          preferredLanguage: z.enum(["en", "hi"]).default("hi"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.authenticateOrRegisterUser({
          identifier: input.phone,
          name: input.name,
          role: input.role,
          shgGroup: input.shgGroup,
          preferredLanguage: input.preferredLanguage,
        });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "Member",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, user };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
