import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { CustomerService } from './customer.service';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';
import {
  CreateCustomerSubscriptionDto,
  UpdateCustomerSubscriptionDto,
} from './dto/subscription.dto';
import { PauseSubscriptionDto } from './dto/pause.dto';
import { ExtraSubscriptionDto } from './dto/extra.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.customerService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateProfile(user.id, dto);
  }

  @Get('distributors/nearby')
  findNearby(
    @CurrentUser() user: AuthUser,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm: string,
    @Query('page') page?: string,
  ) {
    return this.customerService.findNearbyDistributors(
      user.id,
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radiusKm),
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('distributors/:id')
  getDistributor(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.getDistributorDetail(user.id, id);
  }

  @Get('subscriptions')
  listSubscriptions(@CurrentUser() user: AuthUser) {
    return this.customerService.listSubscriptions(user.id);
  }

  @Post('subscriptions')
  createSubscription(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCustomerSubscriptionDto,
  ) {
    return this.customerService.createSubscription(user.id, dto);
  }

  @Get('subscriptions/:id')
  getSubscription(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.getSubscription(user.id, id);
  }

  @Patch('subscriptions/:id')
  updateSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerSubscriptionDto,
  ) {
    return this.customerService.updateSubscription(user.id, id, dto);
  }

  @Get('subscriptions/:id/preview')
  previewSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.customerService.previewSubscription(user.id, id, from, to);
  }

  @Post('subscriptions/:id/end-request')
  requestEnd(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    return this.customerService.requestSubscriptionEnd(user.id, id, dto.reason);
  }

  @Post('subscriptions/:id/end-confirm')
  confirmEnd(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.confirmSubscriptionEnd(user.id, id);
  }

  @Post('subscriptions/:id/end-reject')
  rejectEnd(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.rejectSubscriptionEnd(user.id, id);
  }

  @Get('subscriptions/:id/end-status')
  endStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.getSubscriptionEndStatus(user.id, id);
  }

  @Post('subscriptions/:id/pause')
  pauseSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PauseSubscriptionDto,
  ) {
    return this.customerService.pauseSubscription(
      user.id,
      id,
      dto.startDate,
      dto.endDate,
    );
  }

  @Post('subscriptions/:id/extra')
  extraSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ExtraSubscriptionDto,
  ) {
    return this.customerService.extraSubscription(
      user.id,
      id,
      dto.date,
      dto.extraQuantity,
    );
  }

  @Get('subscriptions/:id/pauses')
  listPauses(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.listPauses(user.id, id);
  }

  @Get('subscriptions/:id/extras')
  listExtras(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customerService.listExtras(user.id, id);
  }
}
