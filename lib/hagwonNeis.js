// Registered hagwon fees and info from NEIS, read from the snapshot built by
// scripts/update-hagwon-neis.mjs. Server-side only: import from server components.
import neisData from '@/data/hagwon-neis.json';

export const neisUpdatedAt = neisData.updatedAt;

// Returns the NEIS entry for a hagwon's `neis` field, or null when there is no fee data.
export function getNeisEntry(neis) {
  const entry = neis?.id ? neisData.hagwons[neis.id] : null;
  if (!entry || !entry.courses?.some(c => c.total != null)) return null;
  return entry;
}

const courseTotals = entry => entry.courses.map(c => c.total).filter(t => t != null);

export function feeRange(entry) {
  const totals = courseTotals(entry);
  return { min: Math.min(...totals), max: Math.max(...totals) };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Page-level stats across all listed hagwons with fee data (each registered hagwon counted once).
export function feeStats(hagwons) {
  const entries = new Map();
  for (const h of hagwons) {
    const entry = getNeisEntry(h.neis);
    if (entry) entries.set(h.neis.id, entry);
  }
  if (entries.size === 0) return null;
  const totals = [...entries.values()].flatMap(courseTotals);
  return {
    hagwonCount: entries.size,
    courseCount: totals.length,
    min: Math.min(...totals),
    max: Math.max(...totals),
    median: median(totals),
  };
}

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

// "20150209" -> "2015"
export const establishedYear = entry => entry.establishedYmd?.slice(0, 4) || null;

// "국제화 / 외국어"
export function fieldLabel(entry) {
  const parts = [entry.realm, ...(entry.tracks || [])].filter(Boolean);
  return [...new Set(parts)].join(' / ') || null;
}

// "2026-10-04" -> "2026년 10월 4일"
export function formatDate(ymd) {
  const [y, m, d] = (ymd || '').split('-').map(Number);
  return y ? `${y}년 ${m}월 ${d}일` : '';
}

// schema.org ItemList of EducationalOrganization, with priceRange where fees are known.
export function hagwonJsonLd(hagwons, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: pageUrl,
    itemListElement: hagwons.map((h, i) => {
      const entry = getNeisEntry(h.neis);
      const org = {
        '@type': 'EducationalOrganization',
        name: h.name,
        ...(h.url && { url: h.url }),
        ...(h.address && h.address !== '온라인' && { address: h.address }),
      };
      if (entry) {
        const { min, max } = feeRange(entry);
        org.priceRange = min === max ? formatWon(min) : `${formatWon(min)} ~ ${formatWon(max)}`;
        const year = establishedYear(entry);
        if (year) org.foundingDate = year;
      }
      return { '@type': 'ListItem', position: i + 1, item: org };
    }),
  };
}

// Safe for embedding in a <script> tag.
export const jsonLdString = data => JSON.stringify(data).replace(/</g, '\\u003c');
