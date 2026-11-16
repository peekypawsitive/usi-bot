import { Hono } from 'hono';
import type { OnCommentCreateRequest } from '@devvit/web/shared';

import { reddit } from '@devvit/web/server';
import { successResponse } from '../utils/responses';
import { processAlexa } from '../core/alexa';

export const triggers = new Hono();

const selfName = 'khainiChor';

triggers.post('/on-app-install', c => {
  return successResponse(c);
});

triggers.post('/on-app-upgrade', c => {
  return successResponse(c);
});

triggers.post('/on-comment-create', async c => {
  try {
    const { comment, post, author } =
      await c.req.json<OnCommentCreateRequest>();

    if (!comment?.body) {
      return successResponse(c);
    }

    if (!comment.parentId) {
      return successResponse(c);
    }

    if (!post?.authorId) {
      return successResponse(c);
    }

    if (!/^(alexa|bablu)\b/im.test(comment.body)) {
      return successResponse(c);
    }

    const parent = await reddit.getUserById(post.authorId);

    if (parent.username !== selfName) {
      return successResponse(c);
    }

    const response = await processAlexa(
      comment.body,
      comment.parentId,
      author?.name
    );

    if (!response) {
      return successResponse(c);
    }

    await reddit.submitComment({
      id: comment.id,
      text: response,
      runAs: 'APP',
    });

  } catch (err) {
    console.error('on-comment-create error:', err);
  }

  return successResponse(c);
});
