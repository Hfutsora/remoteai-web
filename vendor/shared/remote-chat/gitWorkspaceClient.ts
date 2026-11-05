import type { GitClient, GitCommit, GitHistory, GitRepositoryEntry } from './gitTypes';
import { childFirst, fileOwner, localPath, readWorkspaces, selectedByRepository,
  workspaceFiles, workspacePath } from './gitWorkspaceModel';
import { commitWorkspace } from './gitWorkspaceCommit';

const HISTORY_PAGE_SIZE = 80;

function mergeHistory(pages: GitHistory[]): GitCommit[] {
  const positions = pages.map(() => 0);
  const merged: GitCommit[] = [];
  while (true) {
    let selected = -1;
    pages.forEach((page, index) => {
      const commit = page.commits[positions[index]];
      if (commit && (selected < 0 || commit.date > pages[selected].commits[positions[selected]].date)) selected = index;
    });
    if (selected < 0) return merged;
    merged.push(pages[selected].commits[positions[selected]++]);
  }
}

async function workspaceHistory(client: GitClient, entries: GitRepositoryEntry[], skip: number): Promise<GitHistory> {
  const results = await Promise.allSettled(entries.filter(entry => entry.available).map(async entry => {
    let page: GitHistory = { commits: [], hasMore: true };
    const commits: GitCommit[] = [];
    while (page.hasMore && commits.length < skip + HISTORY_PAGE_SIZE + 1) {
      page = await client.history(entry.root, commits.length);
      commits.push(...page.commits.map(commit => ({ ...commit, repository: entry.root, repositoryPath: entry.path })));
      if (!page.commits.length) break;
    }
    return { commits, hasMore: page.hasMore };
  }));
  const pages = results.map(result => {
    if (result.status === 'rejected') throw result.reason;
    return result.value;
  });
  // Merge repository logs without breaking their own topological order when commit dates are skewed.
  const commits = mergeHistory(pages);
  return { commits: commits.slice(skip, skip + HISTORY_PAGE_SIZE),
    hasMore: commits.length > skip + HISTORY_PAGE_SIZE || pages.some(page => page.hasMore) };
}

/** Project-relative paths are presentation identities; each native request retains its real repository cwd. */
export function createGitWorkspaceClient(source: GitClient, cwd: string) {
  let discovered: Promise<GitRepositoryEntry[]> | undefined;
  const pendingReferences = new Map<string, string>();
  const onCommitted = (entry: GitRepositoryEntry, hash: string) => {
    if (entry.path) pendingReferences.set(entry.path, hash);
  };
  const entries = () => {
    discovered ??= source.repository(cwd, true).then(value => value.repositories
      ?? [{ root: cwd, path: '', available: true }]).catch(error => { discovered = undefined; throw error; });
    return discovered;
  };
  const rootEntry = async () => (await entries())[0];
  const client: GitClient = {
    settings: source.settings,
    repository: async () => {
      const list = await entries();
      const results = await Promise.allSettled(list.filter(entry => entry.available)
        .map(entry => source.repository(entry.root)));
      const repositories = results.map(result => {
        if (result.status === 'rejected') throw result.reason;
        return result.value;
      });
      return { ...repositories[0], repositories: list,
        ahead: repositories.reduce((total, repository) => total + repository.ahead, 0),
        behind: repositories.reduce((total, repository) => total + repository.behind, 0) };
    },
    changes: async () => {
      const list = await entries();
      const states = await readWorkspaces(source, list);
      const integration = states.find(state => state.changes.integration);
      const files = workspaceFiles(states);
      const pendingSelection = files.filter(file => pendingReferences.has(file.path)
        && states.some(state => state.entry.path === file.path
          && state.changes.head === pendingReferences.get(file.path)))
        .map(({ path, version }) => ({ path, version }));
      // Carry generated references into the remaining selection once after a partial submission.
      pendingReferences.clear();
      return { ...states[0].changes, files, pendingSelection,
        repositories: list.length > 1 ? list : undefined, workspaces: states.map(state => state.changes),
        integration: integration ? { ...integration.changes.integration!,
          version: JSON.stringify([integration.entry.root, integration.changes.integration!.version]) } : null };
    },
    history: async (_cwd, skip) => workspaceHistory(source, await entries(), skip),
    commitFiles: (root, commit) => source.commitFiles(root, commit),
    diff: async (root, path, commit) => {
      if (commit) return source.diff(root, path, commit);
      const entry = fileOwner(await entries(), path);
      return source.diff(entry.root, localPath(entry, path));
    },
    commit: async request =>
      commitWorkspace({ client: source, entries: await entries(), request, push: false, onCommitted }),
    commitAndPush: async request =>
      commitWorkspace({ client: source, entries: await entries(), request, push: true, onCommitted }),
    generateMessage: async request => {
      const states = await readWorkspaces(source, await entries());
      const groups = selectedByRepository(states, request.files);
      const messages: string[] = [];
      for (const state of states.filter(state => groups.has(state.entry.root))) {
        const result = await source.generateMessage({ ...request, cwd: state.entry.root,
          head: state.changes.head, files: groups.get(state.entry.root)! });
        messages.push(result.message);
      }
      return { message: messages.join('\n\n') };
    },
    fileAction: async request => {
      const states = await readWorkspaces(source, await entries());
      if (states[0].changes.head !== request.head) {
        throw new Error('client.git.filesOrBranchesHaveChangedRefreshAndSelectTheFiles');
      }
      const groups = selectedByRepository(states, request.files);
      for (const state of states.filter(state => groups.has(state.entry.root))) {
        await source.fileAction({ ...request, cwd: state.entry.root,
          head: state.changes.head, files: groups.get(state.entry.root)! });
      }
    },
    action: async request => {
      const list = await entries();
      const root = await source.changes(list[0].root);
      if (root.head !== request.head || root.branch !== request.branch) {
        throw new Error('client.git.filesOrBranchesHaveChangedRefreshAndSelectTheFiles');
      }
      if (list.length === 1 || request.action === 'switch') {
        await source.action({ ...request, cwd: (await rootEntry()).root });
        discovered = undefined; return;
      }
      for (const entry of childFirst(list.filter(entry => entry.available))) {
        const repository = await source.repository(entry.root);
        if (request.action === 'fetch' ? !repository.remotes.length : !repository.upstream) continue;
        const state = await source.changes(entry.root);
        await source.action({ ...request, cwd: entry.root, head: state.head, branch: state.branch });
      }
      discovered = undefined;
    },
    revision: async request => { await source.revision(request); discovered = undefined; },
    conflict: async (_cwd, path) => {
      const entry = fileOwner(await entries(), path);
      const value = await source.conflict(entry.root, localPath(entry, path));
      return { ...value, path: workspacePath(entry, value.path) };
    },
    resolveConflict: async request => {
      const entry = fileOwner(await entries(), request.path);
      await source.resolveConflict({ ...request, cwd: entry.root, path: localPath(entry, request.path) });
    },
    continueIntegration: async (_cwd, snapshot) => {
      const [root, version] = JSON.parse(snapshot) as [string, string];
      await source.continueIntegration(root, version);
    },
  };
  return { client, refreshRepositories: () => { discovered = undefined; } };
}
