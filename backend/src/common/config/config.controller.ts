import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { getPublicFeatureFlags } from './feature-flags';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  @Public()
  @Get('features')
  getFeatures() {
    return getPublicFeatureFlags();
  }
}
