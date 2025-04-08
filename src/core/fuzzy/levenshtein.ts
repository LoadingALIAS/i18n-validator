/**
 * Optimized Levenshtein distance with linear space and early termination
 *
 * @param a First string to compare
 * @param b Second string to compare
 * @param maxDistance Maximum edit distance to consider (for early termination)
 * @returns The edit distance, or Infinity if it exceeds maxDistance
 */
export function levenshteinDistance(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length <= maxDistance ? b.length : Number.POSITIVE_INFINITY;
  if (b.length === 0) return a.length <= maxDistance ? a.length : Number.POSITIVE_INFINITY;

  // Use the shorter string as row for minimal memory
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const row = Array(short.length + 1)
    .fill(0)
    .map((_, i) => i);

  for (let i = 1; i <= long.length; i++) {
    let prev = i;
    let minInRow = i;
    for (let j = 1; j <= short.length; j++) {
      const substitutionCost = short[j - 1] === long[i - 1] ? 0 : 1;
      const next = Math.min(
        row[j] + 1, // deletion
        prev + 1, // insertion
        row[j - 1] + substitutionCost, // substitution
      );
      row[j - 1] = prev;
      prev = next;
      minInRow = Math.min(minInRow, next);
    }
    row[short.length] = prev;
    if (minInRow > maxDistance) return Number.POSITIVE_INFINITY; // Early termination
  }
  return row[short.length] <= maxDistance ? row[short.length] : Number.POSITIVE_INFINITY;
}
