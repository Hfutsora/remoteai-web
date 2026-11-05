import type { GuiEvent, Item, Thread, Turn } from './types';

const DEFERRED_TYPES = new Set(['commandExecution', 'mcpToolCall', 'dynamicToolCall', 'functionCallOutput']);
const PREVIEW_CHARS = 160;

/** Also used at the remote boundary when a legacy viewer requires the host's full event stream. */
export function summarizeTool(item: Item, threadId: string, turnId: string): Item {
  if (!DEFERRED_TYPES.has(item.type)) return item;
  const { id, type, status, exitCode, durationMs, tool, server, name } = item;
  const action = item.commandActions?.find(action => action.type !== 'unknown');
  const commandActions = action ? [{ type: action.type, name: action.name?.slice(0, PREVIEW_CHARS),
    query: action.query?.slice(0, PREVIEW_CHARS), path: action.path?.slice(0, PREVIEW_CHARS) }] : undefined;
  return { id, type, status, exitCode, durationMs, tool, server, name,
    commandPreview: (item.commandPreview ?? item.command)?.slice(0, PREVIEW_CHARS),
    commandActions, detailsRef: { threadId, turnId, itemId: id } };
}

const summarizeTurn = (turn: Turn, threadId: string): Turn =>
  ({ ...turn, items: turn.items.map(item => summarizeTool(item, threadId, turn.id)) });

export function summarizeTools(thread: Thread): Thread {
  return { ...thread, turns: thread.turns?.map(turn => summarizeTurn(turn, thread.id)) };
}

export function summarizeToolEvent(event: GuiEvent): GuiEvent | undefined {
  if (event.id != null) return event;
  if (['item/commandExecution/outputDelta', 'item/mcpToolCall/progress'].includes(event.method)) return;
  const { params } = event;
  return { ...event, params: { ...params,
    ...(params.item && params.threadId && params.turnId
      ? { item: summarizeTool(params.item, params.threadId, params.turnId) } : {}),
    ...(params.turn && params.threadId ? { turn: summarizeTurn(params.turn, params.threadId) } : {}),
    ...(params.thread ? { thread: summarizeTools(params.thread) } : {}),
  } };
}
