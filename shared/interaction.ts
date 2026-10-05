export type SubmissionState = "missing" | "ready";
export type SubmissionOutcome = "prompt-details" | "saved-private" | "posted-to-community";

export function getReportSubmissionState(value: string): SubmissionState {
  return value.trim().length > 0 ? "ready" : "missing";
}

export function getCommunitySubmissionState(value: string): SubmissionState {
  return value.trim().length > 0 ? "ready" : "missing";
}

export function getReportSubmissionOutcome(value: string): SubmissionOutcome {
  return getReportSubmissionState(value) === "missing" ? "prompt-details" : "saved-private";
}

export function getCommunitySubmissionOutcome(value: string): SubmissionOutcome {
  return getCommunitySubmissionState(value) === "missing" ? "prompt-details" : "posted-to-community";
}
