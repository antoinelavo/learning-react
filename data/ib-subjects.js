// IB subject components and weightings for /tools/ib-calculator.
//
// Only add a subject-level after reading its weightings in the official IB
// subject brief or subject guide, and record the source. The IB does not
// publish a maximum mark you can rely on per session here, so the student
// enters each component's maximum mark from their own paper or markscheme.
//
// Subject shape:
//   key, name, group
//   sources: [{ label, url }]            official documents
//   lastVerified: 'YYYY-MM-DD'
//   levels: { SL: [components], HL: [components] }
//   component: { key, label, weight }    weight = % of the final subject grade
//
// Subjects listed with `levels: null` are shown as 준비 중 until their
// weightings are confirmed from official documents.

export const IB_SUBJECTS = [
  {
    key: 'physics',
    name: 'Physics (물리)',
    group: 4,
    lastVerified: '2026-11-28',
    sources: [
      { label: 'IB Physics guide (first assessment 2025)', url: 'https://ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides/physics-guide.pdf' },
      { label: 'IB Physics subject brief', url: 'https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_physics_subject-brief_jan_2022_e.pdf' },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 36 },
        { key: 'p2', label: 'Paper 2', weight: 44 },
        { key: 'ia', label: 'Internal assessment (IA)', weight: 20 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 36 },
        { key: 'p2', label: 'Paper 2', weight: 44 },
        { key: 'ia', label: 'Internal assessment (IA)', weight: 20 },
      ],
    },
  },
  { key: 'chemistry', name: 'Chemistry (화학)', group: 4, levels: null },
  { key: 'biology', name: 'Biology (생물)', group: 4, levels: null },
  { key: 'math-aa', name: 'Mathematics: Analysis and Approaches', group: 5, levels: null },
  { key: 'math-ai', name: 'Mathematics: Applications and Interpretation', group: 5, levels: null },
  { key: 'english-a-lang-lit', name: 'English A: Language and Literature', group: 1, levels: null },
  { key: 'english-a-lit', name: 'English A: Literature', group: 1, levels: null },
  { key: 'english-b', name: 'English B', group: 2, levels: null },
  { key: 'korean-a', name: 'Korean A: Literature', group: 1, levels: null },
  { key: 'economics', name: 'Economics (경제)', group: 3, levels: null },
  { key: 'business', name: 'Business Management (경영)', group: 3, levels: null },
  { key: 'psychology', name: 'Psychology (심리)', group: 3, levels: null },
  { key: 'history', name: 'History (역사)', group: 3, levels: null },
];

export const SUBJECTS_BY_KEY = Object.fromEntries(IB_SUBJECTS.map((s) => [s.key, s]));

// Where to read the official diploma award conditions and the TOK/EE matrix.
export const DP_PASSING_CRITERIA_URL =
  'https://www.ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/';
