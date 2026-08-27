import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { DistributorApprovedGuard } from '../common/guards/distributor-approved.guard';
import { DeliveryService } from './delivery.service';
import {
  BulkDeliveryStatusDto,
  GenerateDeliveriesDto,
  ReorderDeliveryItemsDto,
  UpdateDeliveryItemDto,
} from './dto/delivery.dto';

@ApiTags('distributor-deliveries')
@ApiBearerAuth()
@Roles(UserRole.DISTRIBUTOR)
@Controller('distributor/deliveries')
@UseGuards(DistributorApprovedGuard)
export class DistributorDeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateDeliveriesDto) {
    return this.deliveryService.generate(user.id, dto.date, dto.slotId);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('slotId') slotId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.deliveryService.listForDistributor(user.id, {
      date,
      month,
      from,
      to,
      slotId,
      customerId,
    });
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('slotId') slotId?: string,
    @Query('customerId') customerId?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.deliveryService.exportCsv(user.id, {
      date,
      month,
      from,
      to,
      slotId,
      customerId,
    });
    const filenameParts = [
      'deliveries',
      date || month || (from && to ? `${from}_to_${to}` : 'export'),
      customerId ? `customer-${customerId.slice(0, 8)}` : 'all',
    ];
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenameParts.join('-')}.csv"`,
    );
    if (format === 'pdf') {
      res!.setHeader('Content-Type', 'text/plain');
      res!.send(csv);
      return;
    }
    res!.send(csv);
  }

  @Post('bulk-status')
  bulkStatus(@CurrentUser() user: AuthUser, @Body() dto: BulkDeliveryStatusDto) {
    return this.deliveryService.bulkStatus(user.id, dto);
  }
}

@ApiTags('distributor-delivery-items')
@ApiBearerAuth()
@Roles(UserRole.DISTRIBUTOR)
@Controller('distributor/delivery-items')
@UseGuards(DistributorApprovedGuard)
export class DistributorDeliveryItemController {
  constructor(private deliveryService: DeliveryService) {}

  @Patch('reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderDeliveryItemsDto) {
    return this.deliveryService.reorderItems(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryItemDto,
  ) {
    return this.deliveryService.updateItem(user.id, id, dto, UserRole.DISTRIBUTOR);
  }
}

@ApiTags('customer-deliveries')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller('customers/deliveries')
export class CustomerDeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.deliveryService.listForCustomer(user.id, from, to);
  }
}
