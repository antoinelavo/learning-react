// IB subject components and weightings for /tools/ib-calculator.
//
// Only add a subject-level after reading its weightings in the official IB
// subject brief or subject guide, and record the source. Weightings below
// come from the IB subject-brief PDFs named in each entry's `sources`.
//
// Subject shape:
//   key, name, group
//   edition        short Korean note on which exams the curriculum applies to
//   sources        [{ label, url }] official documents
//   lastVerified   'YYYY-MM-DD'
//   levels         { SL: [components], HL: [components] }, or null when the
//                  weightings are not confirmed yet (shown as 준비 중)
//   component      { key, label, weight, max? }
//                  weight = % of the final subject grade
//                  max    = maximum mark, only where the brief states it
//                           (the student can edit it; otherwise they type it)

const IB = 'https://www.ibo.org/globalassets/new-structure/programmes/dp/pdfs';

// Components shared by several subjects (same weightings in their briefs).
const SCIENCE = [
  { key: 'p1', label: 'Paper 1', weight: 36 },
  { key: 'p2', label: 'Paper 2', weight: 44 },
  { key: 'ia', label: 'Scientific investigation (IA)', weight: 20 },
];
const MATH_SL = [
  { key: 'p1', label: 'Paper 1', weight: 40 },
  { key: 'p2', label: 'Paper 2', weight: 40 },
  { key: 'ia', label: 'Exploration (IA)', weight: 20 },
];
const MATH_HL = [
  { key: 'p1', label: 'Paper 1', weight: 30 },
  { key: 'p2', label: 'Paper 2', weight: 30 },
  { key: 'p3', label: 'Paper 3', weight: 20 },
  { key: 'ia', label: 'Exploration (IA)', weight: 20 },
];
const LANG_A_SL = [
  { key: 'p1', label: 'Paper 1', weight: 35 },
  { key: 'p2', label: 'Paper 2', weight: 35 },
  { key: 'ia', label: 'Individual oral (IA)', weight: 30 },
];
const LANG_A_HL = [
  { key: 'p1', label: 'Paper 1', weight: 35 },
  { key: 'p2', label: 'Paper 2', weight: 25 },
  { key: 'hl', label: 'HL essay', weight: 20 },
  { key: 'ia', label: 'Individual oral (IA)', weight: 20 },
];
const LANG_B_2020 = [
  { key: 'p1', label: 'Paper 1 (writing)', weight: 25, max: 30 },
  { key: 'p2l', label: 'Paper 2 (listening)', weight: 25, max: 25 },
  { key: 'p2r', label: 'Paper 2 (reading)', weight: 25, max: 40 },
  { key: 'ia', label: 'Individual oral (IA)', weight: 25, max: 30 },
];

export const IB_SUBJECTS = [
  {
    key: 'physics',
    name: 'Physics (물리)',
    group: 4,
    edition: '2025년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Physics subject brief', url: 'https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_physics_subject-brief_jan_2022_e.pdf' },
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
  {
    key: 'math-aa',
    name: 'Mathematics: Analysis and Approaches',
    group: 5,
    edition: '2021년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Math AA subject brief', url: 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf' },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 40 },
        { key: 'p2', label: 'Paper 2', weight: 40 },
        { key: 'ia', label: 'Exploration (IA)', weight: 20 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 30 },
        { key: 'p2', label: 'Paper 2', weight: 30 },
        { key: 'p3', label: 'Paper 3', weight: 20 },
        { key: 'ia', label: 'Exploration (IA)', weight: 20 },
      ],
    },
  },
  {
    key: 'economics',
    name: 'Economics (경제)',
    group: 3,
    edition: '2022년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Economics SL brief', url: `${IB}/sl-economics-en.pdf` },
      { label: 'Economics HL brief', url: `${IB}/hl-economics-en.pdf` },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 30 },
        { key: 'p2', label: 'Paper 2', weight: 40 },
        { key: 'ia', label: 'Portfolio (IA)', weight: 30 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 20 },
        { key: 'p2', label: 'Paper 2', weight: 30 },
        { key: 'p3', label: 'Paper 3', weight: 30 },
        { key: 'ia', label: 'Portfolio (IA)', weight: 20 },
      ],
    },
  },
  {
    key: 'business',
    name: 'Business Management (경영)',
    group: 3,
    edition: '2024년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Business Management SL brief', url: `${IB}/business-management-sl-subject-brief-en.pdf` },
      { label: 'Business Management HL brief', url: `${IB}/business-management-hl-subject-brief-en.pdf` },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 35 },
        { key: 'p2', label: 'Paper 2', weight: 35 },
        { key: 'ia', label: 'Business research project (IA)', weight: 30 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 25 },
        { key: 'p2', label: 'Paper 2', weight: 30 },
        { key: 'p3', label: 'Paper 3', weight: 25 },
        { key: 'ia', label: 'Business research project (IA)', weight: 20 },
      ],
    },
  },
  {
    key: 'psychology',
    name: 'Psychology (심리)',
    group: 3,
    edition: '2027년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Psychology subject brief', url: 'https://ibo.org/globalassets/new-structure/programmes/dp/pdfs/dp_psychology_subjectbrief_en.pdf' },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 35, max: 35 },
        { key: 'p2', label: 'Paper 2', weight: 35, max: 35 },
        { key: 'ia', label: 'Research proposal (IA)', weight: 30, max: 24 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 25, max: 35 },
        { key: 'p2', label: 'Paper 2', weight: 25, max: 35 },
        { key: 'p3', label: 'Paper 3', weight: 30, max: 30 },
        { key: 'ia', label: 'Research proposal (IA)', weight: 20, max: 24 },
      ],
    },
  },
  {
    key: 'history-2028',
    name: 'History (역사)',
    group: 3,
    edition: '2028년 시험부터 (새 교육과정)',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'History subject brief (first assessment 2028)', url: `${IB}/dp-history-sb-en.pdf` },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1', weight: 30, max: 24 },
        { key: 'p2', label: 'Paper 2', weight: 40, max: 25 },
        { key: 'ia', label: 'Historical investigation (IA)', weight: 30, max: 24 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1', weight: 20, max: 24 },
        { key: 'p2', label: 'Paper 2', weight: 25, max: 25 },
        { key: 'p3', label: 'Paper 3', weight: 35, max: 30 },
        { key: 'ia', label: 'Historical investigation (IA)', weight: 20, max: 24 },
      ],
    },
  },
  {
    key: 'english-b-2029',
    name: 'English B',
    group: 2,
    edition: '2029년 시험부터 (새 교육과정)',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Language B subject brief (first assessment 2029)', url: `${IB}/sb_lang_b_en.pdf` },
    ],
    levels: {
      SL: [
        { key: 'p1', label: 'Paper 1 (writing)', weight: 25 },
        { key: 'p2l', label: 'Paper 2 (listening)', weight: 25 },
        { key: 'p2r', label: 'Paper 2 (reading)', weight: 25 },
        { key: 'ia', label: 'Individual oral (IA)', weight: 25 },
      ],
      HL: [
        { key: 'p1', label: 'Paper 1 (writing)', weight: 25 },
        { key: 'p2l', label: 'Paper 2 (listening)', weight: 25 },
        { key: 'p2r', label: 'Paper 2 (reading)', weight: 25 },
        { key: 'ia', label: 'Individual oral (IA)', weight: 25 },
      ],
    },
  },
  {
    key: 'english-b',
    name: 'English B',
    group: 2,
    edition: '2020년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Language B subject brief (first assessment 2020)', url: 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/lang-b-2018-en.pdf' },
    ],
    levels: { SL: LANG_B_2020, HL: LANG_B_2020 },
  },
  {
    key: 'chemistry',
    name: 'Chemistry (화학)',
    group: 4,
    edition: '2025년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Chemistry subject brief', url: 'https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_chemistry_subject-brief_jan_2022_e.pdf' },
    ],
    levels: { SL: SCIENCE, HL: SCIENCE },
  },
  {
    key: 'biology',
    name: 'Biology (생물)',
    group: 4,
    edition: '2025년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Biology subject brief', url: 'https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_biology_subject-brief_jan_2022_e.pdf' },
    ],
    levels: { SL: SCIENCE, HL: SCIENCE },
  },
  {
    key: 'math-ai',
    name: 'Mathematics: Applications and Interpretation',
    group: 5,
    edition: '2021년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Math AI subject brief', url: 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-applications-and-interpretations-en.pdf' },
    ],
    levels: { SL: MATH_SL, HL: MATH_HL },
  },
  {
    key: 'english-a-lang-lit',
    name: 'English A: Language and Literature',
    group: 1,
    edition: '2021년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Language A: language and literature brief', url: 'https://ibo.org/contentassets/5895a05412144fe890312bad52b17044/curriculum.brief-languagea.language.and.literature-eng.pdf' },
    ],
    levels: { SL: LANG_A_SL, HL: LANG_A_HL },
  },
  {
    key: 'english-a-lit',
    name: 'English A: Literature',
    group: 1,
    edition: '2021년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Language A: literature brief', url: 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/curriculum.brief-languagea.literature-eng.pdf' },
    ],
    levels: { SL: LANG_A_SL, HL: LANG_A_HL },
  },
  {
    key: 'korean-a',
    name: 'Korean A: Literature',
    group: 1,
    edition: '2021년 시험부터',
    lastVerified: '2026-11-28',
    sources: [
      { label: 'Language A: literature brief', url: 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/curriculum.brief-languagea.literature-eng.pdf' },
    ],
    levels: { SL: LANG_A_SL, HL: LANG_A_HL },
  },
];

export const SUBJECTS_BY_KEY = Object.fromEntries(IB_SUBJECTS.map((s) => [s.key, s]));

// Where to read the official diploma award conditions and the TOK/EE matrix.
export const DP_PASSING_CRITERIA_URL =
  'https://www.ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/';
