import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BillStatus,
  EndRequestInitiator,
  NotificationType,
  RequestStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notification/notification.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { formatMoney } from '../common/utils/money.util';

@Injectable()
export class SubscriptionEndService {
  constructor(
    private prisma: PrismaService,
    private billing: BillingService,
    private notifications: NotificationService,
  ) {}

  async assertNoActiveSubscription(
    distributorId: string,
    customerId: string,
  ) {
    const existing = await this.prisma.subscription.findFirst({
      where: {
        distributorId,
        customerId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PENDING_CANCEL,
            SubscriptionStatus.PENDING_APPROVAL,
          ],
        },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      throwApi(
        existing.status === SubscriptionStatus.PENDING_CANCEL
          ? ApiErrorCode.SUBSCRIPTION_END_PENDING
          : existing.status === SubscriptionStatus.PENDING_APPROVAL
            ? ApiErrorCode.SUBSCRIPTION_ALREADY_ACTIVE
            : ApiErrorCode.SUBSCRIPTION_ALREADY_ACTIVE,
        HttpStatus.CONFLICT,
      );
    }
  }

  private async loadSubscriptionForParty(
    subscriptionId: string,
    role: UserRole,
    userId: string,
  ) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        distributor: { include: { user: true } },
        customer: { include: { user: true } },
        product: true,
        endRequests: {
          where: { status: RequestStatus.PENDING },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (role === UserRole.CUSTOMER) {
      if (sub.customer.userId !== userId) {
        throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
      }
    } else if (role === UserRole.DISTRIBUTOR) {
      if (sub.distributor.userId !== userId) {
        throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
      }
    } else {
      throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    return sub;
  }

  async previewSettlement(subscriptionId: string, role: UserRole, userId: string) {
    const sub = await this.loadSubscriptionForParty(subscriptionId, role, userId);
    return this.billing.previewSettlementBill(sub.id);
  }

  async requestEnd(
    subscriptionId: string,
    role: UserRole,
    userId: string,
    reason?: string,
  ) {
    const sub = await this.loadSubscriptionForParty(subscriptionId, role, userId);
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      if (sub.status === SubscriptionStatus.PENDING_CANCEL) {
        throwApi(ApiErrorCode.SUBSCRIPTION_END_PENDING, HttpStatus.CONFLICT);
      }
      throwApi(ApiErrorCode.SUBSCRIPTION_END_NOT_ALLOWED, HttpStatus.BAD_REQUEST);
    }

    const initiator =
      role === UserRole.CUSTOMER
        ? EndRequestInitiator.CUSTOMER
        : EndRequestInitiator.DISTRIBUTOR;

    const now = new Date();
    const request = await this.prisma.$transaction(async (tx) => {
      const endRequest = await tx.subscriptionEndRequest.create({
        data: {
          subscriptionId: sub.id,
          initiatedBy: initiator,
          reason: reason?.trim() || null,
          status: RequestStatus.PENDING,
          customerConfirmedAt:
            initiator === EndRequestInitiator.CUSTOMER ? now : null,
          distributorConfirmedAt:
            initiator === EndRequestInitiator.DISTRIBUTOR ? now : null,
        },
      });
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.PENDING_CANCEL },
      });
      return endRequest;
    });

    const notifyUserId =
      initiator === EndRequestInitiator.CUSTOMER
        ? sub.distributor.userId
        : sub.customer.user.id;
    const actorName =
      initiator === EndRequestInitiator.CUSTOMER
        ? sub.customer.user.name
        : sub.distributor.businessName;

    await this.notifications.create({
      userId: notifyUserId,
      type: NotificationType.SUBSCRIPTION_END_REQUESTED,
      title: 'Subscription end requested',
      body: `${actorName} requested to end the ${sub.product.name} subscription. Confirm to settle and close it.`,
      payload: { subscriptionId: sub.id, endRequestId: request.id },
      eventId: `subscription-end-requested:${request.id}`,
    });

    return this.getEndRequest(subscriptionId, role, userId);
  }

  async confirmEnd(subscriptionId: string, role: UserRole, userId: string) {
    const sub = await this.loadSubscriptionForParty(subscriptionId, role, userId);
    const pending = sub.endRequests[0];
    if (!pending || sub.status !== SubscriptionStatus.PENDING_CANCEL) {
      throwApi(ApiErrorCode.SUBSCRIPTION_END_NOT_PENDING, HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    if (role === UserRole.CUSTOMER) {
      if (pending.customerConfirmedAt) {
        throwApi(
          ApiErrorCode.SUBSCRIPTION_END_ALREADY_CONFIRMED,
          HttpStatus.CONFLICT,
        );
      }
    } else if (pending.distributorConfirmedAt) {
      throwApi(
        ApiErrorCode.SUBSCRIPTION_END_ALREADY_CONFIRMED,
        HttpStatus.CONFLICT,
      );
    }

    const bothWillConfirm =
      role === UserRole.CUSTOMER
        ? !!pending.distributorConfirmedAt
        : !!pending.customerConfirmedAt;

    if (!bothWillConfirm) {
      await this.prisma.subscriptionEndRequest.update({
        where: { id: pending.id },
        data:
          role === UserRole.CUSTOMER
            ? { customerConfirmedAt: now }
            : { distributorConfirmedAt: now },
      });

      const notifyUserId =
        role === UserRole.CUSTOMER
          ? sub.distributor.userId
          : sub.customer.user.id;
      await this.notifications.create({
        userId: notifyUserId,
        type: NotificationType.SUBSCRIPTION_END_REQUESTED,
        title: 'Waiting for your confirmation',
        body: `The other party confirmed ending ${sub.product.name}. Confirm to complete settlement.`,
        payload: { subscriptionId: sub.id, endRequestId: pending.id },
        eventId: `subscription-end-waiting:${pending.id}:${role}`,
      });

      return this.getEndRequest(subscriptionId, role, userId);
    }

    // Both confirmed → settle and cancel
    const settlement = await this.billing.createSettlementBill(sub.id);
    const settledAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionEndRequest.update({
        where: { id: pending.id },
        data: {
          status: RequestStatus.APPROVED,
          customerConfirmedAt: pending.customerConfirmedAt ?? settledAt,
          distributorConfirmedAt: pending.distributorConfirmedAt ?? settledAt,
          settlementBillId: settlement?.id ?? null,
          settledAt,
        },
      });
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          endedAt: settledAt,
        },
      });
    });

    const totalLabel = settlement
      ? `₹${formatMoney(settlement.total)}`
      : '₹0 (no unbilled deliveries)';

    await this.notifications.createMany([
      {
        userId: sub.customer.user.id,
        type: NotificationType.SUBSCRIPTION_END_CONFIRMED,
        title: 'Subscription ended',
        body: `Your ${sub.product.name} subscription is closed. Settlement invoice: ${totalLabel}. You can find a distributor and start a new subscription anytime.`,
        payload: {
          subscriptionId: sub.id,
          billId: settlement?.id ?? null,
          startFresh: true,
        },
        eventId: `subscription-end-confirmed:${pending.id}:customer`,
      },
      {
        userId: sub.distributor.userId,
        type: NotificationType.SUBSCRIPTION_END_CONFIRMED,
        title: 'Subscription ended',
        body: `${sub.customer.user.name}'s ${sub.product.name} subscription is closed. Settlement: ${totalLabel}.`,
        payload: {
          subscriptionId: sub.id,
          billId: settlement?.id ?? null,
        },
        eventId: `subscription-end-confirmed:${pending.id}:distributor`,
      },
    ]);

    return this.getEndRequest(subscriptionId, role, userId);
  }

  async rejectEnd(subscriptionId: string, role: UserRole, userId: string) {
    const sub = await this.loadSubscriptionForParty(subscriptionId, role, userId);
    const pending = sub.endRequests[0];
    if (!pending || sub.status !== SubscriptionStatus.PENDING_CANCEL) {
      throwApi(ApiErrorCode.SUBSCRIPTION_END_NOT_PENDING, HttpStatus.BAD_REQUEST);
    }

    // Initiator cannot reject their own request — only the other party
    if (
      (pending.initiatedBy === EndRequestInitiator.CUSTOMER &&
        role === UserRole.CUSTOMER) ||
      (pending.initiatedBy === EndRequestInitiator.DISTRIBUTOR &&
        role === UserRole.DISTRIBUTOR)
    ) {
      throwApi(ApiErrorCode.SUBSCRIPTION_END_NOT_ALLOWED, HttpStatus.FORBIDDEN);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionEndRequest.update({
        where: { id: pending.id },
        data: { status: RequestStatus.REJECTED },
      });
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    });

    const notifyUserId =
      role === UserRole.CUSTOMER
        ? sub.distributor.userId
        : sub.customer.user.id;

    await this.notifications.create({
      userId: notifyUserId,
      type: NotificationType.SUBSCRIPTION_END_REJECTED,
      title: 'Subscription end rejected',
      body: `The request to end ${sub.product.name} was rejected. The subscription remains active.`,
      payload: { subscriptionId: sub.id, endRequestId: pending.id },
      eventId: `subscription-end-rejected:${pending.id}`,
    });

    return this.getEndRequest(subscriptionId, role, userId);
  }

  async getEndRequest(subscriptionId: string, role: UserRole, userId: string) {
    const sub = await this.loadSubscriptionForParty(subscriptionId, role, userId);
    const latest = await this.prisma.subscriptionEndRequest.findFirst({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      include: {
        settlementBill: {
          include: { lineItems: { include: { product: true } } },
        },
      },
    });
    const preview = await this.billing.previewSettlementBill(subscriptionId);
    return {
      subscription: {
        id: sub.id,
        status: sub.status,
        productName: sub.product.name,
        endedAt: sub.endedAt,
      },
      endRequest: latest,
      settlementPreview: preview,
    };
  }
}
