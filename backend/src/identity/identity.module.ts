import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { OcrService } from './ocr.service';

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, OcrService],
  exports: [IdentityService],
})
export class IdentityModule {}
