'use client';

import type { ModelEntry } from '../../types/prices';

interface ModelFilterProps {
  models: ModelEntry[];
  selectedIds: string[] | null;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}

/** Groups models by provider, preserving insertion order */
function groupByProvider(models: ModelEntry[]): Map<string, ModelEntry[]> {
  const groups = new Map<string, ModelEntry[]>();
  for (const model of models) {
    const existing = groups.get(model.provider);
    if (existing) {
      existing.push(model);
    } else {
      groups.set(model.provider, [model]);
    }
  }
  return groups;
}

export default function ModelFilter({ models, selectedIds, onToggle, onSelectAll }: ModelFilterProps) {
  // null means all selected
  const effectiveSelected = selectedIds ?? models.map((m) => m.id);
  const selectedSet = new Set(effectiveSelected);
  const totalCount = models.length;
  const selectedCount = effectiveSelected.length;
  const isFiltered = selectedIds !== null;

  const groups = groupByProvider(models);

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Models
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Compare All ({totalCount})
          </button>
        )}
      </div>

      {/* Provider groups */}
      {Array.from(groups.entries()).map(([provider, providerModels]) => (
        <div key={provider} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none mb-1">
            {provider}
          </p>
          {providerModels.map((model) => {
            const checked = selectedSet.has(model.id);
            // Block deselect when it would drop below 2 selected
            const wouldViolateMin = checked && selectedCount <= 2;

            return (
              <label
                key={model.id}
                data-testid={`model-filter-${model.id}`}
                className={[
                  'flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 text-sm',
                  'text-gray-700 hover:bg-gray-50 transition-colors select-none',
                  wouldViolateMin ? 'opacity-50' : '',
                ].join(' ')}
                title={wouldViolateMin ? 'At least 2 models must remain selected' : undefined}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={wouldViolateMin}
                  onChange={() => {
                    if (!wouldViolateMin) {
                      onToggle(model.id);
                    }
                  }}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="leading-snug">{model.display_name}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
