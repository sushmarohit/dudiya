import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSseHub } from './notification-sse.hub';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSseHub],
  exports: [NotificationService, NotificationSseHub],
})
export class NotificationModule {}
