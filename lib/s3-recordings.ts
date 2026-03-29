import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Client(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured')
  }
  return new S3Client({
    region: process.env.CONSULTATION_S3_REGION || 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket(): string {
  const bucket = process.env.CONSULTATION_S3_BUCKET
  if (!bucket) throw new Error('CONSULTATION_S3_BUCKET not configured')
  return bucket
}

export function buildRecordingKey(consultationId: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  return `recordings/${year}/${month}/${consultationId}_${timestamp}.mp4`
}

export async function uploadRecording(
  s3Key: string,
  body: Buffer | ReadableStream,
  contentLength?: number
): Promise<{ bucket: string; key: string }> {
  const bucket = getBucket()
  const client = getS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: body,
      ContentType: 'video/mp4',
      ServerSideEncryption: 'AES256',
      ...(contentLength ? { ContentLength: contentLength } : {}),
    })
  )

  return { bucket, key: s3Key }
}

export async function getRecordingPresignedUrl(
  s3Key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: s3Key,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
