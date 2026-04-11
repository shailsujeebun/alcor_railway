import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function main() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || ['minio', 'admin'].join('');
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || ['minio', 'admin'].join('');
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const bucket = 'marketplace';
  const key = 'test-file.txt';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'text/plain',
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log('Presigned URL generated successfully:');
    console.log(url);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
  }
}

main();
