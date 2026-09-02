import {
  jaccardSimilarity,
  matchNameInDocumentText,
  normalizeName,
  SelfDeclaredMatcher,
} from './name-matcher';

describe('normalizeName', () => {
  it('strips titles and punctuation', () => {
    expect(normalizeName('Mr. Ramesh Kumar')).toBe('ramesh kumar');
  });
});

describe('SelfDeclaredMatcher', () => {
  const matcher = new SelfDeclaredMatcher();

  it('matches identical names', () => {
    expect(matcher.match('Ramesh Kumar', 'Ramesh Kumar').matched).toBe(true);
  });

  it('rejects unrelated names', () => {
    expect(matcher.match('Ramesh Kumar', 'Sita Devi').matched).toBe(false);
  });
});

describe('matchNameInDocumentText', () => {
  const aadhaarLike = `
    Unique Identification Authority of India
    Name: RAMESH KUMAR
    DOB: 01/01/1990
    Gender: Male
  `;

  it('matches declared name against labelled OCR text', () => {
    const result = matchNameInDocumentText('Ramesh Kumar', aadhaarLike);
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.72);
  });

  it('matches when name appears in OCR without label', () => {
    const text = 'GOVERNMENT OF INDIA\nRAMESH KUMAR\nABCD1234E';
    expect(matchNameInDocumentText('Ramesh Kumar', text).matched).toBe(true);
  });

  it('rejects when document has a different name', () => {
    const result = matchNameInDocumentText('Ramesh Kumar', aadhaarLike.replace('RAMESH KUMAR', 'SITA DEVI'));
    expect(result.matched).toBe(false);
  });

  it('tolerates minor OCR typos via token coverage', () => {
    const text = 'Name: RAMESH KUMAR SHARMA\nPermanent Account Number';
    expect(matchNameInDocumentText('Ramesh Kumar', text).matched).toBe(true);
  });
});

describe('jaccardSimilarity', () => {
  it('is 1 for same token sets', () => {
    expect(jaccardSimilarity('a b', 'b a')).toBe(1);
  });
});
