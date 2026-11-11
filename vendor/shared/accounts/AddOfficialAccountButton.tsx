import { Dropdown } from 'antd';
import { ChevronDown, Plus } from 'lucide-react';
import type { OfficialAccountSource } from './source';

export function AddOfficialAccountButton({ label, onSelect, className = 'primary-button' }: {
  label: string;
  onSelect: (source: OfficialAccountSource) => void;
  className?: string;
}) {
  return <Dropdown trigger={['click']} menu={{
    items: [{ key: 'codex', label: 'Codex' }, { key: 'claudeCode', label: 'Claude Code' }],
    onClick: ({ key }) => onSelect(key as OfficialAccountSource),
  }}>
    <button type="button" className={className} aria-haspopup="menu">
      <Plus size={18} aria-hidden="true" />{label}<ChevronDown size={14} aria-hidden="true" />
    </button>
  </Dropdown>;
}
