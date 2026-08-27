import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SuspendDistributorDto {
  @ApiProperty()
  @IsBoolean()
  suspend: boolean;
}
