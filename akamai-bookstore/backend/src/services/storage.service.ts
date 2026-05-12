import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../config.js'

let s3: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3) {
    if (!config.AKAMAI_OBJECT_STORAGE_ENDPOINT || !config.AKAMAI_ACCESS_KEY || !config.AKAMAI_SECRET_KEY) {
      throw new Error('Object Storage not configured')
    }
    s3 = new S3Client({
      region: 'us-east-1',
      endpoint: config.AKAMAI_OBJECT_STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: config.AKAMAI_ACCESS_KEY,
        secretAccessKey: config.AKAMAI_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  }
  return s3
}

export async function uploadCoverImage(
  bookId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const bucket = config.AKAMAI_OBJECT_STORAGE_BUCKET!
  const key = `covers/${bookId}.jpg`

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    }),
  )

  return `${config.AKAMAI_OBJECT_STORAGE_ENDPOINT}/${bucket}/${key}`
}
