const DEV_DEFAULT_JWT_SECRET = ['dev', 'secret', 'change', 'in', 'production'].join('-');
const DEV_DEFAULT_UPLOAD_GUEST_SECRET = [
  'dev',
  'upload',
  'guest',
  'secret',
  'change',
  'in',
  'production',
].join('-');
const DEV_DEFAULT_S3_ACCESS_KEY_ID = ['minio', 'admin'].join('');
const DEV_DEFAULT_S3_SECRET_ACCESS_KEY = ['minio', 'admin'].join('');

const WEAK_SECRET_VALUES = new Set([
  DEV_DEFAULT_JWT_SECRET,
  DEV_DEFAULT_UPLOAD_GUEST_SECRET,
  DEV_DEFAULT_S3_ACCESS_KEY_ID,
  'changeme',
  'change-me',
  'password',
  'secret',
  '123456',
]);

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const isBlank = (value: string | undefined) =>
  value === undefined || value.trim().length === 0;

const assertStrongSecret = (
  name: string,
  value: string | undefined,
  minLength: number,
) => {
  if (isBlank(value)) {
    throw new Error(`Missing required secret: ${name}`);
  }

  const resolvedValue = value!.trim();
  const normalized = resolvedValue.toLowerCase();
  if (resolvedValue.length < minLength || WEAK_SECRET_VALUES.has(normalized)) {
    throw new Error(
      `${name} is too weak. Provide a high-entropy secret with at least ${minLength} characters.`,
    );
  }
};

const assertNonDefaultCredential = (
  name: string,
  value: string | undefined,
  blockedValues: string[],
) => {
  if (isBlank(value)) {
    throw new Error(`Missing required credential: ${name}`);
  }

  const blocked = new Set(blockedValues.map((entry) => entry.toLowerCase()));
  const resolvedValue = value!.trim().toLowerCase();
  if (blocked.has(resolvedValue)) {
    throw new Error(`${name} uses an insecure default value.`);
  }
};

export default () => {
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';

  const jwtSecret =
    process.env.JWT_SECRET ??
    (isProduction ? undefined : DEV_DEFAULT_JWT_SECRET);

  const uploadGuestTokenSecret =
    process.env.UPLOAD_GUEST_TOKEN_SECRET ??
    (isProduction
      ? undefined
      : (process.env.JWT_SECRET ?? DEV_DEFAULT_UPLOAD_GUEST_SECRET));

  const s3AccessKeyId =
    process.env.S3_ACCESS_KEY_ID ??
    (isProduction ? undefined : DEV_DEFAULT_S3_ACCESS_KEY_ID);

  const s3SecretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY ??
    (isProduction ? undefined : DEV_DEFAULT_S3_SECRET_ACCESS_KEY);

  if (isProduction) {
    assertStrongSecret('JWT_SECRET', jwtSecret, 32);
    assertStrongSecret('UPLOAD_GUEST_TOKEN_SECRET', uploadGuestTokenSecret, 32);
    assertNonDefaultCredential('S3_ACCESS_KEY_ID', s3AccessKeyId, [
      DEV_DEFAULT_S3_ACCESS_KEY_ID,
    ]);
    assertStrongSecret('S3_SECRET_ACCESS_KEY', s3SecretAccessKey, 24);

    if (jwtSecret === uploadGuestTokenSecret) {
      throw new Error(
        'UPLOAD_GUEST_TOKEN_SECRET must be different from JWT_SECRET in production.',
      );
    }
  }

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    jwt: {
      secret: jwtSecret!,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
    },
    mail: {
      host: process.env.SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
      from: process.env.MAIL_FROM ?? 'noreply@alcor.com',
      fromName: process.env.MAIL_FROM_NAME ?? 'АЛЬКОР',
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'marketplace',
      accessKeyId: s3AccessKeyId!,
      secretAccessKey: s3SecretAccessKey!,
      publicUrl:
        process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/marketplace',
      publicReadAssets: toBoolean(
        process.env.S3_PUBLIC_READ_ASSETS,
        process.env.NODE_ENV !== 'production',
      ),
    },
    upload: {
      guestTokenSecret: uploadGuestTokenSecret!,
      guestTokenTtlSeconds: parseInt(
        process.env.UPLOAD_GUEST_TOKEN_TTL_SECONDS ?? '900',
        10,
      ),
      guestTokenRateLimitPerMinute: parseInt(
        process.env.UPLOAD_GUEST_TOKEN_RATE_LIMIT_PER_MINUTE ?? '10',
        10,
      ),
      requestLimitPerMinute: parseInt(
        process.env.UPLOAD_REQUEST_LIMIT_PER_MINUTE ?? '15',
        10,
      ),
      filesLimitPerMinute: parseInt(
        process.env.UPLOAD_FILES_LIMIT_PER_MINUTE ?? '40',
        10,
      ),
      bytesLimitPerMinute: parseInt(
        process.env.UPLOAD_BYTES_LIMIT_PER_MINUTE ?? `${80 * 1024 * 1024}`,
        10,
      ),
    },
  };
};
