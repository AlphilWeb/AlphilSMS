import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const endpoint = process.env.R2_ENDPOINT;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
  throw new Error('Missing required R2 environment variables');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint, // Use the full endpoint from env
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export { s3Client, bucketName };