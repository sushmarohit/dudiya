import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api-exception';
import { ApiErrorCode } from './api-error-code.enum';

export function throwApi(
  code: ApiErrorCode,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  params?: Record<string, string | number>,
): never {
  throw new ApiException(code, status, params);
}
