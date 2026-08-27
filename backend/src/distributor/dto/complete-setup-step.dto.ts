import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const SETUP_STEPS = [
  'business_profile',
  'identity_documents',
  'products',
  'pricing',
  'delivery_slots',
  'readiness',
] as const;

export type SetupStep = typeof SETUP_STEPS[number];

export class CompleteSetupStepDto {
  @ApiProperty({ enum: SETUP_STEPS })
  @IsString()
  @IsIn(SETUP_STEPS)
  step: SetupStep;
}
