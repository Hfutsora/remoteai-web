import { invoke } from "../platform/localBackend";
import type { GitRequest, GitStatus } from "../remote-chat/gitWorkspace";
export type { GitRequest, GitStatus, GitWorkspaceClient } from "../remote-chat/gitWorkspace";

export const gitApi = {
  request: (request: GitRequest) => invoke<GitStatus>("codex_gui_git", { request }),
  undo: (request: { threadId: string; turnId: string; checkOnly?: boolean }) =>
    invoke<{ undone: boolean }>("codex_gui_undo", { request }),
};
