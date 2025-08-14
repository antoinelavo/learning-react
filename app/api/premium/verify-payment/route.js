// /app/api/premium/verify-payment/route.js (Corrected App Router syntax)
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Check premium spot availability
async function checkPremiumSpotAvailability(subjects, supabase) {
  const SPOTS_PER_SUBJECT = 5;
  
  try {
    // Get all currently active premium subscriptions
    const { data: activePremium, error } = await supabase
      .from('teacher_premium')
      .select('subject')
      .gt('end_date', new Date().toISOString()); // Only active subscriptions

    if (error) {
      console.error('Error fetching active premium:', error);
      throw error;
    }

    // Count how many teachers have premium for each subject
    const subjectCounts = {};
    
    // Initialize counts for requested subjects
    subjects.forEach(subject => {
      subjectCounts[subject] = 0;
    });

    // Count active subscriptions per subject
    activePremium.forEach(record => {
      record.subject.forEach(subject => {
        if (subjects.includes(subject)) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        }
      });
    });

    // Calculate availability for each subject
    const availability = {};
    subjects.forEach(subject => {
      const used = subjectCounts[subject] || 0;
      availability[subject] = {
        used: used,
        remaining: Math.max(0, SPOTS_PER_SUBJECT - used),
        isFull: used >= SPOTS_PER_SUBJECT,
        total: SPOTS_PER_SUBJECT
      };
    });

    return {
      success: true,
      availability,
      allAvailable: subjects.every(subject => !availability[subject].isFull)
    };

  } catch (error) {
    console.error('Error checking premium availability:', error);
    return {
      success: false,
      error: error.message,
      availability: {},
      allAvailable: false
    };
  }
}

export async function POST(request) {
  try {
    const { paymentId, teacherId, teacherName, subjects, durationMonths, expectedAmount } = await request.json();

    console.log('🔍 Verifying premium payment:', paymentId);

    // Step 1: Verify payment with PortOne
    const verifyResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      headers: {
        'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
      },
    });

    if (!verifyResponse.ok) {
      throw new Error(`PortOne API error: ${verifyResponse.status}`);
    }

    const paymentData = await verifyResponse.json();
    console.log('💳 Payment status:', paymentData.status);

    // Step 2: Check if payment is successful
    if (paymentData.status !== 'PAID') {
      return NextResponse.json({ 
        error: 'Payment not completed',
        status: paymentData.status 
      }, { status: 400 });
    }

    // Step 3: Verify payment amount matches expected amount
    if (paymentData.amount.total !== expectedAmount) {
      console.error('❌ Amount mismatch:', {
        expected: expectedAmount,
        received: paymentData.amount.total
      });
      return NextResponse.json({ 
        error: 'Payment amount verification failed',
        expected: expectedAmount,
        received: paymentData.amount.total
      }, { status: 400 });
    }

    console.log('✅ Payment verified successfully');

    // Step 4: Check premium spot availability (prevent race conditions)
    const availabilityCheck = await checkPremiumSpotAvailability(subjects, supabase);
    if (!availabilityCheck.success) {
      throw new Error('Failed to verify premium spot availability');
    }

    // Check if any selected subjects are now full
    const unavailableSubjects = subjects.filter(subject => 
      availabilityCheck.availability[subject]?.isFull
    );

    if (unavailableSubjects.length > 0) {
      console.error('❌ Premium spots no longer available:', unavailableSubjects);
      return NextResponse.json({ 
        error: 'Premium spots no longer available',
        unavailableSubjects: unavailableSubjects,
        message: `${unavailableSubjects.join(', ')}의 프리미엄 자리가 마감되었습니다.`
      }, { status: 400 });
    }

    console.log('✅ Premium spots confirmed available');

    // Step 5: Record successful payment
    const { error: paymentError } = await supabase
      .from('successful_payments')
      .insert([{
        payment_id: paymentId,
        teacher_id: teacherId,
        teacher_name: teacherName,
        amount: expectedAmount,
        subjects: subjects,
        duration_months: durationMonths,
        payment_date: new Date().toISOString(),
      }]);

    if (paymentError) {
      console.error('❌ Failed to record payment:', paymentError);
      throw new Error('Failed to record payment');
    }

    console.log('✅ Payment recorded successfully');

    // Step 6: Activate premium features (basic version - no extension logic yet)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + durationMonths);

    const { error: premiumError } = await supabase
      .from('teacher_premium')
      .insert([{
        teacher_id: teacherId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        subject: subjects,
      }]);

    if (premiumError) {
      console.error('❌ Failed to activate premium:', premiumError);
      throw new Error('Failed to activate premium features');
    }

    console.log('✅ Premium features activated successfully');

    // Step 7: Return success response
    return NextResponse.json({ 
      success: true,
      paymentId: paymentId,
      teacherId: teacherId,
      subjects: subjects,
      durationMonths: durationMonths,
      amount: expectedAmount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      message: 'Payment verified and premium features activated'
    });

  } catch (error) {
    console.error('❌ Premium payment verification error:', error);
    
    // Handle specific errors
    if (error.message?.includes('Payment not found')) {
      return NextResponse.json({ 
        error: 'Payment not found',
        details: 'The payment ID could not be found in PortOne'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Payment verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}