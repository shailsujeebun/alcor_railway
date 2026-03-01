import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly verificationAttemptLimit = 5;
  private readonly verificationAttemptWindowSeconds = 15 * 60;
  private readonly verificationResendCooldownSeconds = 60;
  private readonly verificationResendIpCooldownSeconds = 60;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    this.ensurePasswordStrength(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.createAndLogVerificationCode(user.id, user.email);

    return { message: 'Verification code sent' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Account is blocked');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.sanitize(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = await this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(session.userId);
    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Account is blocked');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: this.usersService.sanitize(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = await this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return { ok: true };
    }

    const token = randomUUID();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(`Password reset token issued for userId=${user.id}`);
    await this.mailService.sendPasswordReset(email, token);

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = await this.hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    this.ensurePasswordStrength(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      // Revoke all active sessions on password reset
      this.prisma.session.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    this.ensurePasswordStrength(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Revoke all active sessions. User should sign in again.
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async verifyEmail(email: string, code: string, clientKey?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedClientKey = this.normalizeClientKey(clientKey);

    await this.assertVerificationAttemptsAllowed(
      normalizedEmail,
      normalizedClientKey,
    );

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      const counters = await this.recordVerificationFailure(
        normalizedEmail,
        normalizedClientKey,
      );
      if (this.isVerificationLimitExceeded(counters)) {
        throw new HttpException(
          'Too many verification attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException('Invalid verification code');
    }

    if (user.emailVerified) {
      await this.clearVerificationFailureState(
        normalizedEmail,
        normalizedClientKey,
      );
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return { user: this.usersService.sanitize(user), ...tokens };
    }

    const codeHash = await this.hashToken(code);

    const verificationCode = await this.prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      const counters = await this.recordVerificationFailure(
        normalizedEmail,
        normalizedClientKey,
      );
      if (this.isVerificationLimitExceeded(counters)) {
        throw new HttpException(
          'Too many verification attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: verificationCode.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    const updatedUser = await this.usersService.findById(user.id);
    await this.clearVerificationFailureState(
      normalizedEmail,
      normalizedClientKey,
    );
    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );
    return { user: this.usersService.sanitize(updatedUser), ...tokens };
  }

  async resendVerificationCode(email: string, clientKey?: string) {
    const normalizedClientKey = this.normalizeClientKey(clientKey);
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerified) {
      return { ok: true };
    }

    await this.assertResendVerificationAllowed(user.id, normalizedClientKey);
    await this.createAndLogVerificationCode(user.id, user.email);
    await this.markVerificationResend(user.id, normalizedClientKey);
    return { ok: true };
  }

  private async createAndLogVerificationCode(userId: string, email: string) {
    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');

    const codeHash = await this.hashToken(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.emailVerificationCode.create({
      data: { userId, codeHash, expiresAt },
    });

    this.logger.log(`Email verification code issued for userId=${userId}`);
    await this.mailService.sendVerificationCode(email, code);
  }

  private ensurePasswordStrength(password: string) {
    const checks = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
      password.length >= 10,
    ];

    if (checks.some((check) => !check)) {
      throw new BadRequestException(
        'Password must be at least 10 characters and include uppercase, lowercase, number, and special character.',
      );
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeClientKey(clientKey: string | undefined) {
    if (!clientKey) return null;
    const normalized = clientKey.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private toRedisKeySegment(value: string) {
    return value.replace(/[^a-z0-9]/g, '_');
  }

  private getVerificationAttemptUserKey(normalizedEmail: string) {
    return `auth:verify:attempt:user:${this.toRedisKeySegment(normalizedEmail)}`;
  }

  private getVerificationAttemptIpKey(normalizedClientKey: string) {
    return `auth:verify:attempt:ip:${this.toRedisKeySegment(normalizedClientKey)}`;
  }

  private getVerificationResendUserKey(userId: string) {
    return `auth:verify:resend:user:${userId}`;
  }

  private getVerificationResendIpKey(normalizedClientKey: string) {
    return `auth:verify:resend:ip:${this.toRedisKeySegment(normalizedClientKey)}`;
  }

  private async assertVerificationAttemptsAllowed(
    normalizedEmail: string,
    normalizedClientKey: string | null,
  ) {
    const keys = [this.getVerificationAttemptUserKey(normalizedEmail)];
    if (normalizedClientKey) {
      keys.push(this.getVerificationAttemptIpKey(normalizedClientKey));
    }

    const values = await Promise.all(
      keys.map((key) => this.redisService.get(key)),
    );
    const maxAttempts = values.reduce((currentMax, value) => {
      const parsed = parseInt(value ?? '0', 10);
      return Number.isFinite(parsed)
        ? Math.max(currentMax, parsed)
        : currentMax;
    }, 0);

    if (maxAttempts >= this.verificationAttemptLimit) {
      throw new HttpException(
        'Too many verification attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordVerificationFailure(
    normalizedEmail: string,
    normalizedClientKey: string | null,
  ) {
    const userAttempts = await this.incrementCounter(
      this.getVerificationAttemptUserKey(normalizedEmail),
      this.verificationAttemptWindowSeconds,
    );

    let ipAttempts = 0;
    if (normalizedClientKey) {
      ipAttempts = await this.incrementCounter(
        this.getVerificationAttemptIpKey(normalizedClientKey),
        this.verificationAttemptWindowSeconds,
      );
    }

    return { userAttempts, ipAttempts };
  }

  private async clearVerificationFailureState(
    normalizedEmail: string,
    normalizedClientKey: string | null,
  ) {
    const keys = [this.getVerificationAttemptUserKey(normalizedEmail)];
    if (normalizedClientKey) {
      keys.push(this.getVerificationAttemptIpKey(normalizedClientKey));
    }

    await Promise.all(keys.map((key) => this.redisService.del(key)));
  }

  private isVerificationLimitExceeded(counters: {
    userAttempts: number;
    ipAttempts: number;
  }) {
    return (
      counters.userAttempts >= this.verificationAttemptLimit ||
      counters.ipAttempts >= this.verificationAttemptLimit
    );
  }

  private async assertResendVerificationAllowed(
    userId: string,
    normalizedClientKey: string | null,
  ) {
    const userCooldownKey = this.getVerificationResendUserKey(userId);
    const userTtl = await this.redisService.ttl(userCooldownKey);

    let ipTtl = -1;
    if (normalizedClientKey) {
      ipTtl = await this.redisService.ttl(
        this.getVerificationResendIpKey(normalizedClientKey),
      );
    }

    const retryAfterSeconds = Math.max(userTtl, ipTtl);
    if (retryAfterSeconds > 0) {
      throw new HttpException(
        `Verification code resend is on cooldown. Try again in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async markVerificationResend(
    userId: string,
    normalizedClientKey: string | null,
  ) {
    await this.redisService.set(
      this.getVerificationResendUserKey(userId),
      '1',
      this.verificationResendCooldownSeconds,
    );

    if (normalizedClientKey) {
      await this.redisService.set(
        this.getVerificationResendIpKey(normalizedClientKey),
        '1',
        this.verificationResendIpCooldownSeconds,
      );
    }
  }

  private async incrementCounter(key: string, ttlSeconds: number) {
    const value = await this.redisService.incr(key);
    if (value === 1) {
      await this.redisService.expire(key, ttlSeconds);
    }
    return value;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload as any, {
      expiresIn: this.configService.get<string>('jwt.expiresIn')! as any,
    });

    const refreshToken = randomUUID();
    const refreshTokenHash = await this.hashToken(refreshToken);
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    )!;
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }

  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7d

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
