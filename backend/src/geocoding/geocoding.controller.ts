import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { StructuredAddressDto } from '../common/dto/structured-address.dto';
import { GeocodingService } from './geocoding.service';

@ApiTags('geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private geocoding: GeocodingService) {}

  @Public()
  @Post('resolve')
  resolve(@Body() dto: StructuredAddressDto) {
    return this.geocoding.resolveAddress(dto);
  }

  @Public()
  @Get('reverse')
  async reverse(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const formatted = await this.geocoding.reverseGeocode(latNum, lngNum);
    return { lat: latNum, lng: lngNum, formattedAddress: formatted };
  }
}
