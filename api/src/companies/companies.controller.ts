import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CreateCompanyReviewDto } from './dto/create-company-review.dto';
import { UpdateCompanyFlagsDto } from './dto/update-company-flags.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get()
  findAll(@Query() query: CompanyQueryDto) {
    return this.companiesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: { id: string; role: string }) {
    return this.companiesService.findMine(user.id, user.role);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.companiesService.update(id, dto, user.id, user.role);
  }

  @Post(':companyId/reviews')
  createReview(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCompanyReviewDto,
  ) {
    return this.companiesService.createReview(companyId, dto);
  }

  @Get(':companyId/reviews')
  findReviews(
    @Param('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.companiesService.findReviews(companyId, query);
  }

  @Delete(':companyId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  deleteReview(
    @Param('companyId') companyId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.companiesService.deleteReview(companyId, reviewId);
  }

  // ─── Admin Endpoints ─────────────────────────────

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  toggleVerified(@Param('id') id: string) {
    return this.companiesService.toggleVerified(id);
  }

  @Patch(':id/flags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  updateFlags(@Param('id') id: string, @Body() dto: UpdateCompanyFlagsDto) {
    return this.companiesService.updateFlags(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
