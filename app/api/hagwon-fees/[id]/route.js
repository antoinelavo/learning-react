// Per-course NEIS fees for one hagwon, loaded by the fee table when a card's
// 강좌별 교습비 row is opened. Built as static JSON at build time, so the
// hagwon pages don't have to ship every table in their HTML.
import neisData from '@/data/hagwon-neis.json';
import { getNeisEntry } from '@/lib/hagwonNeis';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(neisData.hagwons)
    .filter(id => getNeisEntry({ id }))
    .map(id => ({ id }));
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const entry = getNeisEntry({ id });
  if (!entry) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ courses: entry.courses });
}
