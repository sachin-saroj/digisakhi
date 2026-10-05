export const scamRedFlags = ["urgent", "otp", "pin", "prize", "blocked", "click", "verify", "refund"] as const;

export function analyzeSuspiciousMessage(message: string) {
  const normalized = message.toLowerCase();
  const flags = scamRedFlags.filter((keyword) => normalized.includes(keyword));
  return {
    flags,
    risk: flags.length >= 3 ? "high" : flags.length > 0 ? "check" : "low",
    guidance: flags.length > 0
      ? "Pause. Never share OTPs, PINs or passwords. Verify using an official source."
      : "No obvious keyword red flags found. Still verify independently before acting.",
  } as const;
}
