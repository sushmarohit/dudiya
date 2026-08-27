import { HttpStatus, Injectable } from '@nestjs/common';
import {
  IdentityDocumentStatus,
  IdentityDocumentType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { defaultNameMatcher } from './name-matcher';

const MAX_DOCUMENTS = 2;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class IdentityService {
  private readonly uploadsRoot = path.resolve(
    process.cwd(),
    'uploads',
    'identity',
  );

  constructor(private prisma: PrismaService) {}

  private async ensureUserDir(userId: string) {
    const dir = path.join(this.uploadsRoot, userId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private async getRegisteredName(userId: string): Promise<{
    role: UserRole;
    registeredName: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { distributorProfile: true },
    });
    if (!user) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (user.status === UserStatus.SUSPENDED) {
      throwApi(ApiErrorCode.ACCOUNT_SUSPENDED, HttpStatus.FORBIDDEN);
    }

    if (user.role === UserRole.DISTRIBUTOR) {
      const ownerName = user.distributorProfile?.ownerName?.trim();
      return {
        role: user.role,
        registeredName: ownerName || user.name,
      };
    }

    return { role: user.role, registeredName: user.name };
  }

  private async syncIdentityVerified(userId: string, role: UserRole) {
    const verifiedCount = await this.prisma.identityDocument.count({
      where: { userId, status: IdentityDocumentStatus.VERIFIED },
    });
    const identityVerified = verifiedCount > 0;

    if (role === UserRole.DISTRIBUTOR) {
      await this.prisma.distributorProfile.updateMany({
        where: { userId },
        data: { identityVerified },
      });
    } else if (role === UserRole.CUSTOMER) {
      await this.prisma.customerProfile.updateMany({
        where: { userId },
        data: { identityVerified },
      });
    }

    return identityVerified;
  }

  async getStatus(userId: string) {
    const { role, registeredName } = await this.getRegisteredName(userId);
    const documents = await this.prisma.identityDocument.findMany({
      where: { userId },
      select: { status: true },
    });
    const verifiedCount = documents.filter(
      (d) => d.status === IdentityDocumentStatus.VERIFIED,
    ).length;
    const identityVerified = verifiedCount > 0;

    // Keep derived flag in sync even if only status is polled
    if (role === UserRole.DISTRIBUTOR || role === UserRole.CUSTOMER) {
      await this.syncIdentityVerified(userId, role);
    }

    return {
      identityVerified,
      documentsCount: documents.length,
      verifiedCount,
      canProceed: identityVerified,
      registeredName,
    };
  }

  async listDocuments(userId: string) {
    const docs = await this.prisma.identityDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        documentType: true,
        mimeType: true,
        originalName: true,
        declaredName: true,
        matchedAgainst: true,
        status: true,
        declineReason: true,
        createdAt: true,
      },
    });
    return docs;
  }

  async uploadDocument(
    userId: string,
    file: UploadedFileLike | undefined,
    documentType: IdentityDocumentType,
    declaredName: string,
  ) {
    if (!file?.buffer?.length) {
      throwApi(ApiErrorCode.IDENTITY_DOCUMENT_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throwApi(
        ApiErrorCode.IDENTITY_DOCUMENT_INVALID_TYPE,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      throwApi(ApiErrorCode.IDENTITY_DOCUMENT_TOO_LARGE, HttpStatus.BAD_REQUEST);
    }

    const existingCount = await this.prisma.identityDocument.count({
      where: { userId },
    });
    if (existingCount >= MAX_DOCUMENTS) {
      throwApi(ApiErrorCode.IDENTITY_DOCUMENT_LIMIT, HttpStatus.BAD_REQUEST);
    }

    const { role, registeredName } = await this.getRegisteredName(userId);
    if (role !== UserRole.DISTRIBUTOR && role !== UserRole.CUSTOMER) {
      throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const match = defaultNameMatcher.match(declaredName, registeredName);
    const status = match.matched
      ? IdentityDocumentStatus.VERIFIED
      : IdentityDocumentStatus.DECLINED;
    const declineReason = match.matched
      ? null
      : 'Registered name does not match the name on the document';

    const dir = await this.ensureUserDir(userId);
    const ext =
      file.mimetype === 'application/pdf'
        ? '.pdf'
        : file.mimetype === 'image/png'
          ? '.png'
          : '.jpg';
    const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const filename = `${randomUUID()}-${hash}${ext}`;
    const absolutePath = path.join(dir, filename);
    await fs.writeFile(absolutePath, file.buffer);

    const relativePath = path.join('uploads', 'identity', userId, filename);

    const doc = await this.prisma.identityDocument.create({
      data: {
        userId,
        documentType,
        filePath: relativePath,
        mimeType: file.mimetype,
        originalName: file.originalname?.slice(0, 255) || null,
        declaredName: declaredName.trim(),
        matchedAgainst: registeredName,
        status,
        declineReason,
      },
      select: {
        id: true,
        documentType: true,
        mimeType: true,
        originalName: true,
        declaredName: true,
        matchedAgainst: true,
        status: true,
        declineReason: true,
        createdAt: true,
      },
    });

    await this.syncIdentityVerified(userId, role);

    return doc;
  }

  async deleteDocument(userId: string, documentId: string) {
    const doc = await this.prisma.identityDocument.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) {
      throwApi(ApiErrorCode.IDENTITY_DOCUMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const { role } = await this.getRegisteredName(userId);

    await this.prisma.identityDocument.delete({ where: { id: doc.id } });

    try {
      const absolute = path.resolve(process.cwd(), doc.filePath);
      await fs.unlink(absolute);
    } catch {
      // file may already be missing
    }

    await this.syncIdentityVerified(userId, role);
    return { deleted: true };
  }

  async getDocumentFile(userId: string, documentId: string, isAdmin = false) {
    const doc = await this.prisma.identityDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throwApi(ApiErrorCode.IDENTITY_DOCUMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (!isAdmin && doc.userId !== userId) {
      throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const absolute = path.resolve(process.cwd(), doc.filePath);
    const buffer = await fs.readFile(absolute);
    return {
      buffer,
      mimeType: doc.mimeType,
      originalName: doc.originalName || `document-${doc.id}`,
    };
  }

  async assertCustomerIdentityVerified(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      select: { identityVerified: true },
    });
    if (!profile?.identityVerified) {
      // Recompute from documents in case flag drifted
      const status = await this.getStatus(userId);
      if (!status.identityVerified) {
        throwApi(ApiErrorCode.IDENTITY_NOT_VERIFIED, HttpStatus.FORBIDDEN);
      }
    }
  }
}
