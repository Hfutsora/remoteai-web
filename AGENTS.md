# Agent Notes

- Keep these instructions in English. This repository owns the Remote AI Web client.
- Install and check independently with `npm ci`, `npm run check`, and `npm test`.
  Build output belongs in `dist/`; development uses `npm run dev`.
- Application source files retain their established host-relative imports because the desktop application
  also consumes Web components. Standalone commands prepare `.workspace/` from this repository and the
  generated dependencies in `vendor/`. Edit original sources, never the generated workspace or snapshots.
- Refresh dependencies using `scripts/export-web-dependencies.mjs` in `piperhex/remoteai`. Review the
  repository revisions, file hashes and npm lockfile. Shared source ownership remains in `remoteai-shared`.
- All translation sources belong to `@remoteai/i18n`. Pin its published release archive; keep public
  entry points, language availability and fallback behavior. Do not maintain translation copies here.
- Preserve desktop and mobile Web layouts and their correspondence with the desktop and native clients.
  Keep existing themes and typography. UI changes require inspected screenshots from the running application.
- Context menus must support both right-click and touch long-press. Temporary messages stay at most 400 CSS px wide.
- Browser tests use bundled Playwright Chromium and the exported `scripts/test-browser.mjs` helper.
  Never replace a missing bundled browser with system Chrome or Edge on Windows.
- Keep service `web`, the `codex-switch-web` gateway alias, `CODEX_WEB_IMAGE`, `ADMIN_GO_KONG_NETWORK`
  and production Compose overrides compatible. A repository move does not authorize production deployment.
- Commit and push verified Web changes before the parent updates its gitlink. Do not mix unrelated work,
  bypass checks or force-push. Abort conflicting merges and report them.
