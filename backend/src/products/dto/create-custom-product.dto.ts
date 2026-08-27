import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory, MilkSpecies } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCustomProductDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;
}
