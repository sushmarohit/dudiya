import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { AddressType } from '@prisma/client';

export enum RegisterRoleDto {
  DISTRIBUTOR = 'distributor',
  CUSTOMER = 'customer',
}

export class RegisterDto {
  @ApiProperty({ enum: RegisterRoleDto })
  @IsEnum(RegisterRoleDto)
  role: RegisterRoleDto;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Required for distributor registration' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flatOrHouseNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingOrSociety?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetOrLane?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ enum: ['en', 'hi'] })
  @IsOptional()
  @IsIn(['en', 'hi'])
  preferredLocale?: 'en' | 'hi';
}
