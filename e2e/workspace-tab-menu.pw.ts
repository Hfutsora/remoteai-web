import { test } from '@playwright/test';
import { checkWorkspaceTabMenu } from '../../desktop/e2e/workspace-tab-menu-checks';

for (const enlarged of [false, true]) {
  test(`web desktop: workspace tab context menu ${enlarged ? 'dark narrow font20' : 'light wide font14'}`,
    async ({ page }, info) => {
      await page.setViewportSize({ width: enlarged ? 1024 : 1440, height: 900 });
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
      const query = `mode=web&submodules&font=${enlarged ? 20 : 14}${enlarged ? '&dark' : ''}`;
      await checkWorkspaceTabMenu({ page, info, mode: 'web', label: `web-${enlarged ? 'dark-font20' : 'light-font14'}`,
        url: `e2e/workspace-start-harness.html?${query}` });
    });
}
