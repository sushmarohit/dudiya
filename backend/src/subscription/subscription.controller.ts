import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionFrequency } from '@prisma/client';
import { formatDateKey, parseDateInput } from '../common/utils/date.util';
import { SubscriptionScheduleService } from './subscription-schedule.service';
import { PreviewScheduleDto } from './dto/preview-schedule.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private schedule: SubscriptionScheduleService) {}

  @Post('preview-schedule')
  previewSchedule(@Body() dto: PreviewScheduleDto) {
    const dates = this.schedule.getDeliveryDates(
      dto.frequency as SubscriptionFrequency,
      parseDateInput(dto.startDate),
      parseDateInput(dto.from),
      parseDateInput(dto.to),
    );
    return {
      frequency: dto.frequency,
      startDate: dto.startDate,
      from: dto.from,
      to: dto.to,
      dates: dates.map(formatDateKey),
      pausedDates: [] as string[],
    };
  }
}
