import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { ApiErrorBody, isApiErrorBody } from '../errors/api-exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const raw = exception.getResponse();
    const code = this.resolveCode(status, raw);
    const message = this.resolveMessage(raw);
    const params = isApiErrorBody(raw) ? raw.params : undefined;

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(params ? { params } : {}),
    });
  }

  private resolveCode(status: number, raw: string | object): ApiErrorCode {
    if (isApiErrorBody(raw)) {
      return raw.code;
    }

    if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const message = (raw as { message?: string | string[] }).message;
      const text = Array.isArray(message) ? message.join(' ') : message;
      const mapped = this.mapMessageToCode(text);
      if (mapped) return mapped;
    }

    if (typeof raw === 'string') {
      const mapped = this.mapMessageToCode(raw);
      if (mapped) return mapped;
    }

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ApiErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ApiErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ApiErrorCode.NOT_FOUND;
      default:
        return ApiErrorCode.GENERIC;
    }
  }

  private mapMessageToCode(message?: string): ApiErrorCode | null {
    if (!message) return null;
    const normalized = message.toLowerCase();

    if (normalized.includes('email already registered') || normalized.includes('email already in use')) {
      return ApiErrorCode.EMAIL_ALREADY_REGISTERED;
    }
    if (normalized.includes('phone number already registered')) {
      return ApiErrorCode.PHONE_ALREADY_REGISTERED;
    }
    if (normalized.includes('invalid credentials')) {
      return ApiErrorCode.INVALID_CREDENTIALS;
    }
    if (normalized.includes('account is suspended')) {
      return ApiErrorCode.ACCOUNT_SUSPENDED;
    }
    if (normalized.includes('cutoff')) {
      return ApiErrorCode.SUBSCRIPTION_CUTOFF_PASSED;
    }

    return null;
  }

  private resolveMessage(raw: string | object): string | string[] {
    if (typeof raw === 'string') return raw;
    if (isApiErrorBody(raw)) return raw.message;
    if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const message = (raw as { message?: string | string[] }).message;
      return message ?? ApiErrorCode.GENERIC;
    }
    return ApiErrorCode.GENERIC;
  }
}
