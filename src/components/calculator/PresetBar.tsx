'use client';

import { useState } from 'react';
import presets from '../../data/presets.json';

interface Preset {
  id: string;
  label: string;
  charCountWarning: string | null;
  text: string;
}

interface Props {
  onSelect: (text: string, id: string) => void;
  activePresetId: string | null;
  className?: string;
}

export default function PresetBar({ onSelect, activePresetId, className }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleSelect = (preset: Preset) => {
    onSelect(preset.text, preset.id);
    window.umami?.track('preset_selected', { preset_name: preset.id });
  };

  return (
    <div className={className ?? 'flex items-center gap-2 flex-wrap'}>
      <span className="text-xs text-gray-500 font-medium shrink-0">Presets:</span>
      {(presets as Preset[]).map((preset) => {
        const isActive = preset.id === activePresetId;
        const tooltipText = preset.charCountWarning
          ? preset.charCountWarning
          : preset.text.slice(0, 100);

        return (
          <div key={preset.id} className="relative">
            <button
              data-testid={`preset-${preset.id}`}
              onClick={() => handleSelect(preset)}
              onMouseEnter={() => setTooltip(preset.id)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => setTooltip(preset.id)}
              onBlur={() => setTooltip(null)}
              className={[
                'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors',
                isActive
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              {preset.label}
            </button>

            {tooltip === preset.id && (
              <div
                role="tooltip"
                className="absolute bottom-full left-0 mb-1.5 z-10 w-56 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg pointer-events-none"
              >
                {tooltipText}
                {tooltipText.length === 100 && '…'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
