/** Common presentation contract for local and remote CLI installation. */
export interface CliRelease { version: string; size: number; ready?: boolean }
export interface CliSnapshot { version: string | null; release: CliRelease | null }
export interface CliInstallerState {
  version: string | null;
  release: CliRelease | null;
  checking: boolean;
  installing: boolean;
  progress: { downloaded: number; total: number; phase: 'downloading' | 'installing' } | null;
  checked: boolean;
  check: () => Promise<void>;
  install: () => Promise<void>;
  onImported?: (snapshot: CliSnapshot) => Promise<void>;
}
