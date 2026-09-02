import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { AdminService } from './admin.service';
import { SuspendDistributorDto } from './dto/suspend-distributor.dto';
import { UpdatePlatformSettingsDto } from './dto/update-settings.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard/kpis')
  getKpis() {
    return this.adminService.getKpis();
  }

  /** Legacy route — lists distributors without identity verification (not approval queue). */
  @Get('distributors/pending')
  getPendingDistributors() {
    return this.adminService.getPendingDistributors();
  }

  @Get('distributors')
  listDistributors(@Query('search') search?: string) {
    return this.adminService.listDistributors(search);
  }

  @Patch('distributors/:id/suspend')
  suspendDistributor(
    @Param('id') id: string,
    @Body() dto: SuspendDistributorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.suspendDistributor(id, dto.suspend, user.id);
  }

  @Get('customers')
  listCustomers() {
    return this.adminService.listCustomers();
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomer(id);
  }

  @Get('subscriptions')
  listSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('distributorId') distributorId?: string,
  ) {
    return this.adminService.listSubscriptions(status, distributorId);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.updateSettings(dto, user.id);
  }
}
