import { Global, Module } from '@nestjs/common';
import { ConfigController } from './config/config.controller';
import { AuditService } from './services/audit.service';
import { PhoneValidationService } from './services/phone-validation.service';

@Global()
@Module({
  controllers: [ConfigController],
  providers: [AuditService, PhoneValidationService],
  exports: [AuditService, PhoneValidationService],
})
export class CommonModule {}
