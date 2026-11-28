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
    // A stated default maximum applies until the student edits the field.
    const max = toNumber(raw.max !== undefined ? raw.max : c.max);

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

// Subject-grade conditions from the IB's DP passing criteria (last updated
// 19 February 2026). entries: six { grade: 1..7 | null, level: 'SL' | 'HL' }.
// CAS, TOK and EE conditions are not checked here. Returns null until all six
// grades are known.
export function diplomaChecks(entries, core) {
  if (entries.length !== 6 || entries.some((e) => e.grade == null)) return null;

  const grades = entries.map((e) => e.grade);
  const total = grades.reduce((a, b) => a + b, 0) + (core || 0);
  const hl = entries.filter((e) => e.level === 'HL').map((e) => e.grade).sort((a, b) => b - a);
  const sl = entries.filter((e) => e.level !== 'HL').map((e) => e.grade);
  const hlPoints = hl.slice(0, 3).reduce((a, b) => a + b, 0);
  const slPoints = sl.reduce((a, b) => a + b, 0);
  // Four HL subjects leave two SL subjects, which need at least 5 points.
  const slNeeded = hl.length === 4 ? 5 : 9;

  return [
    { key: 'min', label: `총점 ${DIPLOMA_MIN_POINTS}점 이상`, ok: total >= DIPLOMA_MIN_POINTS },
    { key: 'min2', label: '모든 과목 2점 이상', ok: grades.every((g) => g >= 2) },
    { key: 'max2s', label: '2점 과목이 2개 이하', ok: grades.filter((g) => g === 2).length <= 2 },
    { key: 'max3s', label: '3점 이하 과목이 3개 이하', ok: grades.filter((g) => g <= 3).length <= 3 },
    { key: 'hl', label: `HL 과목 12점 이상 (4과목이면 높은 3과목, 현재 ${hlPoints}점)`, ok: hlPoints >= 12 },
    { key: 'sl', label: `SL 과목 ${slNeeded}점 이상 (현재 ${slPoints}점)`, ok: slPoints >= slNeeded },
  ];
}
