// lib/teacherDuplicates.js
// Duplicate detection for teacher profiles (people who sign up more than
// once to get extra free reveals). Plain functions over plain arrays, with
// no Supabase or Node-only imports, so the admin page (browser) and the
// auto-approve API route (server) share the same rules.
//
// A profile is a possible duplicate of another when ANY of these hold:
//   - contact: same contact info (ignoring case, spaces and punctuation)
//   - intro:   same or very similar long introduction
//   - name:    very similar name AND the same school
// A similar name on its own never counts.

// Statuses a profile can be compared against. Removed, taken down and
// deleted profiles are intentionally not matched.
export const COMPARABLE_STATUSES = ['pending', 'approved', 'rejected'];

const MIN_INTRO_LENGTH = 30; // shorter intros are too generic to compare
const INTRO_SIMILARITY = 0.9;

// HTML (the long intro is Quill output) to plain text with single spaces.
export function plainText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lowercase and keep only letters and digits (Hangul included).
function squash(value) {
  return String(value ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function normalizeContact(value) {
  return squash(value);
}

export function normalizeName(value) {
  return squash(value);
}

export function normalizeSchool(value) {
  return squash(value);
}

export function normalizeIntro(value) {
  return squash(plainText(value));
}

function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

// "Very similar": the same once spaces and punctuation are removed, or at
// most 1 edit apart for names up to 4 characters, 2 edits for longer ones.
export function namesSimilar(a, b) {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const limit = Math.max(x.length, y.length) <= 4 ? 1 : 2;
  return editDistance(x, y) <= limit;
}

// Dice coefficient over character bigrams: linear time, so long intros are
// cheap to compare. Returns 0..1.
function bigramSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const counts = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const g = a.slice(i, i + 2);
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  let overlap = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const g = b.slice(i, i + 2);
    const n = counts.get(g);
    if (n) {
      overlap++;
      counts.set(g, n - 1);
    }
  }
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

export function introsSimilar(a, b) {
  const x = normalizeIntro(a);
  const y = normalizeIntro(b);
  if (x.length < MIN_INTRO_LENGTH || y.length < MIN_INTRO_LENGTH) return false;
  if (x === y) return true;
  // Very different lengths cannot reach the similarity threshold.
  if (Math.min(x.length, y.length) / Math.max(x.length, y.length) < INTRO_SIMILARITY) return false;
  return bigramSimilarity(x, y) >= INTRO_SIMILARITY;
}

// Which signals ('contact' | 'intro' | 'name_school') link two profiles.
export function matchSignals(a, b) {
  const signals = [];

  const contactA = normalizeContact(a.contact_information);
  if (contactA && contactA === normalizeContact(b.contact_information)) {
    signals.push('contact');
  }

  if (introsSimilar(a.longintroduction, b.longintroduction)) {
    signals.push('intro');
  }

  const schoolA = normalizeSchool(a.school);
  if (schoolA && schoolA === normalizeSchool(b.school) && namesSimilar(a.name, b.name)) {
    signals.push('name_school');
  }

  return signals;
}

// Profiles in `others` that look like duplicates of `teacher`. Skips the
// teacher itself, test teachers, and statuses outside COMPARABLE_STATUSES.
// Returns [{ id, name, status, signals }].
export function findDuplicates(teacher, others) {
  const matches = [];
  for (const other of others) {
    if (other.id === teacher.id) continue;
    if (other.is_test) continue;
    if (!COMPARABLE_STATUSES.includes(other.status)) continue;
    const signals = matchSignals(teacher, other);
    if (signals.length > 0) {
      matches.push({ id: other.id, name: other.name, status: other.status, signals });
    }
  }
  return matches;
}

// Korean labels for the admin card.
export const SIGNAL_LABELS = {
  contact: '연락처 동일',
  intro: '소개글 유사',
  name_school: '이름·학교 유사',
};
