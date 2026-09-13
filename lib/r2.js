// lib/r2.js
// Shared Cloudflare R2 (S3-compatible) client. The bucket differs by
// caller: NEXT_PUBLIC_R2_PUBLIC_URL's public bucket for profile pictures
// (app/api/upload-profile-picture) vs. the private R2_RESOURCES_BUCKET_NAME
// bucket for paid marketplace resources (never served by a public URL —
// always fetched server-side by app/api/resources/[id]/download).
import { S3Client } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
