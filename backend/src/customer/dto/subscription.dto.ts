import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubscriptionFrequency } from '@prisma/client';

export class CreateCustomerSubscriptionDto {
  @ApiProperty()
  @IsString()
  distributorId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricingId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  quantity: number;

  @ApiProperty({ enum: SubscriptionFrequency })
  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency;

  @ApiProperty()
  @IsString()
  deliverySlotId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fatPercent?: number;
}

export class UpdateCustomerSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  quantity?: number;

  @ApiPropertyOptional({ enum: SubscriptionFrequency })
  @IsOptional()
  @IsEnum(SubscriptionFrequency)
  frequency?: SubscriptionFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliverySlotId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fatPercent?: number;
}
