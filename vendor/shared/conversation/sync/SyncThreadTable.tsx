import { useEffect, useMemo, useState, type Key } from 'react';
import { Empty, Table, theme } from 'antd';
import type { TableColumnsType } from 'antd';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { uiText } from '../../localization/uiText';
import { useGuiLanguage } from '../../localization/useGuiLanguage';
import { groupSyncThreads, syncThreadKey, type SyncRow } from './threadGroups';
import type { SyncThread } from './types';
import styles from './sync.module.less';

interface Props {
  threads: SyncThread[]; selected: string[]; onSelect: (ids: string[]) => void;
  loading: boolean; locked: boolean; query: string;
}

export function SyncThreadTable({ threads, selected, onSelect, loading, locked, query }: Props) {
  const language = useGuiLanguage();
  const { token } = theme.useToken();
  const projects = useMemo(() => groupSyncThreads(threads), [threads]);
  const [expanded, setExpanded] = useState<readonly Key[]>([]);
  const projectKeys = JSON.stringify(projects.map(project => project.key));
  useEffect(() => {
    if (query.trim()) setExpanded(JSON.parse(projectKeys) as string[]);
  }, [query, projectKeys]);
  const columns: TableColumnsType<SyncRow> = [
    { title: uiText('client.conversationSync.titleColumn'), key: 'title', render: (_, row) =>
      <div className={styles.titleCell}>
        {row.type === 'project' && <Folder size={18} color={token.colorTextSecondary} aria-hidden="true" />}
        <div className={styles.thread}>
          <strong>{row.title || uiText(row.type === 'project'
            ? 'client.chat.noProjectSelected' : 'client.conversationSync.untitled')}</strong>
          {row.type === 'project' && <span style={{ color: token.colorTextSecondary }}>{row.cwd}</span>}
          {row.type === 'thread' && row.matchExcerpt && <span>{row.matchExcerpt}</span>}
        </div>
      </div> },
    { title: uiText('client.conversationSync.kind.conversation'), key: 'count', width: 80, align: 'right',
      render: (_, row) => row.type === 'project' ? row.children.length : null },
    { title: uiText('client.conversationSync.updated'), key: 'updated', width: 180,
      responsive: ['md'], render: (_, row) => row.updatedAt
        ? new Date(row.updatedAt * 1000).toLocaleString(language) : '—' },
  ];
  const changeSelection = (rows: SyncRow[]) => {
    const visible = new Set(threads.map(thread => thread.sessionId));
    onSelect([...new Set([...selected.filter(id => !visible.has(id)),
      ...rows.flatMap(row => row.type === 'thread' ? [row.sessionId] : [])])]);
  };
  return <Table<SyncRow> className={styles.table} size="small" rowKey="key" columns={columns}
    dataSource={projects} loading={loading} pagination={false} scroll={{ y: '100%' }} tableLayout="fixed"
    onRow={row => row.type === 'project' ? { style: { background: token.colorFillAlter } } : {}}
    rowSelection={{ selectedRowKeys: selected.map(syncThreadKey), checkStrictly: false, preserveSelectedRowKeys: true,
      onChange: (_, rows) => changeSelection(rows), getCheckboxProps: () => ({ disabled: locked }) }}
    expandable={{ expandedRowKeys: expanded,
      onExpandedRowsChange: setExpanded, indentSize: 24,
      expandIcon: ({ expanded: open, expandable, record, onExpand }) => expandable
        ? <button type="button" className={styles.expand} aria-expanded={open}
          aria-label={`${uiText(open ? 'client.chat.collapseProject' : 'client.chat.expandProject')}: ${
            record.cwd || uiText('client.chat.noProjectSelected')}`}
          onClick={event => onExpand(record, event)}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button> : <span className={styles.expandSpace} /> }}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={uiText('client.conversationSync.empty')} /> }} />;
}
