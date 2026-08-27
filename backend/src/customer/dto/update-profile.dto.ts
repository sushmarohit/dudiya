import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { StructuredAddressDto } from '../../common/dto/structured-address.dto';

export class UpdateCustomerProfileDto extends StructuredAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['en', 'hi'] })
  @IsOptional()
  @IsIn(['en', 'hi'])
  preferredLocale?: 'en' | 'hi';
}
