import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApprovalStatus, SubscriptionStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { AdminService } from './admin.service';
import { RejectDistributorDto } from './dto/reject-distributor.dto';
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

  @Get('distributors/pending')
  getPendingDistributors() {
    return this.adminService.getPendingDistributors();
  }

  @Post('distributors/:id/approve')
  approveDistributor(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.adminService.approveDistributor(id, user.id);
  }

  @Post('distributors/:id/reject')
  rejectDistributor(
    @Param('id') id: string,
    @Body() dto: RejectDistributorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.rejectDistributor(id, dto.reason, user.id);
  }

  @Get('distributors')
  listDistributors(
    @Query('status') status?: ApprovalStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listDistributors(status, search);
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
