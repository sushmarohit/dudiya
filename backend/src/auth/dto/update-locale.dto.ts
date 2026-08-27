import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocaleDto {
  @ApiProperty({ enum: ['en', 'hi'] })
  @IsIn(['en', 'hi'])
  preferredLocale: 'en' | 'hi';
}
