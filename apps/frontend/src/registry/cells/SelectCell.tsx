'use client';

import type { CellRenderer } from '../cell.types';
import { Badge } from '@/components/ui';

const TONES = ['brand', 'sky', 'sun', 'ember', 'neutral'] as const;
type Tone = (typeof TONES)[number];

/** Deterministic tone picker so the same value always gets the same badge color. */
function toneFor(value: string): Tone {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length]!;
}

export const SelectCell: CellRenderer = ({ field, value }) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-paper-400">—</span>;
  }
  const options = field.type === 'select' ? field.options : [];
  const match = options.find((o) => o.value === value);
  const label = match?.label ?? String(value);
  return <Badge tone={toneFor(String(value))}>{label}</Badge>;
};

export const MultiSelectCell: CellRenderer = ({ field, value }) => {
  if (!Array.isArray(value) || value.length === 0) {
    return <span className="text-paper-400">—</span>;
  }
  const options = field.type === 'multiselect' ? field.options : [];
  return (
    <div className="flex flex-wrap gap-1">
      {value.slice(0, 4).map((v, i) => {
        const match = options.find((o) => o.value === v);
        const label = match?.label ?? String(v);
        return (
          <Badge key={`${String(v)}-${i}`} tone={toneFor(String(v))}>
            {label}
          </Badge>
        );
      })}
      {value.length > 4 && (
        <Badge>+{value.length - 4}</Badge>
      )}
    </div>
  );
};
