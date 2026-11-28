// Exam and admission dates shown on /tools/calendar and the student dashboard.
//
// Every entry needs a `sourceUrl` (official source) and `lastVerified`
// (YYYY-MM-DD). Only add a date that was read from the official source;
// leave it out when it cannot be confirmed.
//
// Fields:
//   id        stable id (also stored in the browser as the D-day target)
//   category  'SAT' | 'ADMISSION' | 'IB'
//   title     Korean title
//   start/end YYYY-MM-DD (end is optional, inclusive)
//   note      optional Korean note
//   target    true when the student can pick it as the D-day target

export const EVENT_CATEGORIES = [
  { value: 'IB', label: 'IB' },
  { value: 'SAT', label: 'SAT' },
  { value: 'ADMISSION', label: '입시' },
];

const COLLEGE_BOARD = 'https://satsuite.collegeboard.org/sat/dates-deadlines';
const KCUE_2027 =
  'https://www.kcue.or.kr/_upload/news/2025/04/30/application_25d9ccd90388d6ba316a2c7d398ff944.pdf';
const KCUE_2028 =
  'https://www.kcue.or.kr/_upload/news/2026/04/30/application_ea0382f8ef4d92cda46a7e015aec3fef.pdf';

const SAT_REG_NOTE = '마감은 미국 동부 시간 밤 11시 59분 기준이라 한국 시간으로는 다음 날 낮입니다.';

export const EXAM_EVENTS = [
  // --- IB ---------------------------------------------------------------
  // Intentionally empty until the dates can be confirmed from the IB's own
  // published schedules (see the build notes in SPEC.md).

  // --- SAT (College Board) ---------------------------------------------
  {
    id: 'sat-2027-02-reg',
    category: 'SAT',
    title: 'SAT 3월 시험 등록 마감',
    start: '2027-02-19',
    note: SAT_REG_NOTE,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },
  {
    id: 'sat-2027-03-06',
    category: 'SAT',
    title: 'SAT 3월 시험',
    start: '2027-03-06',
    target: true,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },
  {
    id: 'sat-2027-04-reg',
    category: 'SAT',
    title: 'SAT 5월 시험 등록 마감',
    start: '2027-04-16',
    note: SAT_REG_NOTE,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },
  {
    id: 'sat-2027-05-01',
    category: 'SAT',
    title: 'SAT 5월 시험',
    start: '2027-05-01',
    target: true,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },
  {
    id: 'sat-2027-05-reg',
    category: 'SAT',
    title: 'SAT 6월 시험 등록 마감',
    start: '2027-05-21',
    note: SAT_REG_NOTE,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },
  {
    id: 'sat-2027-06-05',
    category: 'SAT',
    title: 'SAT 6월 시험',
    start: '2027-06-05',
    target: true,
    sourceUrl: COLLEGE_BOARD,
    lastVerified: '2026-11-28',
  },

  // --- 입시 (대교협 대학입학전형시행계획 주요사항) -----------------------
  {
    id: 'adm-2027-jeongsi-apply',
    category: 'ADMISSION',
    title: '2027학년도 정시모집 원서접수',
    start: '2027-01-04',
    end: '2027-01-07',
    note: '이 기간 중 대학별로 3일 이상 접수합니다.',
    target: true,
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2027-jeongsi-ga',
    category: 'ADMISSION',
    title: '2027학년도 정시 가군 전형',
    start: '2027-01-11',
    end: '2027-01-17',
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2027-jeongsi-na',
    category: 'ADMISSION',
    title: '2027학년도 정시 나군 전형',
    start: '2027-01-18',
    end: '2027-01-24',
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2027-jeongsi-da',
    category: 'ADMISSION',
    title: '2027학년도 정시 다군 전형',
    start: '2027-01-25',
    end: '2027-01-31',
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2027-jeongsi-result',
    category: 'ADMISSION',
    title: '2027학년도 정시 합격자 발표 마감',
    start: '2027-02-05',
    note: '이 날짜까지 합격자를 발표합니다.',
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2027-jeongsi-register',
    category: 'ADMISSION',
    title: '2027학년도 정시 합격자 등록',
    start: '2027-02-10',
    end: '2027-02-12',
    sourceUrl: KCUE_2027,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2028-susi-apply',
    category: 'ADMISSION',
    title: '2028학년도 수시모집 원서접수',
    start: '2027-09-20',
    end: '2027-09-23',
    note: '이 기간 중 대학별로 3일 이상 접수합니다.',
    target: true,
    sourceUrl: KCUE_2028,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2028-susi-result',
    category: 'ADMISSION',
    title: '2028학년도 수시 합격자 발표 마감',
    start: '2027-12-21',
    note: '이 날짜까지 합격자를 발표합니다.',
    sourceUrl: KCUE_2028,
    lastVerified: '2026-11-28',
  },
  {
    id: 'adm-2028-jeongsi-apply',
    category: 'ADMISSION',
    title: '2028학년도 정시모집 원서접수',
    start: '2028-01-03',
    end: '2028-01-06',
    note: '이 기간 중 대학별로 3일 이상 접수합니다.',
    target: true,
    sourceUrl: KCUE_2028,
    lastVerified: '2026-11-28',
  },
];
