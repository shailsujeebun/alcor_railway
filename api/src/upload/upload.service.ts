import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

const RATE_WINDOW_MS = 60_000;
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
const ALLOWED_FOLDERS = new Set(['images', 'listings', 'companies']);

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
type UploadQuotaEntry = {
  windowStart: number;
  requests: number;
  files: number;
  bytes: number;
};
type GuestTokenIssueEntry = {
  windowStart: number;
  count: number;
};
type GuestUploadTokenPayload = {
  type: 'guest_upload';
  sub: string;
  scope: 'upload_images';
  jti: string;
};

const MIME_TO_EXTENSION: Record<AllowedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;
  private guestTokenSecret: string;
  private guestTokenTtlSeconds: number;
  private guestTokenRateLimitPerMinute: number;
  private requestLimitPerMinute: number;
  private filesLimitPerMinute: number;
  private bytesLimitPerMinute: number;
  private publicReadAssets: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const endpoint = this.configService.get<string>('s3.endpoint')!;
    const region = this.configService.get<string>('s3.region')!;
    const accessKeyId = this.configService.get<string>('s3.accessKeyId')!;
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey')!;

    this.bucket = this.configService.get<string>('s3.bucket')!;
    this.publicUrl = this.configService.get<string>('s3.publicUrl')!;
    this.publicReadAssets =
      this.configService.get<boolean>('s3.publicReadAssets') ?? true;
    this.guestTokenSecret = this.configService.get<string>(
      'upload.guestTokenSecret',
    )!;
    this.guestTokenTtlSeconds =
      this.configService.get<number>('upload.guestTokenTtlSeconds') ?? 900;
    this.guestTokenRateLimitPerMinute =
      this.configService.get<number>('upload.guestTokenRateLimitPerMinute') ??
      10;
    this.requestLimitPerMinute =
      this.configService.get<number>('upload.requestLimitPerMinute') ?? 15;
    this.filesLimitPerMinute =
      this.configService.get<number>('upload.filesLimitPerMinute') ?? 40;
    this.bytesLimitPerMinute =
      this.configService.get<number>('upload.bytesLimitPerMinute') ??
      80 * 1024 * 1024;

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch {
      this.logger.log(`Creating bucket "${this.bucket}"...`);
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created`);
      } catch (err) {
        this.logger.warn(
          `Could not create bucket: ${err}. Will retry on first upload.`,
        );
      }
    }

    if (!this.publicReadAssets) {
      this.logger.log(
        `Bucket "${this.bucket}" public-read policy is disabled by configuration`,
      );
      return;
    }

    // Enable public read access only when explicitly configured.
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.s3.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify(policy),
        }),
      );
      this.logger.log(`Bucket "${this.bucket}" policy set to public-read`);
    } catch (err) {
      this.logger.warn(`Could not set public policy: ${err}`);
    }
  }

  getClientKeyFromHeaders(
    forwardedFor?: string | string[],
    realIp?: string,
    fallbackIp?: string,
  ): string {
    let forwarded: string | undefined;
    if (Array.isArray(forwardedFor)) {
      forwarded = forwardedFor[0];
    } else {
      forwarded = forwardedFor;
    }
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim();
      if (first) return first;
    }
    const real = realIp?.trim();
    if (real) return real;
    const fallback = fallbackIp?.trim();
    if (fallback) return fallback;
    return 'anonymous';
  }

  issueGuestUploadToken(clientKey: string) {
    const normalizedClientKey = this.normalizeClientKey(clientKey);
    const store = this.getGuestTokenIssueStore();
    const entry = store.get(normalizedClientKey);
    const now = Date.now();

    if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
      store.set(normalizedClientKey, { windowStart: now, count: 1 });
    } else {
      if (entry.count >= this.guestTokenRateLimitPerMinute) {
        throw new HttpException(
          'Too many guest upload token requests. Please try again shortly.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      entry.count += 1;
      store.set(normalizedClientKey, entry);
    }

    const expiresIn = Math.max(60, this.guestTokenTtlSeconds);
    const payload: GuestUploadTokenPayload = {
      type: 'guest_upload',
      sub: normalizedClientKey,
      scope: 'upload_images',
      jti: randomUUID(),
    };

    const token = this.jwtService.sign(payload, {
      secret: this.guestTokenSecret,
      expiresIn,
    });

    return { token, expiresIn };
  }

  resolveUploadActor(
    authorizationHeader: string | undefined,
    guestUploadToken: string | undefined,
    clientKey: string,
  ) {
    const normalizedClientKey = this.normalizeClientKey(clientKey);
    const bearerToken = this.parseBearerToken(authorizationHeader);

    if (bearerToken) {
      try {
        const payload = this.jwtService.verify<{ sub?: string }>(bearerToken, {
          secret: this.configService.get<string>('jwt.secret')!,
        });

        if (!payload.sub) {
          throw new UnauthorizedException('Invalid access token');
        }

        return {
          actorKey: `user:${payload.sub}`,
          actorType: 'user' as const,
        };
      } catch {
        throw new UnauthorizedException('Invalid access token');
      }
    }

    if (guestUploadToken) {
      try {
        const payload = this.jwtService.verify<GuestUploadTokenPayload>(
          guestUploadToken,
          {
            secret: this.guestTokenSecret,
          },
        );

        if (
          payload.type !== 'guest_upload' ||
          payload.scope !== 'upload_images'
        ) {
          throw new UnauthorizedException('Invalid upload token');
        }

        if (payload.sub !== normalizedClientKey) {
          throw new UnauthorizedException(
            'Upload token is not valid for this client',
          );
        }

        return {
          actorKey: `guest:${payload.sub}`,
          actorType: 'guest' as const,
        };
      } catch {
        throw new UnauthorizedException('Invalid upload token');
      }
    }

    throw new UnauthorizedException(
      'Authentication is required for direct uploads',
    );
  }

  enforceUploadQuota(actorKey: string, filesCount: number, bytesCount: number) {
    const safeFilesCount = Math.max(0, filesCount);
    const safeBytesCount = Math.max(0, bytesCount);
    const store = this.getUploadQuotaStore();
    const now = Date.now();
    const entry = store.get(actorKey);

    if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
      store.set(actorKey, {
        windowStart: now,
        requests: 1,
        files: safeFilesCount,
        bytes: safeBytesCount,
      });
      return;
    }

    if (entry.requests + 1 > this.requestLimitPerMinute) {
      throw new HttpException(
        'Upload request rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (entry.files + safeFilesCount > this.filesLimitPerMinute) {
      throw new HttpException(
        'Upload file quota exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (entry.bytes + safeBytesCount > this.bytesLimitPerMinute) {
      throw new HttpException(
        'Upload bandwidth quota exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.requests += 1;
    entry.files += safeFilesCount;
    entry.bytes += safeBytesCount;
    store.set(actorKey, entry);
  }

  isAllowedImageMime(mime: string): mime is AllowedImageMimeType {
    return ALLOWED_IMAGE_MIME_TYPES.includes(mime as AllowedImageMimeType);
  }

  detectImageMime(buffer: Buffer): AllowedImageMimeType | null {
    if (buffer.length < 4) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    // GIF87a / GIF89a
    if (buffer.length >= 6) {
      const gifHeader = buffer.subarray(0, 6).toString('ascii');
      if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
        return 'image/gif';
      }
    }

    // WEBP: RIFF....WEBP
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    return null;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'images',
    detectedMimeType?: string,
  ): Promise<{ key: string; url: string }> {
    const safeFolder = this.sanitizeFolder(folder);
    const mimeType = detectedMimeType
      ? this.normalizeImageMime(detectedMimeType)
      : this.detectImageMime(file.buffer);

    if (!mimeType) {
      throw new BadRequestException('Unsupported file signature');
    }

    const key = `${safeFolder}/${randomUUID()}.${this.getExtensionForMime(mimeType)}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: mimeType,
      }),
    );

    return {
      key,
      url: `${this.publicUrl}/${key}`,
    };
  }

  async deleteFile(url: string): Promise<void> {
    const key = url.replace(`${this.publicUrl}/`, '');
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getPresignedUrl(
    folder: string = 'images',
    contentType: string = 'image/jpeg',
  ) {
    const safeFolder = this.sanitizeFolder(folder);
    const safeContentType = this.normalizeImageMime(contentType);
    const key = `${safeFolder}/${randomUUID()}.${this.getExtensionForMime(safeContentType)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: safeContentType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return {
      uploadUrl: url,
      key,
      publicUrl: `${this.publicUrl}/${key}`,
    };
  }

  async getFileStream(folder: string, filename: string) {
    const safeFolder = this.sanitizeFolder(folder);
    const safeFilename = filename.trim();

    if (!/^[A-Za-z0-9._-]+$/.test(safeFilename)) {
      throw new BadRequestException('Invalid file name');
    }

    const key = `${safeFolder}/${safeFilename}`;
    let response;
    try {
      response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error: unknown) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        '$metadata' in error &&
        typeof (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 'number'
          ? (error as { $metadata: { httpStatusCode: number } }).$metadata
              .httpStatusCode
          : undefined;
      const code =
        typeof error === 'object' && error !== null && 'Code' in error
          ? String((error as { Code?: unknown }).Code)
          : '';
      if (statusCode === 404 || code === 'NoSuchKey') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }

    if (!response.Body) {
      throw new BadRequestException('File not found');
    }

    return {
      body: response.Body as Readable,
      contentType: response.ContentType ?? 'application/octet-stream',
      contentLength: response.ContentLength ?? undefined,
    };
  }

  private parseBearerToken(authorizationHeader: string | undefined) {
    if (!authorizationHeader) return null;
    const prefix = 'bearer ';
    if (!authorizationHeader.toLowerCase().startsWith(prefix)) return null;
    const token = authorizationHeader.slice(prefix.length).trim();
    return token || null;
  }

  private sanitizeFolder(folder: string) {
    const normalized = folder
      .trim()
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');

    if (!ALLOWED_FOLDERS.has(normalized)) {
      throw new BadRequestException('Invalid upload folder');
    }

    return normalized;
  }

  private normalizeImageMime(contentType: string) {
    const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
    if (!this.isAllowedImageMime(normalized)) {
      throw new BadRequestException('Invalid content type for image upload');
    }
    return normalized;
  }

  private getExtensionForMime(mimeType: AllowedImageMimeType) {
    return MIME_TO_EXTENSION[mimeType];
  }

  private normalizeClientKey(clientKey: string) {
    return clientKey.trim().toLowerCase() || 'anonymous';
  }

  private getUploadQuotaStore() {
    const globalRef = globalThis as typeof globalThis & {
      __uploadQuotaStore?: Map<string, UploadQuotaEntry>;
    };

    if (!globalRef.__uploadQuotaStore) {
      globalRef.__uploadQuotaStore = new Map<string, UploadQuotaEntry>();
    }

    return globalRef.__uploadQuotaStore;
  }

  private getGuestTokenIssueStore() {
    const globalRef = globalThis as typeof globalThis & {
      __guestUploadTokenIssueStore?: Map<string, GuestTokenIssueEntry>;
    };

    if (!globalRef.__guestUploadTokenIssueStore) {
      globalRef.__guestUploadTokenIssueStore = new Map<
        string,
        GuestTokenIssueEntry
      >();
    }

    return globalRef.__guestUploadTokenIssueStore;
  }
}
