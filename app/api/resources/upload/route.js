import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';
import { r2 } from '@/lib/r2';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const VALID_TYPES = ['subject', 'ee', 'tok'];
const VALID_MONTHS = ['May', 'November'];

export async function POST(request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!authed.teacherId || authed.teacherStatus !== 'approved') {
    return NextResponse.json({ error: 'Only approved teachers can upload resources' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || null;
  const subject = formData.get('subject')?.toString().trim();
  const resourceType = formData.get('resource_type')?.toString().trim() || 'subject';
  const sessionMonth = formData.get('session_month')?.toString().trim();
  const sessionYear = Number(formData.get('session_year'));
  const score = formData.get('score')?.toString().trim();
  const priceKrw = Number(formData.get('price_krw'));

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!title || !subject || !score) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(resourceType)) {
    return NextResponse.json({ error: 'Invalid resource_type' }, { status: 400 });
  }
  if (!VALID_MONTHS.includes(sessionMonth)) {
    return NextResponse.json({ error: 'Invalid session_month' }, { status: 400 });
  }
  if (!Number.isInteger(sessionYear) || sessionYear < 2000) {
    return NextResponse.json({ error: 'Invalid session_year' }, { status: 400 });
  }
  if (!Number.isFinite(priceKrw) || priceKrw < 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
  }

  const fileKey = `resources/${authed.teacherId}/${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_RESOURCES_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: 'application/pdf',
    }));
  } catch (error) {
    console.error('Resource upload: R2 error', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: resource, error: insertError } = await supabase
    .from('resources')
    .insert([{
      teacher_id: authed.teacherId,
      title,
      description,
      subject,
      resource_type: resourceType,
      session_month: sessionMonth,
      session_year: sessionYear,
      score,
      price_krw: priceKrw,
      file_key: fileKey,
      file_size_bytes: file.size,
    }])
    .select()
    .single();

  if (insertError) {
    console.error('Resource upload: DB error', insertError);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }

  return NextResponse.json({ resource });
}
