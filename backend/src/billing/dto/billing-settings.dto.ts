import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateBillingSettingsDto {
  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  biWeeklyAnchorDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  billingDueDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class RunBillingCycleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceDate?: string;
}
