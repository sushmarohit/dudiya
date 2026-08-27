import { ApiProperty } from '@nestjs/swagger';
import { BillAdjustmentType } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class BillAdjustmentDto {
  @ApiProperty({ enum: BillAdjustmentType })
  @IsEnum(BillAdjustmentType)
  type!: BillAdjustmentType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsString()
  reason!: string;
}
