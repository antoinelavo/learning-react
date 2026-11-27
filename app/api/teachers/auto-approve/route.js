// app/api/teachers/auto-approve/route.js
//
// Called by the browser right after a teacher submits their application.
// Approves the caller's own newest pending profile when it passes every rule
// in lib/teacherAutoApprove.js (complete, long intro, login email, no
// duplicate); otherwise changes nothing and the owner reviews it by hand.
//
// Trusts only the bearer token: no teacher id comes from the client. The
// response is just { approved, reason } and never includes other teachers'
// data.
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { evaluateAutoApproval } from '@/lib/teacherAutoApprove';
import { sendApprovalEmail } from '@/lib/email/sendApprovalEmail';

const TEACHER_COLUMNS =
  'id, name, school, shortintroduction, longintroduction, contact_information, profile_picture, subjects, status, is_test, user_id';
// Only the columns the duplicate rules read.
const COMPARE_COLUMNS = 'id, name, school, contact_information, longintroduction, status, is_test';

// A profile is only auto-approved right after it is submitted. Later edits
// reset an approved or rejected profile to pending (the dashboard does that),
// and those must always go through the owner.
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

// PostgREST caps a response (about 1000 rows), so page through everything;
// a silent cap would let duplicates slip past the check.
async function fetchAllExcept(db, excludeId) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('teachers')
      .select(COMPARE_COLUMNS)
      .neq('id', excludeId)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ approved: false, reason: 'unauthorized' }, { status: 401 });
    }
    const db = getSupabaseAdmin();

    // The caller's own newest pending profile, created just now.
    const { data: mine, error: mineError } = await db
      .from('teachers')
      .select(TEACHER_COLUMNS)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('created_date', new Date(Date.now() - SUBMISSION_WINDOW_MS).toISOString())
      .order('created_date', { ascending: false })
      .limit(1);
    if (mineError) throw mineError;
    const teacher = mine?.[0];
    if (!teacher || teacher.is_test) {
      return NextResponse.json({ approved: false, reason: 'not_pending' });
    }

    const others = await fetchAllExcept(db, teacher.id);

    const { data: account, error: accountError } = await db
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();
    if (accountError) throw accountError;

    const verdict = evaluateAutoApproval(teacher, others, account?.email);
    if (!verdict.approve) {
      return NextResponse.json({ approved: false, reason: verdict.reason });
    }

    // Only flip a row that is still pending, so a repeated call approves
    // (and emails) once.
    const today = new Date().toISOString().split('T')[0];
    const { data: updated, error: updateError } = await db
      .from('teachers')
      .update({ status: 'approved', last_updated: today })
      .eq('id', teacher.id)
      .eq('status', 'pending')
      .select('id');
    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ approved: false, reason: 'not_pending' });
    }

    // A mail failure never undoes the approval.
    await sendApprovalEmail(db, teacher.id);

    return NextResponse.json({ approved: true });
  } catch (err) {
    console.error('auto-approve: unhandled error', err);
    return NextResponse.json({ approved: false, reason: 'error' });
  }
}
