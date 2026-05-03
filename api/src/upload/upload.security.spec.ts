import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { UploadService } from './upload.service';

describe('UploadService security controls', () => {
  let service: UploadService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(() => {
    delete (globalThis as any).__uploadQuotaStore;
    delete (globalThis as any).__guestUploadTokenIssueStore;

    const configValues: Record<string, unknown> = {
      's3.endpoint': 'http://localhost:9000',
      's3.region': 'us-east-1',
      's3.accessKeyId': 'test-storage-id',
      's3.secretAccessKey': 'test-storage-value',
      's3.bucket': 'marketplace',
      's3.publicUrl': 'http://localhost:9000/marketplace',
      's3.publicReadAssets': false,
      'upload.guestTokenSecret': 'guest-token-value-very-strong-123',
      'upload.guestTokenTtlSeconds': 900,
      'upload.guestTokenRateLimitPerMinute': 2,
      'upload.requestLimitPerMinute': 2,
      'upload.filesLimitPerMinute': 10,
      'upload.bytesLimitPerMinute': 1024 * 1024,
      'jwt.secret': 'jwt-token-value-very-strong-123',
    };

    const configService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('guest-token'),
      verify: jest.fn(),
    };

    service = new UploadService(configService as any, jwtService as any);
  });

  it('rejects buffers that do not match allowed image signatures', () => {
    const mime = service.detectImageMime(Buffer.from('not-an-image'));
    expect(mime).toBeNull();
  });

  it('rejects guest upload tokens bound to a different client', () => {
    jwtService.verify.mockReturnValue({
      type: 'guest_upload',
      scope: 'upload_images',
      sub: '203.0.113.10',
      jti: 'token-1',
    });

    expect(() =>
      service.resolveUploadActor(undefined, 'guest-token', '198.51.100.20'),
    ).toThrow(UnauthorizedException);
  });

  it('rate-limits guest token issuance per client', () => {
    service.issueGuestUploadToken('203.0.113.10');
    service.issueGuestUploadToken('203.0.113.10');

    try {
      service.issueGuestUploadToken('203.0.113.10');
      fail('Expected guest token issuance to be rate-limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('rate-limits repeated upload requests by actor', () => {
    service.enforceUploadQuota('guest:203.0.113.10', 1, 256);
    service.enforceUploadQuota('guest:203.0.113.10', 1, 256);

    try {
      service.enforceUploadQuota('guest:203.0.113.10', 1, 256);
      fail('Expected upload quota rate limit to trigger');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });
});
