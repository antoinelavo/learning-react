/**
 * NEIS hagwon data updater
 *
 * Rebuilds data/hagwon-neis.json for every entry in data/hagwons.js and
 * data/sat-hagwons.js that has a `neis` field:
 * 1. Registered courses and fees (교습비) from the hakwon.neis.go.kr search site.
 *    The official open API does not publish 학원 fees, only 교습소 fees.
 * 2. Opening date (개원일) and field (교습분야) from the NEIS open API (open.neis.go.kr).
 *
 * Usage: node scripts/update-hagwon-neis.mjs
 *
 * Requires: NEIS_API_KEY in .env.local (for step 2; step 1 needs no key).
 * Behind an HTTP proxy, run with NODE_USE_ENV_PROXY=1.
 *
 * If a hagwon fails to fetch, its previous entry is kept, so a partial run
 * never wipes data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hagwons from '../data/hagwons.js';
import satHagwons from '../data/sat-hagwons.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(ROOT, 'data', 'hagwon-neis.json');
const SEARCH_BASE = 'https://hakwon.neis.go.kr';
const OPEN_API = 'https://open.neis.go.kr/hub/acaInsTiInfo';

// Load .env.local (optional)
const env = {};
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
}
const NEIS_API_KEY = process.env.NEIS_API_KEY || env.NEIS_API_KEY;

// --- hakwon.neis.go.kr (Nexacro XML transactions) ---

let cookie = '';

async function openSession() {
  const res = await fetch(`${SEARCH_BASE}/nxui/index.html`);
  if (!res.ok) throw new Error(`Session request failed: ${res.status}`);
  cookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
}

const escapeXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const unescapeXml = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');

function dataset(id, row) {
  const cols = Object.keys(row).map(c => `<Column id="${c}" type="STRING" size="256" />`).join('');
  const values = Object.entries(row).map(([k, v]) => `<Col id="${k}">${escapeXml(v)}</Col>`).join('');
  return `<Dataset id="${id}"><ColumnInfo>${cols}</ColumnInfo><Rows><Row>${values}</Row></Rows></Dataset>`;
}

function parseDataset(xml, id) {
  const block = xml.match(new RegExp(`<Dataset id="${id}">([\\s\\S]*?)</Dataset>`));
  if (!block) return [];
  return [...block[1].matchAll(/<Row[^>]*>([\s\S]*?)<\/Row>/g)].map(([, row]) =>
    Object.fromEntries([...row.matchAll(/<Col id="(\w+)">([\s\S]*?)<\/Col>/g)].map(([, k, v]) => [k, unescapeXml(v)]))
  );
}

async function searchPage({ office, zone, name }, pageIndex) {
  const body = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<Root xmlns="http://www.nexacroplatform.com/platform/dataset"><Parameters/>'
    + dataset('dsSearch', {
      cddcOrgCd: office,
      searchAcaInstiScCd: '1', // 1 = 학원
      searchAdtzoCd: zone,
      searchAcaNm: name,
    })
    + dataset('dsPageInfo', { pageIndex, pageSize: 200 })
    + '</Root>';
  const res = await fetch(`${SEARCH_BASE}/hes_ics_sl00_002.do`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'text/xml',
      Accept: 'text/xml',
      ui: 'nexacro',
      'X-Requested-With': 'Fetch',
      Origin: SEARCH_BASE,
      Referer: `${SEARCH_BASE}/nxui/index.html`,
      Cookie: cookie,
    },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const xml = await res.text();
  const errorCode = xml.match(/id="ErrorCode"[^>]*>(-?\d+)</)?.[1];
  if (errorCode !== '0') throw new Error(`Search error: ${xml.match(/id="ErrorMsg"[^>]*>([^<]*)</)?.[1]}`);
  const total = Number(parseDataset(xml, 'dsPageInfo')[0]?.totalCount || 0);
  return { rows: parseDataset(xml, 'dsList'), total };
}

const toNumber = s => {
  const n = Number(String(s ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) && String(s ?? '').trim() !== '' ? n : null;
};

async function fetchCourses(neis) {
  const rows = [];
  for (let page = 1; ; page++) {
    const { rows: pageRows, total } = await searchPage(neis, page);
    rows.push(...pageRows);
    if (pageRows.length === 0 || rows.length >= total) break;
  }

  // The search matches by name, so keep only this hagwon's rows.
  // Course names are padded with trailing spaces to keep them unique; trim and dedupe.
  const seen = new Set();
  const courses = [];
  const tracks = new Set();
  for (const r of rows) {
    if (r.acaDsgnNo !== neis.id) continue;
    if (r.leOrdNm) tracks.add(r.leOrdNm.trim());
    const minutes = toNumber(r.totlLeHrMCnt);
    const course = {
      subject: (r.leSbjtNm || '').trim(),
      period: (r.lePrd || '').trim(),
      hours: minutes != null ? Math.round(minutes / 6) / 10 : null,
      fee: toNumber(r.thccAmt),
      otherFee: toNumber(r.etcExpsTtl),
      total: toNumber(r.allThccTot),
    };
    const key = JSON.stringify(course);
    if (seen.has(key)) continue;
    seen.add(key);
    courses.push(course);
  }
  courses.sort((a, b) => (a.total ?? Infinity) - (b.total ?? Infinity));
  return { courses, tracks: [...tracks] };
}

// --- open.neis.go.kr (official API) ---

async function fetchRegistry({ office, id }) {
  if (!NEIS_API_KEY) return null;
  const params = new URLSearchParams({
    KEY: NEIS_API_KEY, Type: 'json', pIndex: '1', pSize: '5',
    ATPT_OFCDC_SC_CODE: office, ACA_ASNUM: id,
  });
  const res = await fetch(`${OPEN_API}?${params}`);
  if (!res.ok) throw new Error(`Open API failed: ${res.status}`);
  const json = await res.json();
  const row = json.acaInsTiInfo?.[1]?.row?.find(r => r.ACA_ASNUM === id);
  if (!row) return null;
  return {
    establishedYmd: (row.ESTBL_YMD || '').trim() || null,
    realm: (row.REALM_SC_NM || '').trim() || null,
  };
}

// --- main ---

async function main() {
  const previous = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')) : { hagwons: {} };

  const targets = new Map();
  for (const h of [...hagwons, ...satHagwons]) {
    if (h.neis?.id) targets.set(h.neis.id, h.neis);
  }
  if (!NEIS_API_KEY) console.warn('⚠️  NEIS_API_KEY not set: keeping previous 개원일/교습분야 values.');

  await openSession();

  const result = {};
  const failed = [];
  for (const neis of targets.values()) {
    const prev = previous.hagwons?.[neis.id];
    try {
      const { courses, tracks } = await fetchCourses(neis);
      // No rows usually means the registered name changed; don't wipe the previous data.
      if (courses.length === 0) throw new Error('No fee rows found (registered name may have changed)');

      // 개원일/교습분야 are optional: keep fresh fees even if the open API fails.
      let registry = null;
      try {
        registry = await fetchRegistry(neis);
      } catch (err) {
        console.warn(`⚠️  ${neis.name}: open API failed (${err.message}), keeping previous 개원일/교습분야`);
      }

      result[neis.id] = {
        name: neis.name,
        establishedYmd: registry?.establishedYmd ?? prev?.establishedYmd ?? null,
        realm: registry?.realm ?? prev?.realm ?? null,
        tracks,
        courses,
      };
      console.log(`✅ ${neis.name}: ${courses.length} courses`);
    } catch (err) {
      failed.push(neis.name);
      if (prev) result[neis.id] = prev;
      console.error(`❌ ${neis.name}: ${err.message}${prev ? ' (kept previous data)' : ''}`);
    }
  }

  const output = {
    updatedAt: new Date().toISOString().split('T')[0],
    source: '교육청 학원·교습소 정보 (hakwon.neis.go.kr, open.neis.go.kr)',
    hagwons: result,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(result).length} hagwons to data/hagwon-neis.json`);
  if (failed.length) {
    console.error(`${failed.length} failed: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
