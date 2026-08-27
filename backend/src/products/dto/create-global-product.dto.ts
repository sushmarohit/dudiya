import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory, MilkSpecies } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGlobalProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  sku: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiPropertyOptional({ enum: MilkSpecies })
  @IsOptional()
  @IsEnum(MilkSpecies)
  species?: MilkSpecies;

  @ApiPropertyOptional({ default: 'litre' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
