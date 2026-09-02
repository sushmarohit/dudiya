/**
 * Identity name matching: account consistency + OCR document text.
 */

const TITLE_RE =
  /^(mr|mrs|ms|miss|shri|smt|dr|prof|sir|madam)\.?$/i;

const NAME_LABEL_RE =
  /(?:^|\n)\s*(?:name|naam|full\s*name|holder'?s?\s*name|card\s*holder)\s*[:\-]?\s*([^\n]+)/gi;

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

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let left = i;
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const nextDiag = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, left + 1, diag + cost);
      left = prev[j];
      diag = nextDiag;
    }
  }
  return prev[b.length];
}

/** True if needle appears in haystack tokens with light OCR tolerance. */
function tokenAppearsIn(needle: string, haystackTokens: string[]): boolean {
  if (haystackTokens.includes(needle)) return true;
  const maxDist = needle.length >= 6 ? 2 : needle.length >= 4 ? 1 : 0;
  if (maxDist === 0) return false;
  return haystackTokens.some(
    (t) => Math.abs(t.length - needle.length) <= maxDist && levenshtein(t, needle) <= maxDist,
  );
}

export interface NameMatchResult {
  matched: boolean;
  score: number;
  /** Best OCR line / labelled name when matching against document text */
  extractedCandidate?: string;
}

export interface IdentityNameMatcher {
  match(declaredName: string, registeredName: string): NameMatchResult;
}

/** Compare typed document name to registered account name. */
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
 * Match a provided name against OCR / extracted document text.
 * Prefers labelled "Name:" lines, then full-text token coverage, then best line Jaccard.
 */
export function matchNameInDocumentText(
  providedName: string,
  documentText: string,
  threshold = 0.72,
): NameMatchResult {
  const nameNorm = normalizeName(providedName);
  const corpus = normalizeName(documentText);
  if (!nameNorm || corpus.length < 3) {
    return { matched: false, score: 0 };
  }

  if (corpus.includes(nameNorm)) {
    return { matched: true, score: 1, extractedCandidate: nameNorm };
  }

  // Labelled name fields on ID cards
  let labelledBest: NameMatchResult = { matched: false, score: 0 };
  for (const match of documentText.matchAll(NAME_LABEL_RE)) {
    const candidate = normalizeName(match[1] ?? '');
    if (!candidate) continue;
    if (candidate.includes(nameNorm) || nameNorm.includes(candidate)) {
      const score = Math.max(
        jaccardSimilarity(nameNorm, candidate),
        candidate.includes(nameNorm) || nameNorm.includes(candidate) ? 0.95 : 0,
      );
      if (score > labelledBest.score) {
        labelledBest = {
          matched: score >= threshold,
          score,
          extractedCandidate: candidate,
        };
      }
    } else {
      const score = jaccardSimilarity(nameNorm, candidate);
      if (score > labelledBest.score) {
        labelledBest = {
          matched: score >= threshold,
          score,
          extractedCandidate: candidate,
        };
      }
    }
  }
  if (labelledBest.matched) {
    return labelledBest;
  }

  // Token coverage across full OCR corpus (OCR often splits lines oddly)
  const nameTokens = nameNorm.split(' ').filter((t) => t.length >= 2);
  const corpusTokens = corpus.split(' ').filter(Boolean);
  if (nameTokens.length > 0) {
    const hits = nameTokens.filter((t) => tokenAppearsIn(t, corpusTokens));
    const coverage = hits.length / nameTokens.length;
    if (coverage >= 0.85 && hits.length >= Math.min(2, nameTokens.length)) {
      return {
        matched: true,
        score: coverage,
        extractedCandidate: hits.join(' '),
      };
    }
  }

  // Best line Jaccard
  const lines = documentText
    .split(/\r?\n/)
    .map((line) => normalizeName(line))
    .filter((line) => line.length >= 3);

  let bestScore = labelledBest.score;
  let bestLine = labelledBest.extractedCandidate ?? '';
  for (const line of lines) {
    const score = jaccardSimilarity(nameNorm, line);
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }

  return {
    matched: bestScore >= threshold,
    score: bestScore,
    extractedCandidate: bestLine || undefined,
  };
}

export class OcrDocumentMatcher {
  constructor(
    private readonly accountThreshold = 0.85,
    private readonly ocrThreshold = 0.72,
  ) {}

  matchAccount(declaredName: string, registeredName: string): NameMatchResult {
    return new SelfDeclaredMatcher(this.accountThreshold).match(
      declaredName,
      registeredName,
    );
  }

  matchDocument(providedName: string, ocrText: string): NameMatchResult {
    return matchNameInDocumentText(providedName, ocrText, this.ocrThreshold);
  }
}

export const defaultNameMatcher: IdentityNameMatcher = new SelfDeclaredMatcher();
export const documentNameMatcher = new OcrDocumentMatcher();
