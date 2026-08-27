import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class UpdateProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  enabledProductIds: string[];

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
