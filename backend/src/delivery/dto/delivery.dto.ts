import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryItemStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDeliveryItemDto {
  @ApiPropertyOptional({ enum: DeliveryItemStatus })
  @IsOptional()
  @IsEnum(DeliveryItemStatus)
  status?: DeliveryItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveredQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateDeliveriesDto {
  @ApiProperty()
  @IsString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slotId?: string;
}

export class ReorderDeliveryItemsDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  items!: { id: string; routeOrder: number }[];
}

export class BulkDeliveryStatusDto {
  @ApiProperty()
  @IsString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slotId?: string;

  @ApiProperty({ enum: DeliveryItemStatus })
  @IsEnum(DeliveryItemStatus)
  status!: DeliveryItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class JourneyActionDto {
  @ApiProperty()
  @IsString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slotId?: string;
}
