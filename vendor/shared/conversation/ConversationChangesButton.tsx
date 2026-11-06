import { useContext, useEffect, useId, useMemo } from "react";
import { PanelRight, PanelRightClose } from "lucide-react";
import { PanelToggleButton } from '../chat/PanelToggleButton';
import { WorkspaceDrawerContext } from '../chat/workspaceDrawer';
import type { Conversation } from "./types";
import { useTurnChangedFiles } from "./useTurnChangedFiles";
import { useDetailsEntry } from "./detailsContext";
import { useDiffText } from "../chat/diffText";

export function ConversationChangesButton({ value }: { value?: Pick<Conversation, 'turns'> }) {
  const t = useDiffText();
  const id = useId();
  const turn = value?.turns.slice().reverse().find((entry) => entry.diff
    || entry.items.some((item) => item.type === "fileChange" && item.changes?.length));
  const files = useTurnChangedFiles(turn);
  const title = t("client.chat.fileChanges.049e14");
  const entry = useMemo(() => ({ id, title, files }), [id, files, title]);
  const panel = useDetailsEntry(entry);
  const workspace = useContext(WorkspaceDrawerContext);
  const register = panel?.setConversationChanges;
  useEffect(() => { register?.(entry); }, [register, entry]);
  const showingChanges = Boolean(panel?.visible && panel.showingChanges);
  const empty = Boolean(workspace && !workspace.hasOpenTabs && !files.length);
  const showingStart = Boolean(workspace?.tabs.visible && workspace.tabs.selected === 'start');
  const expanded = showingChanges || showingStart;
  const label = empty ? t('client.desktopGuiExtras.sidebarContent')
    : t(showingChanges ? "client.chat.hideFileChanges" : "client.chat.viewFileChanges");
  return <PanelToggleButton icon={expanded ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
    label={label} expanded={expanded} active={workspace?.hasOpenTabs ?? Boolean(panel?.visible)}
    onClick={() => {
      if (expanded) panel?.close();
      else if (empty) workspace?.openStart();
      else panel?.open(entry);
    }} />;
}
