import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode } from './api-error-code.enum';

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  params?: Record<string, string | number>;
};

export class ApiException extends HttpException {
  constructor(
    code: ApiErrorCode,
    status: HttpStatus,
    params?: Record<string, string | number>,
  ) {
    const body: ApiErrorBody = {
      code,
      message: code,
      ...(params ? { params } : {}),
    };
    super(body, status);
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof (value as ApiErrorBody).code === 'string'
  );
}
