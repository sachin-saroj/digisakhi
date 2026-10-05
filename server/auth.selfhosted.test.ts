import "dotenv/config";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type SetCookieCall = {
  name: string;
  val: string;
  options: Record<string, unknown>;
};

function createMockContext(): {
  ctx: TrpcContext;
  setCookies: SetCookieCall[];
} {
  const setCookies: SetCookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, val: string, options: Record<string, unknown>) => {
        setCookies.push({ name, val, options });
      },
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx, setCookies };
}

describe("Self-hosted auth procedures", () => {
  it("allows 1-click demo login for sakhi member", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.demoLogin({ role: "user" });

    expect(result.success).toBe(true);
    expect(result.user.name).toContain("Radha");
    expect(result.user.role).toBe("user");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
    expect(setCookies[0]?.val).toBeTruthy();
  });

  it("allows 1-click demo login for coordinator admin", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.demoLogin({ role: "admin" });

    expect(result.success).toBe(true);
    expect(result.user.name).toContain("Pooja");
    expect(result.user.role).toBe("admin");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("allows direct login with phone/identifier", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      identifier: "9988776655",
      name: "Test Sakhi",
      role: "user",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Test Sakhi");
    expect(result.user.phone).toBe("9988776655");
    expect(setCookies).toHaveLength(1);
  });
});
