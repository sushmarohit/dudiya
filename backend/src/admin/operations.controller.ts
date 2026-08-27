import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { OperationsService } from './operations.service';
import { DeliveryService } from '../delivery/delivery.service';
import { UpdateDeliveryItemDto } from '../delivery/dto/delivery.dto';

@ApiTags('admin-operations')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/operations')
export class AdminOperationsController {
  constructor(
    private operationsService: OperationsService,
    private deliveryService: DeliveryService,
  ) {}

  @Get('deliveries')
  getDeliveries(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.operationsService.getDeliveryStats(from, to);
  }

  @Get('billing')
  getBilling() {
    return this.operationsService.getBillingStats();
  }

  @Get('exceptions')
  getExceptions() {
    return this.operationsService.getExceptions();
  }
}

@ApiTags('admin-delivery-items')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/delivery-items')
export class AdminDeliveryItemController {
  constructor(private deliveryService: DeliveryService) {}

  @Patch(':id/override')
  override(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryItemDto,
  ) {
    return this.deliveryService.adminOverrideItem(user.id, id, dto);
  }
}
