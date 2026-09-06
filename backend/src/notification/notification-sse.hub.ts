import { Injectable, MessageEvent, OnModuleDestroy } from '@nestjs/common';
import {
  Observable,
  Subject,
  finalize,
  interval,
  map,
  merge,
  startWith,
} from 'rxjs';

export type NotificationSsePayload = {
  count: number;
  latestCreatedAt: string | null;
  latestTitle: string | null;
  latestBody: string | null;
};

/**
 * In-process SSE fan-out keyed by userId.
 * Suitable for single-instance API; multi-instance needs a shared bus later.
 */
@Injectable()
export class NotificationSseHub implements OnModuleDestroy {
  private readonly channels = new Map<string, Set<Subject<MessageEvent>>>();

  subscribe(
    userId: string,
    initial?: NotificationSsePayload,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    let set = this.channels.get(userId);
    if (!set) {
      set = new Set();
      this.channels.set(userId, set);
    }
    set.add(subject);

    const heartbeat$ = interval(25_000).pipe(
      map(
        (): MessageEvent => ({
          type: 'heartbeat',
          data: JSON.stringify({ ts: Date.now() }),
        }),
      ),
    );

    const live$ = subject.asObservable();
    const withInitial$ =
      initial != null
        ? live$.pipe(
            startWith({
              type: 'notification',
              data: JSON.stringify(initial),
            } satisfies MessageEvent),
          )
        : live$;

    return merge(withInitial$, heartbeat$).pipe(
      finalize(() => {
        const current = this.channels.get(userId);
        if (!current) return;
        current.delete(subject);
        if (current.size === 0) {
          this.channels.delete(userId);
        }
        subject.complete();
      }),
    );
  }

  publish(userId: string, payload: NotificationSsePayload) {
    const set = this.channels.get(userId);
    if (!set || set.size === 0) return;

    const event: MessageEvent = {
      type: 'notification',
      data: JSON.stringify(payload),
    };
    for (const subject of set) {
      subject.next(event);
    }
  }

  onModuleDestroy() {
    for (const set of this.channels.values()) {
      for (const subject of set) {
        subject.complete();
      }
    }
    this.channels.clear();
  }
}
