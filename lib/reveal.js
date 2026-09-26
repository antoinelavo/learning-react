// lib/reveal.js
// Client-side helpers for revealing a student_jobs request's contact info.
// "Reveal" is gated by teacher tier — premium (플러스) is unlimited, free is
// capped at 2 per rolling 30-day window. The actual enforcement lives in
// reveal_student_job(), a security-definer RPC (see
// supabase/migrations/20260924_teacher_tier_system.sql) — everything here
// is a thin, non-authoritative wrapper around it.
import { supabase } from '@/lib/supabase';

// reason: already_revealed | premium | free_reveal | limit_reached |
// teacher_not_found | unknown_error
export async function revealStudentJob(teacherId, studentJobId) {
  const { data, error } = await supabase.rpc('reveal_student_job', {
    p_teacher_id: teacherId,
    p_student_job_id: studentJobId,
  });
  if (error) throw error;
  return data?.[0] || { revealed: false, reason: 'unknown_error' };
}

// Every student_jobs id this teacher has already revealed — used to show
// contact info immediately (no re-reveal, no count change) for requests
// they've already unlocked.
export async function getRevealedStudentJobIds(teacherId) {
  const { data, error } = await supabase
    .from('teacher_revealed_requests')
    .select('student_job_id')
    .eq('teacher_id', teacherId);
  if (error) throw error;
  return new Set((data || []).map((r) => r.student_job_id));
}

const FREE_TIER_LIMIT = 2;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Reveals-remaining for the free-tier counter badge. This is a client-side
// projection for display only — it accounts for a 30-day window that has
// elapsed but not yet been lazily reset in the database (the reset only
// happens inside reveal_student_job() when a reveal is next attempted), so
// the badge doesn't show a stale "0 left" after the window has actually
// rolled over. Returns null for premium teachers (no limit to show).
export function revealsRemaining(teacher) {
  if (!teacher || teacher.tier === 'premium') return null;
  const resetAt = teacher.reveal_reset_at ? new Date(teacher.reveal_reset_at).getTime() : Date.now();
  const windowExpired = Date.now() > resetAt + WINDOW_MS;
  const used = windowExpired ? 0 : teacher.reveal_count || 0;
  return Math.max(0, FREE_TIER_LIMIT - used);
}
