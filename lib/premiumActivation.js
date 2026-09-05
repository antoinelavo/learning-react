// lib/premiumActivation.js
// Shared, idempotent business logic for activating a teacher's premium
// listing after a payment is confirmed. Called from both the NicePay
// returnUrl handler and the webhook handler, so a payment can only ever
// activate premium once no matter which path confirms it first.
import { supabase } from '@/lib/supabase';

const SPOTS_PER_SUBJECT = 5;

export async function checkPremiumSpotAvailability(subjects) {
  try {
    // Get all currently active premium subscriptions
    const { data: activePremium, error } = await supabase
      .from('teacher_premium')
      .select('subject')
      .gt('end_date', new Date().toISOString()); // Only active subscriptions

    if (error) {
      throw error;
    }

    // Count how many teachers have premium for each subject
    const subjectCounts = {};
    subjects.forEach((subject) => {
      subjectCounts[subject] = 0;
    });

    activePremium.forEach((record) => {
      record.subject.forEach((subject) => {
        if (subjects.includes(subject)) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        }
      });
    });

    const availability = {};
    subjects.forEach((subject) => {
      const used = subjectCounts[subject] || 0;
      availability[subject] = {
        used,
        remaining: Math.max(0, SPOTS_PER_SUBJECT - used),
        isFull: used >= SPOTS_PER_SUBJECT,
        total: SPOTS_PER_SUBJECT,
      };
    });

    return {
      success: true,
      availability,
      allAvailable: subjects.every((subject) => !availability[subject].isFull),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      availability: {},
      allAvailable: false,
    };
  }
}

// Verifies premium spots are still available and records the purchase.
// Idempotent: safe to call more than once for the same paymentId (the
// returnUrl handler and the webhook can both race to call this).
export async function activatePremium({
  paymentId,
  teacherId,
  teacherName,
  subjects,
  durationMonths,
  expectedAmount,
}) {
  // Already processed? (covers webhook firing after/alongside returnUrl)
  const { data: existing } = await supabase
    .from('successful_payments')
    .select('payment_id')
    .eq('payment_id', paymentId)
    .maybeSingle();
  if (existing) {
    return { ok: true, alreadyProcessed: true };
  }

  const availabilityCheck = await checkPremiumSpotAvailability(subjects);
  if (!availabilityCheck.success) {
    return { ok: false, status: 500, error: 'availability_check_failed' };
  }

  const unavailableSubjects = subjects.filter(
    (subject) => availabilityCheck.availability[subject]?.isFull
  );
  if (unavailableSubjects.length > 0) {
    return { ok: false, status: 409, error: 'spots_unavailable', unavailableSubjects };
  }

  const { error: paymentError } = await supabase.from('successful_payments').insert([
    {
      payment_id: paymentId,
      teacher_id: teacherId,
      teacher_name: teacherName,
      amount: expectedAmount,
      subjects,
      duration_months: durationMonths,
      payment_date: new Date().toISOString(),
    },
  ]);

  if (paymentError) {
    // Unique-violation: a concurrent caller (returnUrl vs. webhook) already
    // recorded this payment first — treat it as a successful no-op.
    if (paymentError.code === '23505') {
      return { ok: true, alreadyProcessed: true };
    }
    return { ok: false, status: 500, error: 'record_payment_failed' };
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + durationMonths);

  const { error: premiumError } = await supabase.from('teacher_premium').insert([
    {
      teacher_id: teacherId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      subject: subjects,
    },
  ]);

  if (premiumError) {
    return { ok: false, status: 500, error: 'activate_premium_failed' };
  }

  return { ok: true, alreadyProcessed: false, startDate, endDate };
}
