import {
  Controller,
  Get,
  Header,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { NotificationType, UserRole } from '@prisma/client';
import { Observable } from 'rxjs';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { NotificationService } from './notification.service';
import { NotificationSseHub } from './notification-sse.hub';

@ApiTags('notifications')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.CUSTOMER)
@Controller('notifications')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private sseHub: NotificationSseHub,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: NotificationType,
  ) {
    return this.notificationService.list(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      type,
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationService.unreadCount(user.id);
  }

  /**
   * Live notification stream (SSE).
   * Auth: same Bearer JWT as other endpoints (use fetch + stream; EventSource cannot set Authorization).
   * Existing REST unread-count polling remains supported as a fallback.
   */
  @SkipThrottle()
  @Sse('stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  async stream(@CurrentUser() user: AuthUser): Promise<Observable<MessageEvent>> {
    const initial = await this.notificationService.unreadCount(user.id);
    return this.sseHub.subscribe(user.id, initial);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationService.markRead(user.id, id);
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllRead(user.id);
  }
}
