import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';

const PLATFORM_FEE_RATE = 0.15;

function randomOrderId() {
  return [...crypto.getRandomValues(new Uint32Array(4))]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

// Starts a purchase: validates the resource and buyer, computes the
// platform fee / teacher earning split, and writes a 'pending' purchases
// row keyed by a fresh order_id — the same shape as payment_request in
// components/PremiumListingOffer.js. The client then hands this orderId to
// Toss's requestPayment(); app/api/toss/resource-success finishes the job.
export async function POST(request, { params }) {
  const { id } = await params;
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('id, teacher_id, title, price_krw, status')
    .eq('id', id)
    .single();

  if (resourceError || !resource || resource.status !== 'active') {
    return NextResponse.json({ error: 'Resource not available' }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('resource_id', id)
    .eq('buyer_id', authed.id)
    .eq('status', 'paid')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Already purchased', alreadyOwned: true }, { status: 409 });
  }

  const price = resource.price_krw;
  const platformFee = Math.round(price * PLATFORM_FEE_RATE);
  const teacherEarning = price - platformFee;
  const orderId = randomOrderId();

  const { error: insertError } = await supabase.from('purchases').insert([{
    order_id: orderId,
    resource_id: resource.id,
    buyer_id: authed.id,
    teacher_id: resource.teacher_id,
    price_krw: price,
    platform_fee_krw: platformFee,
    teacher_earning_krw: teacherEarning,
    status: 'pending',
  }]);

  if (insertError) {
    console.error('POST /api/resources/[id]/purchase', insertError);
    return NextResponse.json({ error: 'Failed to start purchase' }, { status: 500 });
  }

  return NextResponse.json({
    orderId,
    amount: price,
    orderName: resource.title,
  });
}
