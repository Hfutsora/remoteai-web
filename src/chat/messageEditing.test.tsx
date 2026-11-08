// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EditableChatMessage } from '../../../../shared/remote-chat/views/EditableChatMessage';
import { ChatController } from '../../../../shared/remote-chat/client/controller';
import { initialChatState, type ChatState, type Thread } from '../../../../shared/remote-chat/client/types';
import { uiText } from '../../../../shared/localization/uiText';

const image = 'data:image/png;base64,aW1hZ2U=';
const skill = { name: 'review', path: '/skills/review/SKILL.md', enabled: true, description: '' };
const thread: Thread = { id: 'thread', cwd: '/project', preview: '', updatedAt: 1, turns: [
  { id: 'first', status: 'completed', items: [{ id: 'old', type: 'userMessage', text: 'old message' }] },
  { id: 'last', status: 'completed', items: [{ id: 'user', type: 'userMessage', content: [
    { type: 'text', text: 'original $review' }, { type: 'skill', name: skill.name, path: skill.path },
    { type: 'image', url: image },
  ] }] },
] };
let root: Root;
let host: HTMLDivElement;
let controller: ChatController;
let state: ChatState;
const label = (key: Parameters<typeof uiText>[0]) => uiText(key);
const edit = () => host.querySelector<HTMLButtonElement>(
  '[aria-label="' + label('client.workspaceActions.editMessage') + '"]')!;
const input = () => host.querySelector('textarea')!;
const clickEdit = () => act(async () => edit().click());
const key = (options: KeyboardEventInit = {}) => act(async () => {
  input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options }));
});
async function fill(text: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input(), text);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function render(turnIndex = 1, active = true) {
  const turn = state.selected!.turns![turnIndex];
  await act(async () => root.render(<EditableChatMessage key={turn.id} item={turn.items[0]} turn={turn}
    state={state} controller={controller} active={active} />));
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: true, media: query,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  controller = new ChatController(() => ({ request: async () => { throw new Error('unexpected request'); },
    start: () => {}, stop: () => {} }));
  vi.spyOn(controller.messageEditor, 'submit').mockResolvedValue(false);
  vi.spyOn(controller.messageEditor, 'remove').mockResolvedValue(true);
  state = { ...initialChatState(), selected: structuredClone(thread), ready: true, mode: 'direct' };
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

it('exposes editing on the latest user message and disables it for inactive or offline sessions', async () => {
  expect(edit()).toBeTruthy();
  await render(0); expect(edit()).toBeNull();
  await render(1, false); expect(edit().disabled).toBe(true);
  state = { ...state, ready: false, historyOffline: true };
  await render(); expect(edit().disabled).toBe(true);
});

it('submits with Enter and keeps the draft and explicit skills after failure', async () => {
  await clickEdit();
  await key({ shiftKey: true });
  await key({ isComposing: true });
  await key({ keyCode: 229 });
  expect(controller.messageEditor.submit).not.toHaveBeenCalled();
  await key();
  expect(controller.messageEditor.submit).toHaveBeenCalledExactlyOnceWith({
    threadId: 'thread', turnId: 'last', itemId: 'user', text: 'original $review',
    skills: [{ name: skill.name, path: skill.path }],
  });
  expect(input().value).toBe('original $review');
});

it('blocks blank messages and preserves image removals until canceled', async () => {
  await clickEdit();
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="' + uiText('client.chat.removeImage',
    { value1: 1 }) + '"]')!.click());
  await fill(''); await key();
  expect(controller.messageEditor.submit).not.toHaveBeenCalled();
  await fill('replacement'); await key();
  expect(controller.messageEditor.submit).toHaveBeenCalledWith({
    threadId: 'thread', turnId: 'last', itemId: 'user', text: 'replacement', skills: [], removedImageIndexes: [0],
  });
  await key({ key: 'Escape' });
  expect(input()).toBeNull();
  await clickEdit(); expect(input().value).toBe('original $review');
  expect(host.querySelector('[aria-label="' + uiText('client.chat.removeImage', { value1: 1 }) + '"]')).toBeTruthy();
});

it('allows only one pending edit and exits editing after a confirmed send', async () => {
  let finish!: (value: boolean) => void;
  vi.mocked(controller.messageEditor.submit).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await clickEdit(); await key(); await key();
  expect(controller.messageEditor.submit).toHaveBeenCalledTimes(1);
  await act(async () => finish(true));
  expect(input()).toBeNull();
});
