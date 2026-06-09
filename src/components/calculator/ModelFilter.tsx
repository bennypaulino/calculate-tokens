'use client';

import type { ModelEntry } from '../../types/prices';
import { t } from '../../lib/i18n';

interface ModelFilterProps {
  models: ModelEntry[];
  selectedIds: string[] | null;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}

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
  const effectiveSelected = selectedIds ?? models.map((m) => m.id);
  const selectedSet = new Set(effectiveSelected);
  const totalCount = models.length;
  const selectedCount = effectiveSelected.length;
  const isFiltered = selectedIds !== null;

  const groups = groupByProvider(models);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ct-muted uppercase tracking-wide">
          {t('calculator.modelsHeading')}
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-ct-accent hover:text-ct-accent-h font-medium transition-colors"
          >
            {t('calculator.compareAll', { count: totalCount })}
          </button>
        )}
      </div>

      {Array.from(groups.entries()).map(([provider, providerModels]) => (
        <div key={provider} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-ct-subtle uppercase tracking-wide leading-none mb-1">
            {provider}
          </p>
          {providerModels.map((model) => {
            const checked = selectedSet.has(model.id);
            const wouldViolateMin = checked && selectedCount <= 2;

            return (
              <label
                key={model.id}
                data-testid={`model-filter-${model.id}`}
                className={[
                  'flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 text-sm',
                  'text-ct-body transition-colors select-none',
                  wouldViolateMin ? 'opacity-50' : 'hover:bg-ct-raised',
                ].join(' ')}
                title={wouldViolateMin ? t('calculator.modelsMinSelectedTooltip') : undefined}
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
                  className="h-3.5 w-3.5 rounded border-ct-border accent-ct-accent disabled:cursor-not-allowed"
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
