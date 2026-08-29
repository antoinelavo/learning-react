// /app/api/expedite/verify-payment/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Fixed price for expedited review — server is the source of truth, never
// trust a client-submitted amount here (unlike the premium-listing route,
// this feature has a single fixed price).
const EXPEDITE_AMOUNT = 9000;

export async function POST(request) {
  try {
    // Step 0: Auth — resolve the caller's own teacher row from their session
    // token only. Never trust a client-submitted teacherId for a route that
    // can auto-approve a profile.
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    if (teacher.status !== 'pending') {
      return NextResponse.json({ error: 'Teacher is not pending review' }, { status: 400 });
    }

    // Step 1: Parse body — paymentId only
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    // Step 2: Verify payment with PortOne
    const verifyResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      headers: {
        'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
      },
    });

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Payment lookup failed' }, { status: 502 });
    }

    const paymentData = await verifyResponse.json();

    if (paymentData.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentData.status },
        { status: 400 }
      );
    }

    if (paymentData.amount.total !== EXPEDITE_AMOUNT) {
      return NextResponse.json({ error: 'Payment amount verification failed' }, { status: 400 });
    }

    // Step 3: Log the payment
    const { error: logError } = await supabase.from('expedite_payments').insert([{
      payment_id: paymentId,
      teacher_id: teacher.id,
      method: 'card',
      amount: EXPEDITE_AMOUNT,
      status: 'paid',
      requested_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }]);

    if (logError) {
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // Step 4: Auto-approve — scoped to the session-resolved teacher row only,
    // guarded against a concurrent/replayed request double-approving.
    const { error: approveError } = await supabase
      .from('teachers')
      .update({ status: 'approved', last_updated: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (approveError) {
      return NextResponse.json({ error: 'Failed to approve profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
