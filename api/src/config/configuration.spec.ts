import configuration from './configuration';

const DEV_DEFAULT_JWT_SECRET = ['dev', 'secret', 'change', 'in', 'production'].join('-');
const DEV_DEFAULT_S3_ACCESS_KEY_ID = ['minio', 'admin'].join('');
const STRONG_JWT_SECRET = ['jwt', 'secret', 'very', 'strong', '0123456789abcdef'].join('-');
const STRONG_UPLOAD_SECRET = ['upload', 'secret', 'very', 'strong', '0123456789abcd'].join('-');
const STRONG_S3_SECRET = ['s3', 'secret', 'very', 'strong', '0123456789'].join('-');

describe('configuration security validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows non-production defaults', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.UPLOAD_GUEST_TOKEN_SECRET;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;

    const cfg = configuration();
    expect(cfg.jwt.secret).toBe(DEV_DEFAULT_JWT_SECRET);
    expect(cfg.s3.accessKeyId).toBe(DEV_DEFAULT_S3_ACCESS_KEY_ID);
  });

  it('fails in production when JWT secret is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    process.env.UPLOAD_GUEST_TOKEN_SECRET = STRONG_UPLOAD_SECRET;
    process.env.S3_ACCESS_KEY_ID = 'prod-access-key';
    process.env.S3_SECRET_ACCESS_KEY = STRONG_S3_SECRET;

    expect(() => configuration()).toThrow(
      'Missing required secret: JWT_SECRET',
    );
  });

  it('fails in production when upload secret matches JWT secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = STRONG_JWT_SECRET;
    process.env.UPLOAD_GUEST_TOKEN_SECRET = STRONG_JWT_SECRET;
    process.env.S3_ACCESS_KEY_ID = 'prod-access-key';
    process.env.S3_SECRET_ACCESS_KEY = STRONG_S3_SECRET;

    expect(() => configuration()).toThrow(
      'UPLOAD_GUEST_TOKEN_SECRET must be different from JWT_SECRET in production.',
    );
  });

  it('fails in production when S3 credentials use insecure defaults', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = STRONG_JWT_SECRET;
    process.env.UPLOAD_GUEST_TOKEN_SECRET = STRONG_UPLOAD_SECRET;
    process.env.S3_ACCESS_KEY_ID = DEV_DEFAULT_S3_ACCESS_KEY_ID;
    process.env.S3_SECRET_ACCESS_KEY = STRONG_S3_SECRET;

    expect(() => configuration()).toThrow(
      'S3_ACCESS_KEY_ID uses an insecure default value.',
    );
  });

  it('accepts strong production secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = STRONG_JWT_SECRET;
    process.env.UPLOAD_GUEST_TOKEN_SECRET = STRONG_UPLOAD_SECRET;
    process.env.S3_ACCESS_KEY_ID = 'prod-access-key';
    process.env.S3_SECRET_ACCESS_KEY = STRONG_S3_SECRET;

    const cfg = configuration();
    expect(cfg.jwt.secret).toBe(STRONG_JWT_SECRET);
    expect(cfg.upload.guestTokenSecret).toBe(STRONG_UPLOAD_SECRET);
    expect(cfg.s3.accessKeyId).toBe('prod-access-key');
  });
});
