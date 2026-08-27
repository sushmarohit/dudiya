import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillStatus, UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { DistributorApprovedGuard } from '../common/guards/distributor-approved.guard';
import { BillingService } from './billing.service';
import { UpdateBillingSettingsDto } from './dto/billing-settings.dto';
import { RunBillingCycleDto } from './dto/billing-settings.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { BillAdjustmentDto } from './dto/bill-adjustment.dto';
import { VoidBillDto } from './dto/void-bill.dto';

@ApiTags('distributor-billing')
@ApiBearerAuth()
@Roles(UserRole.DISTRIBUTOR)
@Controller('distributor')
@UseGuards(DistributorApprovedGuard)
export class DistributorBillingController {
  constructor(private billingService: BillingService) {}

  @Get('billing/settings')
  getSettings(@CurrentUser() user: AuthUser) {
    return this.billingService.getSettings(user.id);
  }

  @Patch('billing/settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateBillingSettingsDto,
  ) {
    return this.billingService.updateSettings(user.id, dto);
  }

  @Post('billing/run-cycle')
  runCycle(@CurrentUser() user: AuthUser, @Body() dto: RunBillingCycleDto) {
    return this.billingService.runCycle(user.id, dto.referenceDate);
  }

  @Get('billing/dues')
  getDues(@CurrentUser() user: AuthUser) {
    return this.billingService.getDues(user.id);
  }

  @Get('bills')
  listBills(
    @CurrentUser() user: AuthUser,
    @Query('customerId') customerId?: string,
    @Query('status') status?: BillStatus,
  ) {
    return this.billingService.listBills(user.id, { customerId, status });
  }

  @Get('bills/:id')
  getBill(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billingService.getBill(user.id, id);
  }

  @Get('bills/:id/pdf')
  async getBillPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.billingService.generateBillPdf(id, user.id, 'distributor');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${id}.pdf"`);
    res.send(pdf);
  }

  @Post('bills/:id/payments')
  recordPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(user.id, id, dto);
  }

  @Post('bills/:id/adjustments')
  addAdjustment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: BillAdjustmentDto,
  ) {
    return this.billingService.addAdjustment(user.id, id, dto);
  }

  @Post('bills/:id/void')
  voidBill(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VoidBillDto,
  ) {
    return this.billingService.voidBill(user.id, id, dto);
  }
}

@ApiTags('customer-bills')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller('customers/bills')
export class CustomerBillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.billingService.listCustomerBills(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billingService.getCustomerBill(user.id, id);
  }

  @Get(':id/pdf')
  async pdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.billingService.generateBillPdf(id, user.id, 'customer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${id}.pdf"`);
    res.send(pdf);
  }
}
