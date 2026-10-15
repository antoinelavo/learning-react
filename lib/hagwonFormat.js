// Fee formatting shared by server components and the client fee table.
// No data imports, so it's safe to use from client code.

// 110000 -> "11만", 27000 -> "2.7만", 5274360 -> "527만"
export function formatManwon(won) {
  const man = won / 10000;
  if (man >= 10) return `${Math.round(man).toLocaleString('ko-KR')}만`;
  return `${Math.round(man * 10) / 10}만`;
}

export const formatWon = won => `${won.toLocaleString('ko-KR')}원`;

// "0개월5일" -> "5일", "1개월0일" -> "1개월", "2개월15일" -> "2개월 15일"
export function formatPeriod(period) {
  const m = period?.match(/^(\d+)개월(\d+)일$/);
  if (!m) return period || '-';
  const [months, days] = [Number(m[1]), Number(m[2])];
  return [months && `${months}개월`, days && `${days}일`].filter(Boolean).join(' ') || '-';
}
