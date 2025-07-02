const satHagwons = [
  // {
  //   name: '세이지프렙 (SagePrep)',
  //   region: '서울 신사',
  //   lessonType: ['그룹'],
  //   format: ['대면'],
  //   services: ['IB', 'AP'],
  //   url: "https://m.blog.naver.com/sageprep?tab=1",
  // },
  {
    name: '샤인프렙 (ShinePrep)',
    region: '온라인',
    lessonType: ['그룹', '1:1'],
    format: ['온라인'],
    services: ['IB', 'AP', '컨설팅'],
    url: "https://www.shineprep.org/",
    
  },
  {
    name: '파레토프렙 (Pareto Prep)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['IB'],
    url: "https://blog.naver.com/paretoprep",

  },
  {
    name: '인터프렙 (Interprep)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['TOEFL'],
    url: "https://interprep.co.kr/",
  },
  {
    name: '해커스 (HACKERS)',
    region: '서울 서초',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['AP', '컨설팅'],
    url: "https://sat.hackers.ac/",
  },
  {
    name: '아크메 어학원 (ACMÉacademy)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['온라인'],
    services: ['AP'],
    url: "https://www.acmeacademy.co.kr/",

  },
  {
    name: '트리플 어학원 (tripleacademy)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: [],
    url: "https://tripleprep.modoo.at/",

  },
  {
    name: '폴아카데미 (PaulAcademy)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['AP', '컨설팅'],
    url: "https://paulacademy.net/sat_class",

  },
  {
    name: 'STARPREP (스타프랩)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['AP'],
    url: "https://www.starprep.com/",

  },
  {
    name: '디아이 (The I Prep)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['컨설팅'],
    url: "https://www.theiprep.com/theicollege/main_college.php",

  },
  {
    name: 'AblePrep (에이블프렙)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['AP'],
    url: "https://www.ableprepedu.com/",

  },
  {
    name: 'CLOUD EDU (클라우드에듀)',
    region: '성남 분당',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['IB', 'TOEFL'],
    url: "https://pf.kakao.com/_lwgxoV",

  },
  {
    name: 'brix academy (브릭스아카데미)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['ACT', '컨설팅'],
    url: "https://www.brixacademy.co.kr/",

  },
  {
    name: 'LanguageWill (랭귀지윌)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['컨설팅'],
    url: "https://www.languagewill.co.kr/",

  },
  {
    name: 'Campbell Academy (강남캠벨아카데미)',
    region: '서울 서초',
    lessonType: ['그룹', '1:1'],
    format: ['대면', '온라인'],
    services: ['ACT', 'AP', 'IB', 'GCSE', 'TOEFL'],
    url: "https://www.campbellsec.com/SETF/main.asp?",

  },
  {
    name: 'GatePrep (GATE 어학원)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['ACT', 'AP', 'TOEFL'],
    url: "https://www.gatepreps.com/",

  },
  {
    name: 'PSU EDU (PSU 에듀센터)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['컨설팅'],
    url: "https://psuedu.org/index",

  },
  {
    name: 'Elite Prep (엘리트에듀)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['AP', 'IB', '컨설팅'],
    url: "https://eliteprep.co.kr/",

  },
  {
    name: 'EDU MOST (에듀모스트)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면', '온라인'],
    services: ['IB', '컨설팅'],
    url: "http://www.edumost.co.kr/index.htm",

  },
  {
    name: 'Scholar (스칼라어학원)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['AP'],
    url: "https://blog.naver.com/scholar5430",

  },
  {
    name: 'Nobel Prep (노벨 프렙)',
    region: '서울 강남',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['AP', 'IB'],
    url: "https://blog.naver.com/ssprep0821",

  },
  {
    name: 'Veterans Edu (베테랑스 에듀)',
    region: '서울 강남',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['AP', 'TOEFL'],
    url: "https://veteransedu.net/",

  },
  {
    name: 'Brompton (브롬튼)',
    region: '서울 강남, 제주 서귀포시',
    lessonType: ['그룹', '1:1'],
    format: [],
    services: ['AP', 'IB', 'TOEFL', '컨설팅'],
    url: "https://www.bromptoneducation.com/",

  },
  {
    name: 'SSLI (SSLI)',
    region: '성남 분당',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['컨설팅'],
    url: "https://ssli.education/",

  },
  {
    name: 'Topcle (탑클어학원)',
    region: '성남 분당',
    lessonType: ['그룹'],
    format: ['대면'],
    services: ['컨설팅'],
    url: "https://topcle.co.kr/",

  },
  {
    name: 'PRIMA (프리마 어학원)',
    region: '성남 분당',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['AP', 'ACT', 'IB', 'TOEFL', '컨설팅'],
    url: "https://blog.naver.com/jprima2016",

  },
  {
    name: 'MasterPrep (인강)',
    region: '온라인',
    lessonType: ['인강'],
    format: ['온라인'],
    services: [],
  },
  {
    name: 'HonorsAcademy (아너즈어학원)',
    region: '부산 해운대',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['TOEFL'],
    url: "https://honorsacademy.co.kr/",

  },
  {
    name: 'AnnArborAcademy (앤아버 어학원)',
    region: '부산 부산진구',
    lessonType: ['그룹', '1:1'],
    format: ['대면'],
    services: ['AP', 'ACT', 'IB', 'TOEFL', '컨설팅'],
    url: "http://www.annarboracademy.co.kr/",
  },
];

export default satHagwons;