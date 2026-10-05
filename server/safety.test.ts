import { describe, expect, it } from "vitest";
import { analyzeSuspiciousMessage } from "../shared/safety";

describe("analyzeSuspiciousMessage", () => {
  it("flags urgent payment language as high risk", () => {
    const result = analyzeSuspiciousMessage("Urgent: verify your OTP PIN to claim a prize");
    expect(result.risk).toBe("high");
    expect(result.flags).toEqual(expect.arrayContaining(["urgent", "verify", "otp", "pin", "prize"]));
  });

  it("returns a caution result for one red flag", () => {
    const result = analyzeSuspiciousMessage("Please verify this request");
    expect(result.risk).toBe("check");
    expect(result.guidance).toContain("Pause");
  });

  it("does not invent a warning for a neutral message", () => {
    const result = analyzeSuspiciousMessage("Hello, see you at the meeting tomorrow");
    expect(result.risk).toBe("low");
    expect(result.flags).toHaveLength(0);
  });
});

  it("keeps blank input low risk while the UI can request a message first", () => {
    const result = analyzeSuspiciousMessage("   ");
    expect(result.risk).toBe("low");
    expect(result.flags).toHaveLength(0);
  });
