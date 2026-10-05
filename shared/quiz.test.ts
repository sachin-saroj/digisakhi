import { describe, expect, it } from "vitest";
import { scoreQuizAnswers } from "./quiz";

describe("quiz scoring", () => {
  it("calculates score, percentage, correct, and wrong answers", () => {
    expect(scoreQuizAnswers([1, 0, 2, 0, 1], [1, 2, 2, 0, 1])).toEqual({
      score: 4,
      total: 5,
      percentage: 80,
      correct: 4,
      wrong: 1,
    });
  });

  it("returns a zero score when every answer is wrong", () => {
    expect(scoreQuizAnswers([0, 0, 0], [1, 1, 1])).toMatchObject({
      score: 0,
      percentage: 0,
      correct: 0,
      wrong: 3,
    });
  });

  it("rejects incomplete answer sets", () => {
    expect(() => scoreQuizAnswers([0], [0, 1])).toThrow(
      "Quiz answer and key lengths must match"
    );
  });
});
