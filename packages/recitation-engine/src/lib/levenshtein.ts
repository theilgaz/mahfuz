/**
 * Levenshtein distance utilities.
 * Ported from offline-tarteel.
 */

/** Edit distance between two strings (O(min(m,n)) space). */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (a.length > b.length) [a, b] = [b, a];

  const m = a.length;
  const n = b.length;
  let prev = new Uint16Array(m + 1);
  let curr = new Uint16Array(m + 1);

  for (let i = 0; i <= m; i++) prev[i] = i;

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

/** Normalized similarity ratio (1.0 = identical, 0.0 = different). */
export function ratio(a: string, b: string): number {
  const lenSum = a.length + b.length;
  if (lenSum === 0) return 1.0;
  return (lenSum - distance(a, b)) / lenSum;
}

/** Semi-global distance: align query against any substring of ref. */
export function semiGlobalDistance(query: string, ref: string): number {
  if (query.length === 0) return 0;
  if (ref.length === 0) return query.length;
  const m = query.length;
  const n = ref.length;
  let prev = new Uint16Array(m + 1);
  let curr = new Uint16Array(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;
  let best = prev[m];
  for (let j = 1; j <= n; j++) {
    curr[0] = 0;
    for (let i = 1; i <= m; i++) {
      const cost = query[i - 1] === ref[j - 1] ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    best = Math.min(best, curr[m]);
    [prev, curr] = [curr, prev];
  }
  return best;
}

/** Fragment score: how well does query match as a fragment of ref? (0-1) */
export function fragmentScore(query: string, ref: string): number {
  if (query.length === 0) return 1.0;
  return Math.max(0, 1 - semiGlobalDistance(query, ref) / query.length);
}
