import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionFrequency } from '@prisma/client';
import { IsDateString, IsEnum } from 'class-validator';

export class PreviewScheduleDto {
  @ApiProperty({ enum: SubscriptionFrequency })
  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency;

  @ApiProperty({ example: '2026-06-16' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-16' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-07-16' })
  @IsDateString()
  to: string;
}
