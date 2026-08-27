import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateGlobalProductDto } from './dto/create-global-product.dto';
import { UpdateGlobalProductDto } from './dto/update-global-product.dto';

@ApiTags('admin-products')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private catalog: CatalogService) {}

  @Get()
  list(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.listGlobalProducts(includeInactive === 'true');
  }

  @Get('distributor-submissions')
  listSubmissions() {
    return this.catalog.listDistributorSubmissions();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalog.getGlobalProduct(id);
  }

  @Post()
  create(@Body() dto: CreateGlobalProductDto) {
    return this.catalog.createGlobalProduct(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGlobalProductDto) {
    return this.catalog.updateGlobalProduct(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.catalog.deactivateGlobalProduct(id);
  }

  @Post(':id/promote')
  promote(@Param('id') id: string) {
    return this.catalog.promoteProduct(id);
  }

  @Post(':id/reject-promotion')
  rejectPromotion(@Param('id') id: string) {
    return this.catalog.rejectPromotion(id);
  }

  @Post(':id/keep-private')
  keepPrivate(@Param('id') id: string) {
    return this.catalog.keepPrivate(id);
  }
}
