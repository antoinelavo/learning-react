// Pure helpers for the IB grade calculator (no React, no browser APIs).

// Rough starting points only. The IB sets real grade boundaries after each
// session and does not publish them, so the UI labels these as estimates and
// lets the student edit them. Each value is the lowest percentage for a grade.
export const DEFAULT_BANDS = { 7: 75, 6: 65, 5: 55, 4: 45, 3: 35, 2: 20, 1: 0 };

export const DIPLOMA_MIN_POINTS = 24;
export const DIPLOMA_MAX_POINTS = 45;

function toNumber(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// inputs: { [componentKey]: { score, max } } (strings from the form).
// Returns { percent, complete, errors }. `percent` is null until every
// component has a valid score and maximum.
export function computeSubjectPercent(components, inputs) {
  const errors = {};
  let total = 0;
  let complete = true;

  for (const c of components) {
    const raw = inputs?.[c.key] || {};
    const score = toNumber(raw.score);
    const max = toNumber(raw.max);

    if (score == null || max == null) {
      complete = false;
      continue;
    }
    if (max <= 0) {
      errors[c.key] = '만점은 0보다 커야 합니다.';
      complete = false;
      continue;
    }
    if (score < 0 || score > max) {
      errors[c.key] = `점수는 0 이상 ${max} 이하여야 합니다.`;
      complete = false;
      continue;
    }
    total += c.weight * (score / max);
  }

  const hasErrors = Object.keys(errors).length > 0;
  return { percent: complete && !hasErrors ? total : null, complete, errors };
}

export function gradeFromPercent(percent, bands = DEFAULT_BANDS) {
  if (percent == null) return null;
  for (let g = 7; g >= 2; g -= 1) {
    if (percent >= Number(bands[g])) return g;
  }
  return 1;
}

// Bands must go up with the grade (7 highest). Returns an error text or null.
export function validateBands(bands) {
  for (let g = 2; g <= 7; g += 1) {
    if (String(bands[g] ?? '').trim() === '') return '구간은 0~100 사이 숫자여야 합니다.';
    const v = Number(bands[g]);
    if (!Number.isFinite(v) || v < 0 || v > 100) return '구간은 0~100 사이 숫자여야 합니다.';
    if (g > 2 && v <= Number(bands[g - 1])) return '높은 등급의 기준 점수가 더 커야 합니다.';
  }
  return null;
}

// grades: six numbers 1..7 (null when not known yet); core: 0..3.
export function diplomaTotal(grades, core) {
  const known = grades.filter((g) => g != null);
  const subjectPoints = known.reduce((a, b) => a + b, 0);
  const complete = known.length === 6;
  const total = subjectPoints + (core || 0);
  return {
    total,
    complete,
    meetsMinimum: complete ? total >= DIPLOMA_MIN_POINTS : null,
  };
}
