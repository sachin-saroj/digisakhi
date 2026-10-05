export type QuizScoreSummary = {
  score: number;
  total: number;
  percentage: number;
  correct: number;
  wrong: number;
};

export function scoreQuizAnswers(
  selectedAnswers: readonly number[],
  correctAnswers: readonly number[]
): QuizScoreSummary {
  if (selectedAnswers.length !== correctAnswers.length) {
    throw new Error("Quiz answer and key lengths must match");
  }
  const score = selectedAnswers.reduce(
    (total, selected, index) =>
      total + (selected === correctAnswers[index] ? 1 : 0),
    0
  );
  const total = correctAnswers.length;
  return {
    score,
    total,
    percentage: total ? Math.round((score / total) * 100) : 0,
    correct: score,
    wrong: total - score,
  };
}
