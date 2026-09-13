import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';
import { r2 } from '@/lib/r2';

// Access-gated download. There is no public or presigned URL to this file
// anywhere — every download re-verifies the caller's identity and their
// purchase against the DB, then streams the bytes from the private R2
// bucket through this route. A leaked link alone (without a valid,
// authorized bearer token) grants nothing.
export async function GET(request, { params }) {
  const { id } = await params;
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('id, teacher_id, title, file_key')
    .eq('id', id)
    .single();

  if (resourceError || !resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isOwner = authed.teacherId === resource.teacher_id;
  const isAdmin = authed.role === 'admin';

  if (!isOwner && !isAdmin) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('resource_id', id)
      .eq('buyer_id', authed.id)
      .eq('status', 'paid')
      .maybeSingle();

    if (!purchase) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const object = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_RESOURCES_BUCKET_NAME,
      Key: resource.file_key,
    }));
    const bytes = await object.Body.transformToByteArray();
    const safeName = resource.title.replace(/[^\w\-. ]/g, '').trim() || 'resource';

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('GET /api/resources/[id]/download', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
