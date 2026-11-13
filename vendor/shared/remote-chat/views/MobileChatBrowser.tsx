import { useContext, type ReactNode } from 'react';
import { BrowserNavigationContext } from '../../browser/BrowserNavigationProvider';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import { DetailsContext } from '../../conversation/detailsContext';
import { FileEnvironmentContext } from '../../conversation/fileEnvironment';
import { ChatFileContext } from './ChatFileLink';
import { chatBrowserResource } from './chatBrowserResource';
import type { BrowserResource } from '../../file-preview/workspace/browserResources';
import type { FilePreviewTarget } from '../../file-preview/workspace/usePreviewHistory';

const inactivePanel = { open: () => {}, update: () => {}, setConversationChanges: () => {},
  showingChanges: false, visible: false, close: () => {} };

/** Keep desktop's details panel while phone previews join the application's main browser. */
export function MobileChatBrowser({ children }: { children: ReactNode }) {
  const navigation = useContext(BrowserNavigationContext);
  return navigation ? <MobileChatBrowserRoutes>{children}</MobileChatBrowserRoutes> : children;
}

function MobileChatBrowserRoutes({ children }: { children: ReactNode }) {
  const navigation = useContext(BrowserNavigationContext);
  const panel = useContext(DetailsContext);
  const environment = useContext(FileEnvironmentContext);
  const files = useContext(ChatFileContext);
  const desktop = useDesktopLayout();
  if (desktop || !navigation || !files) return children;
  const openResource = (resource: BrowserResource) => navigation.openResource({ ...resource,
    render: props => <FileEnvironmentContext.Provider value={environment}>
      <DetailsContext.Provider value={context}>{resource.render(props)}</DetailsContext.Provider>
    </FileEnvironmentContext.Provider>,
  });
  const openFile = async (target: FilePreviewTarget) => {
    openResource(chatBrowserResource(target.path, { ...files, threadId: target.threadId }, target.line));
    return true;
  };
  const context = { ...(panel ?? inactivePanel), openFile, openRemoteFile: openFile, openResource,
    openWebsite: (url: string, options?: { resolved?: boolean }) => navigation.openWebsite(url,
      { ...options, resolve: environment?.resolveWebsite }),
  };
  return <DetailsContext.Provider value={context}>{children}</DetailsContext.Provider>;
}
