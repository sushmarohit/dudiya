import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VoidBillDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}
