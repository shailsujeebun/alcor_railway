import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Marketplaces ────────────────────────────────────

  @Post('marketplaces')
  createMarketplace(@Body() body: { key: string; name: string }) {
    return this.adminService.createMarketplace(body);
  }

  @Get('marketplaces')
  getMarketplaces() {
    return this.adminService.getMarketplaces();
  }

  @Patch('marketplaces/:id')
  updateMarketplace(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; isActive?: boolean },
  ) {
    return this.adminService.updateMarketplace(id, body);
  }

  @Delete('marketplaces/:id')
  deleteMarketplace(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMarketplace(id);
  }

  // ─── Categories ──────────────────────────────────────

  @Post('categories')
  createCategory(
    @Body()
    body: {
      marketplaceId: number;
      name: string;
      slug: string;
      parentId?: number;
      sortOrder?: number;
      hasEngine?: boolean;
    },
  ) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      slug?: string;
      parentId?: number;
      sortOrder?: number;
      hasEngine?: boolean;
    },
  ) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Form Templates ──────────────────────────────────

  @Post('templates')
  createTemplate(
    @Body()
    body: {
      categoryId: number;
      name?: string;
      fields: any[];
      blockIds?: string[];
    },
  ) {
    return this.adminService.createTemplate(body);
  }

  @Get('templates')
  getTemplates() {
    return this.adminService.getTemplates();
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTemplate(id);
  }

  @Patch('templates/:id/status')
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleTemplateStatus(id, isActive);
  }

  @Get('templates/:id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fields: any[]; blockIds?: string[] },
  ) {
    return this.adminService.updateTemplate(id, body);
  }

  @Get('blocks')
  getBlocks() {
    return this.adminService.getBlocks();
  }

  @Post('blocks')
  createBlock(
    @Body() body: { name: string; fields: any[]; isSystem?: boolean },
  ) {
    return this.adminService.createBlock(body);
  }

  @Patch('blocks/:id')
  updateBlock(
    @Param('id') id: string,
    @Body() body: { name?: string; fields?: any[] },
  ) {
    return this.adminService.updateBlock(id, body);
  }

  @Delete('blocks/:id')
  deleteBlock(@Param('id') id: string) {
    return this.adminService.deleteBlock(id);
  }
}
