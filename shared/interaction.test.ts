import { describe, expect, it } from "vitest";
import {
  getCommunitySubmissionOutcome,
  getCommunitySubmissionState,
  getReportSubmissionOutcome,
  getReportSubmissionState,
} from "./interaction";

describe("homepage submission behavior", () => {
  it("prompts for details when a report is blank and saves a non-empty report privately", () => {
    expect(getReportSubmissionState("   ")).toBe("missing");
    expect(getReportSubmissionOutcome("   ")).toBe("prompt-details");
    expect(getReportSubmissionState("Unknown caller asked for my OTP")).toBe("ready");
    expect(getReportSubmissionOutcome("Unknown caller asked for my OTP")).toBe("saved-private");
  });

  it("prompts for text when a community post is blank and posts meaningful text", () => {
    expect(getCommunitySubmissionState("\n\t")).toBe("missing");
    expect(getCommunitySubmissionOutcome("\n\t")).toBe("prompt-details");
    expect(getCommunitySubmissionState("How do I verify this payment request?")).toBe("ready");
    expect(getCommunitySubmissionOutcome("How do I verify this payment request?")).toBe("posted-to-community");
  });
});
