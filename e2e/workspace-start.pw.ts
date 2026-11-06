import { test } from '@playwright/test';
import { checkWorkspaceStart } from '../../desktop/e2e/workspace-start-checks';

for (const enlarged of [false, true]) {
  test(`web desktop: empty workspace ${enlarged ? 'dark narrow font20' : 'light wide font14'}`,
    async ({ page }, info) => {
      await page.setViewportSize({ width: enlarged ? 1024 : 1440, height: 900 });
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
      const query = `mode=web&submodules&font=${enlarged ? 20 : 14}${enlarged ? '&dark' : ''}`;
      await checkWorkspaceStart({ page, info, url: `e2e/workspace-start-harness.html?${query}`,
        label: `web-${enlarged ? 'dark-narrow-font20' : 'light-wide-font14'}` });
    });
}
