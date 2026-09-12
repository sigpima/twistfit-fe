import type { Season } from './personalColorQuiz'

// Placeholder scoring: majority vote across answers, ties broken by the
// season that reaches the max count first. Replace with the real scoring
// algorithm once it is configured.
export function computeSeasonResult(answers: Season[]): Season {
  const counts = new Map<Season, number>()

  let winner = answers[0]
  let winnerCount = 0

  for (const season of answers) {
    const count = (counts.get(season) ?? 0) + 1
    counts.set(season, count)

    if (count > winnerCount) {
      winnerCount = count
      winner = season
    }
  }

  return winner
}
