import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { PhoneValidationService } from './services/phone-validation.service';

@Global()
@Module({
  providers: [AuditService, PhoneValidationService],
  exports: [AuditService, PhoneValidationService],
})
export class CommonModule {}
