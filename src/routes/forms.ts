import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { isT1, isT3 } from '@devvit/shared-types/tid.js';
import { handleNuke, handleNukePost } from '../core/nuke';

//form typedefs
type NukeFormValues = {
  remove?: boolean;
  lock?: boolean;
  skipDistinguished?: boolean;
  targetId?: string;
};

type NukeOptions = {
  remove: boolean;
  lock: boolean;
  skipDistinguished: boolean;
};


//constants
const ERROR_MESSAGES = {
  noAction: 'You must select either lock or remove.',
  invalidTarget: 'Mop failed! Please try again later.',
};



//form helpers
function normalizeValues(values: NukeFormValues): NukeOptions {
  return {
    remove: Boolean(values.remove),
    lock: Boolean(values.lock),
    skipDistinguished: Boolean(values.skipDistinguished),
  };
}

function getTargetId(values: NukeFormValues): string {
  const targetId = values.targetId?.trim();

  return targetId || context.postId;
}

function hasValidAction(options: NukeOptions): boolean {
  return options.lock || options.remove;
}

//response helpers
function showToast(message: string) {
  return (c: Parameters<Parameters<typeof forms.post>[1]>[0]) =>
    c.json<UiResponse>({ showToast: message }, 200);
}

function showResult(
  result: { success: boolean; message: string },
  c: Parameters<Parameters<typeof forms.post>[1]>[0]
) {
  const status = result.success ? 'Success' : 'Failed';

  console.log(`Mop result - ${status.toLowerCase()} - ${result.message}`);

  return c.json<UiResponse>(
    {
      showToast: `${status} : ${result.message}`,
    },
    200
  );
}


//validation
function validateAction(
  options: NukeOptions,
  c: Parameters<Parameters<typeof forms.post>[1]>[0]
) {
  if (hasValidAction(options)) {
    return null;
  }

  return c.json<UiResponse>(
    { showToast: ERROR_MESSAGES.noAction },
    200
  );
}

function validateTarget(
  targetId: string,
  isValid: (id: string) => boolean,
  type: string,
  c: Parameters<Parameters<typeof forms.post>[1]>[0]
) {
  if (isValid(targetId)) {
    return null;
  }

  console.error(`targetId is not a ${type}`, targetId);

  return c.json<UiResponse>(
    { showToast: ERROR_MESSAGES.invalidTarget },
    200
  );
}


//request processing
async function getFormValues(c: any): Promise<NukeFormValues> {
  const values = await c.req.json<NukeFormValues>();

  console.log('values', values);

  return values;
}

async function processNuke(
  c: any,
  isValidTarget: (id: string) => boolean,
  targetType: string,
  execute: (targetId: string, options: NukeOptions) => Promise<{
    success: boolean;
    message: string;
  }>
) {
  const values = await getFormValues(c);
  const options = normalizeValues(values);

  const actionError = validateAction(options, c);

  if (actionError) {
    return actionError;
  }

  const targetId = getTargetId(values);
  const targetError = validateTarget(
    targetId,
    isValidTarget,
    targetType,
    c
  );

  if (targetError) {
    return targetError;
  }

  const result = await execute(targetId, options);

  return showResult(result, c);
}




//hono/devvit routes
//*************************************************************************************************************
export const forms = new Hono();

forms.post('/mop-comment-submit', async (c) => {
  return processNuke(
    c,
    isT1,
    'T1',
    (commentId, options) =>
      handleNuke({
        ...options,
        commentId,
        subredditId: context.subredditId,
      })
  );
});

forms.post('/mop-post-submit', async (c) => {
  return processNuke(
    c,
    isT3,
    'T3',
    (postId, options) =>
      handleNukePost({
        ...options,
        postId,
        subredditId: context.subredditId,
      })
  );
});
