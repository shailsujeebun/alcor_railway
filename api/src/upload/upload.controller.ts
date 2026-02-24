import {
  BadRequestException,
  Controller,
  Header,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('guest-token')
  createGuestUploadToken(@Req() req: Request) {
    const clientKey = this.uploadService.getClientKeyFromHeaders(
      req.headers['x-forwarded-for'],
      req.headers['x-real-ip'] as string | undefined,
      req.ip,
    );
    return this.uploadService.issueGuestUploadToken(clientKey);
  }

  @Post('images')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Headers('authorization') authorizationHeader?: string,
    @Headers('x-upload-token') guestUploadToken?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const clientKey = this.uploadService.getClientKeyFromHeaders(
      req.headers['x-forwarded-for'],
      req.headers['x-real-ip'] as string | undefined,
      req.ip,
    );
    const actor = this.uploadService.resolveUploadActor(
      authorizationHeader,
      guestUploadToken,
      clientKey,
    );
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    this.uploadService.enforceUploadQuota(
      actor.actorKey,
      files.length,
      totalBytes,
    );

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        );
      }

      const detectedMime = this.uploadService.detectImageMime(file.buffer);
      if (
        !detectedMime ||
        !this.uploadService.isAllowedImageMime(detectedMime)
      ) {
        throw new BadRequestException(
          'Invalid file signature. Only JPEG, PNG, WEBP, GIF are allowed.',
        );
      }

      if (detectedMime !== file.mimetype) {
        throw new BadRequestException(
          `File signature (${detectedMime}) does not match declared content type (${file.mimetype})`,
        );
      }
    }

    const uploaded = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadFile(file, 'listings', file.mimetype),
      ),
    );

    // Return API-relative paths so clients can resolve against their API base URL.
    const urls = uploaded.map(({ key }) => `/upload/files/${key}`);

    return { urls };
  }

  @Get('files/:folder/:filename')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { body, contentType, contentLength } =
      await this.uploadService.getFileStream(folder, filename);

    res.setHeader('Content-Type', contentType);
    if (contentLength !== undefined) {
      res.setHeader('Content-Length', String(contentLength));
    }

    return new StreamableFile(body);
  }

  @Get('presigned')
  @UseGuards(JwtAuthGuard)
  getPresignedUrl(
    @Query('folder') folder?: string,
    @Query('contentType') contentType?: string,
  ) {
    return this.uploadService.getPresignedUrl(folder, contentType);
  }
}
