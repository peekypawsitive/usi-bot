// utils/responses.ts
import type { Context } from 'hono';
import type { TriggerResponse } from '@devvit/web/shared';

export function successResponse(c: Context) {
  return c.json<TriggerResponse>({
    status: 'ok',
  });
}
