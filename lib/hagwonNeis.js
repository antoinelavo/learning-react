// Registered hagwon fees and info from NEIS, read from the snapshot built by
// scripts/update-hagwon-neis.mjs. Server-side only: import from server components.
import neisData from '@/data/hagwon-neis.json';
import { formatManwon, formatWon, formatPeriod } from '@/lib/hagwonFormat';

export { formatManwon, formatWon, formatPeriod };

export const neisUpdatedAt = neisData.updatedAt;

// Returns the NEIS entry for a hagwon's `neis` field, or null when there is no fee data.
export function getNeisEntry(neis) {
  const entry = neis?.id ? neisData.hagwons[neis.id] : null;
  if (!entry || !entry.courses?.some(c => c.total != null)) return null;
  return entry;
}

// Hagwons with fee data first; otherwise keeps the original order (Array.sort is stable).
export function sortByFeeData(hagwons) {
  return [...hagwons].sort((a, b) => Boolean(getNeisEntry(b.neis)) - Boolean(getNeisEntry(a.neis)));
}

const courseTotals = entry => entry.courses.map(c => c.total).filter(t => t != null);

export function feeRange(entry) {
  const totals = courseTotals(entry);
  return { min: Math.min(...totals), max: Math.max(...totals) };
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
export function hagwonJsonLd(hagwons, pageUrl, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: pageUrl,
    numberOfItems: hagwons.length,
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
