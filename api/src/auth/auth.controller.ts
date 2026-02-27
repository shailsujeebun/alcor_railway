import {
  UnauthorizedException,
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  Headers,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

const REFRESH_TOKEN_COOKIE_NAME = 'alcor_refresh_token';
const CSRF_TOKEN_COOKIE_NAME = 'alcor_csrf_token';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.login(dto);
    this.setSessionCookies(
      response,
      authResult.refreshToken,
      authResult.refreshTokenExpiresAt,
    );

    return {
      user: authResult.user,
      accessToken: authResult.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request, csrfHeader);

    const refreshToken = this.getCookieValue(
      request.headers.cookie,
      REFRESH_TOKEN_COOKIE_NAME,
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const authResult = await this.authService.refreshTokens(refreshToken);
    this.setSessionCookies(
      response,
      authResult.refreshToken,
      authResult.refreshTokenExpiresAt,
    );

    return {
      user: authResult.user,
      accessToken: authResult.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request, csrfHeader);

    const refreshToken = this.getCookieValue(
      request.headers.cookie,
      REFRESH_TOKEN_COOKIE_NAME,
    );

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearSessionCookies(response);
    return { ok: true };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 8, ttl: 10 * 60_000 } })
  @HttpCode(200)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.verifyEmail(
      dto.email,
      dto.code,
      this.getClientKey(request),
    );
    this.setSessionCookies(
      response,
      authResult.refreshToken,
      authResult.refreshTokenExpiresAt,
    );

    return {
      user: authResult.user,
      accessToken: authResult.accessToken,
    };
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @HttpCode(200)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() request: Request,
  ) {
    return this.authService.resendVerificationCode(
      dto.email,
      this.getClientKey(request),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    const fullUser = await this.usersService.findById(user.id);
    return this.usersService.sanitize(fullUser);
  }

  private assertCsrfToken(request: Request, csrfHeader: string | undefined) {
    const csrfCookie = this.getCookieValue(
      request.headers.cookie,
      CSRF_TOKEN_COOKIE_NAME,
    );

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new UnauthorizedException('Invalid CSRF token');
    }
  }

  private setSessionCookies(
    response: Response,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
  ) {
    const maxAge = Math.max(refreshTokenExpiresAt.getTime() - Date.now(), 1);
    const secure = this.isSecureCookie();

    const refreshCookieOptions: CookieOptions = {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/auth',
      maxAge,
    };

    const csrfCookieOptions: CookieOptions = {
      httpOnly: false,
      secure,
      sameSite: 'strict',
      path: '/auth',
      maxAge,
    };

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshCookieOptions,
    );
    response.cookie(CSRF_TOKEN_COOKIE_NAME, randomUUID(), csrfCookieOptions);
  }

  private clearSessionCookies(response: Response) {
    const secure = this.isSecureCookie();
    const clearCookieOptions: CookieOptions = {
      secure,
      sameSite: 'strict',
      path: '/auth',
    };

    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...clearCookieOptions,
      httpOnly: true,
    });
    response.clearCookie(CSRF_TOKEN_COOKIE_NAME, clearCookieOptions);
  }

  private isSecureCookie() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private getCookieValue(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) {
      return undefined;
    }

    const encodedName = `${name}=`;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
      const cookie = part.trim();
      if (cookie.startsWith(encodedName)) {
        return decodeURIComponent(cookie.slice(encodedName.length));
      }
    }

    return undefined;
  }

  private getClientKey(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim().length > 0) {
      return realIp.trim();
    }

    return request.ip;
  }
}
