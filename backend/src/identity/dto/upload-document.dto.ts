import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityDocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadIdentityDocumentDto {
  @ApiProperty({ enum: IdentityDocumentType })
  @IsEnum(IdentityDocumentType)
  documentType!: IdentityDocumentType;

  @ApiProperty({ description: 'Name exactly as printed on the document' })
  @IsString()
  @MinLength(2)
  declaredName!: string;
}

export class IdentityStatusResponseDto {
  @ApiProperty()
  identityVerified!: boolean;

  @ApiProperty()
  documentsCount!: number;

  @ApiProperty()
  verifiedCount!: number;

  @ApiProperty()
  canProceed!: boolean;

  @ApiPropertyOptional()
  registeredName?: string;
}
