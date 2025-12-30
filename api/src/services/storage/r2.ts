import {
  S3Client,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";

const UPLOAD_EXPIRY_SECONDS = 15 * 60; // 15 min
const DOWNLOAD_EXPIRY_SECONDS = 60 * 60; // 1 hour

type ObjectMetadata = {
  contentLength?: number;
  contentType?: string;
};

function createR2Client(): S3Client | null {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export const r2Client = createR2Client();

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.$metadata?.httpStatusCode === 404
  );
};

function getClient(): S3Client {
  if (!r2Client) {
    throw new Error("R2 client not configured");
  }
  return r2Client;
}

function getBucket(): string {
  if (!env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }
  return env.R2_BUCKET_NAME;
}

export async function presignPutUrl(
  key: string,
  contentType: string,
  maxSizeBytes: number,
  expiresIn: number = UPLOAD_EXPIRY_SECONDS
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeBytes,
  });

  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function presignGetUrl(
  key: string,
  expiresIn: number = DOWNLOAD_EXPIRY_SECONDS
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function headObject(key: string): Promise<ObjectMetadata | null> {
  try {
    const response = await getClient().send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );

    const metadata: ObjectMetadata = {};
    if (response.ContentLength !== undefined) {
      metadata.contentLength = response.ContentLength;
    }
    if (response.ContentType !== undefined) {
      metadata.contentType = response.ContentType;
    }
    return metadata;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function objectExists(key: string): Promise<boolean> {
  const metadata = await headObject(key);
  return metadata !== null;
}

export async function copyObject(
  sourceKey: string,
  destKey: string
): Promise<void> {
  await getClient().send(
    new CopyObjectCommand({
      Bucket: getBucket(),
      CopySource: `${getBucket()}/${sourceKey}`,
      Key: destKey,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}
