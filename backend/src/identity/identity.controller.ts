import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { IdentityDocumentType, UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { IdentityService, UploadedFileLike } from './identity.service';
import { UploadIdentityDocumentDto } from './dto/upload-document.dto';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('identity')
export class IdentityController {
  constructor(private identityService: IdentityService) {}

  @Get('status')
  @Roles(UserRole.DISTRIBUTOR, UserRole.CUSTOMER)
  getStatus(@CurrentUser() user: AuthUser) {
    return this.identityService.getStatus(user.id);
  }

  @Get('documents')
  @Roles(UserRole.DISTRIBUTOR, UserRole.CUSTOMER)
  listDocuments(@CurrentUser() user: AuthUser) {
    return this.identityService.listDocuments(user.id);
  }

  @Post('documents')
  @Roles(UserRole.DISTRIBUTOR, UserRole.CUSTOMER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType', 'declaredName'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: {
          type: 'string',
          enum: Object.values(IdentityDocumentType),
        },
        declaredName: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedFileLike | undefined,
    @Body() dto: UploadIdentityDocumentDto,
  ) {
    return this.identityService.uploadDocument(
      user.id,
      file,
      dto.documentType,
      dto.declaredName,
    );
  }

  @Delete('documents/:id')
  @Roles(UserRole.DISTRIBUTOR, UserRole.CUSTOMER)
  deleteDocument(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.identityService.deleteDocument(user.id, id);
  }

  @Get('documents/:id/file')
  @Roles(UserRole.DISTRIBUTOR, UserRole.CUSTOMER, UserRole.ADMIN)
  async downloadFile(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const file = await this.identityService.getDocumentFile(
      user.id,
      id,
      isAdmin,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName.replace(/"/g, '')}"`,
    );
    res.status(HttpStatus.OK).send(file.buffer);
  }
}
