/**
 * Hybrid identity name matcher (MVP: self-declared name on document).
 * Future: swap/implement OcrMatcher extracting text from ID images.
 */

const TITLE_RE =
  /^(mr|mrs|ms|miss|shri|smt|dr|prof|sir|madam)\.?$/i;

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !TITLE_RE.test(token))
    .join(' ')
    .trim();
}

function tokenSet(name: string): Set<string> {
  return new Set(normalizeName(name).split(' ').filter(Boolean));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface NameMatchResult {
  matched: boolean;
  score: number;
}

export interface IdentityNameMatcher {
  match(declaredName: string, registeredName: string): NameMatchResult;
}

/** MVP matcher: compare typed document name to registered account name. */
export class SelfDeclaredMatcher implements IdentityNameMatcher {
  constructor(private readonly threshold = 0.85) {}

  match(declaredName: string, registeredName: string): NameMatchResult {
    const a = normalizeName(declaredName);
    const b = normalizeName(registeredName);
    if (!a || !b) {
      return { matched: false, score: 0 };
    }
    if (a === b) {
      return { matched: true, score: 1 };
    }
    const score = jaccardSimilarity(a, b);
    return { matched: score >= this.threshold, score };
  }
}

/**
 * Placeholder for future OCR-based matching.
 * Extract printed name from Aadhaar/PAN image/PDF, then delegate to SelfDeclaredMatcher.
 */
export class OcrMatcher implements IdentityNameMatcher {
  match(_declaredName: string, _registeredName: string): NameMatchResult {
    throw new Error('OcrMatcher is not implemented yet');
  }
}

export const defaultNameMatcher: IdentityNameMatcher = new SelfDeclaredMatcher();
