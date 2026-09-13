import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { getCommunityUser } from '@/lib/communityAuth'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5

export async function POST(request) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const formData = await request.formData()
  const files = formData.getAll('files')

  if (!files.length) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.` }, { status: 400 })
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }
  }

  try {
    const urls = await Promise.all(files.map(async (file, i) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `community/${user.id}/${Date.now()}-${i}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }))

      return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`
    }))

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('community image upload error:', error)
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
  }
}
