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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { DistributorApprovedGuard } from '../common/guards/distributor-approved.guard';
import { DistributorService } from './distributor.service';
import { UpdateDistributorProfileDto } from './dto/update-profile.dto';
import { CompleteSetupStepDto } from './dto/complete-setup-step.dto';
import { UpdateProductsDto } from './dto/update-products.dto';
import { CreatePricingDto, UpdatePricingDto } from './dto/pricing.dto';
import {
  CreateDeliverySlotDto,
  UpdateDeliverySlotDto,
} from './dto/delivery-slot.dto';
import {
  CreateDistributorCustomerDto,
  UpdateDistributorCustomerDto,
} from './dto/customer.dto';
import {
  CreateDistributorSubscriptionDto,
  UpdateDistributorSubscriptionDto,
} from './dto/subscription.dto';
import { CreateCustomProductDto } from '../products/dto/create-custom-product.dto';
import { UpdateCustomProductDto } from '../products/dto/update-custom-product.dto';

@ApiTags('distributor')
@ApiBearerAuth()
@Roles(UserRole.DISTRIBUTOR)
@Controller('distributor')
export class DistributorController {
  constructor(private distributorService: DistributorService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.distributorService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateDistributorProfileDto) {
    return this.distributorService.updateProfile(user.id, dto);
  }

  @Post('setup/complete-step')
  completeSetupStep(@CurrentUser() user: AuthUser, @Body() dto: CompleteSetupStepDto) {
    return this.distributorService.completeSetupStep(user.id, dto.step);
  }

  @Post('go-live')
  @UseGuards(DistributorApprovedGuard)
  goLive(@CurrentUser() user: AuthUser) {
    return this.distributorService.goLive(user.id);
  }

  @Get('products')
  @UseGuards(DistributorApprovedGuard)
  getProducts(@CurrentUser() user: AuthUser) {
    return this.distributorService.getProducts(user.id);
  }

  @Patch('products')
  @UseGuards(DistributorApprovedGuard)
  updateProducts(@CurrentUser() user: AuthUser, @Body() dto: UpdateProductsDto) {
    return this.distributorService.updateProducts(user.id, dto.enabledProductIds, dto.enabled);
  }

  @Post('products/custom')
  @UseGuards(DistributorApprovedGuard)
  createCustomProduct(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomProductDto) {
    return this.distributorService.createCustomProduct(user.id, dto);
  }

  @Patch('products/custom/:id')
  @UseGuards(DistributorApprovedGuard)
  updateCustomProduct(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomProductDto,
  ) {
    return this.distributorService.updateCustomProduct(user.id, id, dto);
  }

  @Delete('products/custom/:id')
  @UseGuards(DistributorApprovedGuard)
  deactivateCustomProduct(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.distributorService.deactivateCustomProduct(user.id, id);
  }

  @Post('products/custom/:id/request-promotion')
  @UseGuards(DistributorApprovedGuard)
  requestCustomProductPromotion(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.distributorService.requestCustomProductPromotion(user.id, id);
  }

  @Get('pricing')
  @UseGuards(DistributorApprovedGuard)
  listPricing(@CurrentUser() user: AuthUser) {
    return this.distributorService.listPricing(user.id);
  }

  @Post('pricing')
  @UseGuards(DistributorApprovedGuard)
  createPricing(@CurrentUser() user: AuthUser, @Body() dto: CreatePricingDto) {
    return this.distributorService.createPricing(user.id, dto);
  }

  @Patch('pricing/:id')
  @UseGuards(DistributorApprovedGuard)
  updatePricing(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePricingDto,
  ) {
    return this.distributorService.updatePricing(user.id, id, dto);
  }

  @Get('delivery-slots')
  @UseGuards(DistributorApprovedGuard)
  listDeliverySlots(@CurrentUser() user: AuthUser) {
    return this.distributorService.listDeliverySlots(user.id);
  }

  @Post('delivery-slots')
  @UseGuards(DistributorApprovedGuard)
  createDeliverySlot(@CurrentUser() user: AuthUser, @Body() dto: CreateDeliverySlotDto) {
    return this.distributorService.createDeliverySlot(user.id, dto);
  }

  @Patch('delivery-slots/:id')
  @UseGuards(DistributorApprovedGuard)
  updateDeliverySlot(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliverySlotDto,
  ) {
    return this.distributorService.updateDeliverySlot(user.id, id, dto);
  }

  @Delete('delivery-slots/:id')
  @UseGuards(DistributorApprovedGuard)
  deleteDeliverySlot(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.distributorService.deleteDeliverySlot(user.id, id);
  }

  @Get('customers')
  @UseGuards(DistributorApprovedGuard)
  listCustomers(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.distributorService.listCustomers(user.id, search);
  }

  @Post('customers')
  @UseGuards(DistributorApprovedGuard)
  createCustomer(@CurrentUser() user: AuthUser, @Body() dto: CreateDistributorCustomerDto) {
    return this.distributorService.createCustomer(user.id, dto);
  }

  @Get('customers/:id')
  @UseGuards(DistributorApprovedGuard)
  getCustomer(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.distributorService.getCustomer(user.id, id);
  }

  @Patch('customers/:id')
  @UseGuards(DistributorApprovedGuard)
  updateCustomer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDistributorCustomerDto,
  ) {
    return this.distributorService.updateCustomer(user.id, id, dto);
  }

  @Get('subscriptions')
  @UseGuards(DistributorApprovedGuard)
  listSubscriptions(@CurrentUser() user: AuthUser) {
    return this.distributorService.listSubscriptions(user.id);
  }

  @Post('subscriptions')
  @UseGuards(DistributorApprovedGuard)
  createSubscription(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDistributorSubscriptionDto,
  ) {
    return this.distributorService.createSubscription(user.id, dto);
  }

  @Patch('subscriptions/:id')
  @UseGuards(DistributorApprovedGuard)
  updateSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDistributorSubscriptionDto,
  ) {
    return this.distributorService.updateSubscription(user.id, id, dto);
  }

  @Get('subscriptions/:id/preview')
  @UseGuards(DistributorApprovedGuard)
  previewSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.distributorService.previewSubscription(user.id, id, from, to);
  }
}
