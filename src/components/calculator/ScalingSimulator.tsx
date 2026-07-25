'use client';

import { useCallback } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { formatCost } from '../../lib/tokenCount';
import { rowsToCsv } from '../../lib/csv';
import { resolveRates } from '../../lib/costCalc';
import type { ModelEntry } from '../../types/prices';
import type { ModelTokenState } from '../../types/calculator';
import { t } from '../../lib/i18n';

interface ScalingSimulatorProps {
  models: ModelEntry[];
  tokenStates: Record<string, ModelTokenState>;
  outputTokens: number;
}

interface SimRow {
  modelId: string;
  modelName: string;
  provider: string;
  monthlyTotal: number;
  cachingApplied: boolean;
  batchApplied: boolean;
  longContextApplied: boolean;
  inputTokens: number;
}

const VOLUME_PRESETS = [
  { label: '100', value: 100 },
  { label: '1K', value: 1_000 },
  { label: '10K', value: 10_000 },
  { label: '100K', value: 100_000 },
  { label: '1M', value: 1_000_000 },
] as const;

function formatMonthly(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost >= 1_000_000) return `$${(cost / 1_000_000).toFixed(2)}M`;
  if (cost >= 1_000) return `$${(cost / 1_000).toFixed(2)}K`;
  if (cost >= 1) return `$${cost.toFixed(2)}`;
  if (cost >= 0.01) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(4)}`;
}

export default function ScalingSimulator({
  models,
  tokenStates,
  outputTokens,
}: ScalingSimulatorProps) {
  const volumeRequests = useCalculatorStore((s) => s.volumeRequests);
  const cachingEnabled = useCalculatorStore((s) => s.cachingEnabled);
  const batchEnabled = useCalculatorStore((s) => s.batchEnabled);
  const setVolumeRequests = useCalculatorStore((s) => s.setVolumeRequests);
  const setCachingEnabled = useCalculatorStore((s) => s.setCachingEnabled);
  const setBatchEnabled = useCalculatorStore((s) => s.setBatchEnabled);

  const anySupportsCaching = models.some((m) => m.supports_context_caching);

  const rows: SimRow[] = models.map((m) => {
    const inputTokens = tokenStates[m.id]?.tokenCount ?? 0;

    const cachingApplied = cachingEnabled && m.supports_context_caching;
    const cachingFactor =
      cachingApplied && m.context_caching_discount !== null
        ? 1 - m.context_caching_discount
        : 1;

    const batchApplied = batchEnabled && m.supports_batch_api;
    const batchFactor =
      batchApplied && m.batch_api_discount !== null
        ? 1 - m.batch_api_discount
        : 1;

    // The long-context threshold is evaluated per request, not against the
    // monthly aggregate -- providers price each request independently.
    const rates = resolveRates(m, inputTokens);

    const monthlyInput =
      (inputTokens / 1_000_000) * rates.inputCostPer1m * cachingFactor;
    const monthlyOutput = (outputTokens / 1_000_000) * rates.outputCostPer1m;
    const perRequest = (monthlyInput + monthlyOutput) * batchFactor;
    const monthlyTotal = perRequest * volumeRequests;

    return {
      modelId: m.id,
      modelName: m.display_name,
      provider: m.provider,
      monthlyTotal,
      cachingApplied,
      batchApplied,
      longContextApplied: rates.longContextApplied,
      inputTokens,
    };
  });

  const sorted = [...rows].sort((a, b) => a.monthlyTotal - b.monthlyTotal);
  const cheapest = sorted[0]?.monthlyTotal ?? 0;

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') return;
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed)) return;
      const clamped = Math.max(1, Math.min(100_000_000, parsed));
      setVolumeRequests(clamped);
      window.umami?.track('scaling_simulator_used', { locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en' });
    },
    [setVolumeRequests]
  );

  const handlePresetClick = useCallback(
    (value: number) => {
      setVolumeRequests(value);
      window.umami?.track('scaling_simulator_used', { locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en' });
    },
    [setVolumeRequests]
  );

  const handleExportCsv = useCallback(() => {
    const isoDate = new Date().toISOString().slice(0, 10);
    const headers = [
      'Model',
      'Provider',
      'Monthly Requests',
      'Input Tokens',
      'Output Tokens',
      'Caching Applied',
      'Batch Applied',
      'Long Context Rate',
      'Monthly Cost (USD)',
    ];

    const csvRows = sorted.map((r) => ({
      Model: r.modelName,
      Provider: r.provider,
      'Monthly Requests': volumeRequests,
      'Input Tokens': r.inputTokens,
      'Output Tokens': outputTokens,
      'Caching Applied': r.cachingApplied ? 'Yes' : 'No',
      'Batch Applied': r.batchApplied ? 'Yes' : 'No',
      'Long Context Rate': r.longContextApplied ? 'Yes' : 'No',
      'Monthly Cost (USD)': r.monthlyTotal.toFixed(4),
    }));

    const csv = rowsToCsv(csvRows, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculatetokens-estimate-${isoDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, volumeRequests, outputTokens]);

  if (models.length === 0) return null;

  return (
    <section
      aria-labelledby="scaling-simulator-heading"
      className="border border-ct-border rounded-xl p-5 flex flex-col gap-5"
      style={{ background: 'var(--surface-card)' }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2
          id="scaling-simulator-heading"
          className="text-sm font-semibold text-ct-strong"
        >
          {t('simulator.heading')}
        </h2>
        <button
          type="button"
          onClick={handleExportCsv}
          className="text-xs text-ct-accent hover:text-ct-accent-h font-medium underline underline-offset-2 transition-colors"
        >
          {t('simulator.exportCsv')}
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="volume-requests"
            className="text-xs font-medium text-ct-muted"
          >
            {t('simulator.monthlyRequests')}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              id="volume-requests"
              type="number"
              min={1}
              max={100000000}
              value={volumeRequests}
              onChange={handleVolumeChange}
              className="w-32 border border-ct-border rounded-md px-3 py-1.5 text-sm text-ct-strong font-mono focus:outline-none focus:ring-2 focus:ring-ct-accent"
              style={{ background: 'var(--surface-sunken)' }}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {VOLUME_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetClick(p.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors border"
                  style={
                    volumeRequests === p.value
                      ? {
                          background: 'var(--accent-tint)',
                          borderColor: 'var(--accent-line)',
                          color: 'var(--accent)',
                        }
                      : {
                          background: 'var(--surface-control)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 flex-wrap">
          {anySupportsCaching && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cachingEnabled}
                onChange={(e) => setCachingEnabled(e.target.checked)}
                className="w-4 h-4 accent-ct-accent"
              />
              <span className="text-xs text-ct-body">{t('simulator.cachingLabel')}</span>
            </label>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={batchEnabled}
              onChange={(e) => setBatchEnabled(e.target.checked)}
              className="w-4 h-4 accent-ct-accent"
            />
            <span className="text-xs text-ct-body">{t('simulator.batchLabel')}</span>
          </label>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-ct-border">
              <th className="text-left py-2 pr-4 font-medium text-ct-muted">
                {t('grid.colModel')}
              </th>
              <th className="text-right py-2 pr-4 font-medium text-ct-muted">
                {t('simulator.colMonthlyCost')}
              </th>
              <th className="text-right py-2 font-medium text-ct-muted">
                {t('simulator.colVsCheapest')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const isCheapest = i === 0;
              const delta = row.monthlyTotal - cheapest;
              return (
                <tr
                  key={row.modelId}
                  className="border-b border-ct-border-subtle last:border-0"
                >
                  <td className="py-2 pr-4 text-ct-body">
                    <span className="font-medium">{row.modelName}</span>
                    <span className="text-ct-subtle ml-1">({row.provider})</span>
                    {row.cachingApplied && (
                      <span className="ml-1 text-ct-exact" title="Caching applied">
                        cache
                      </span>
                    )}
                    {row.batchApplied && (
                      <span className="ml-1 text-ct-accent" title="Batch applied">
                        batch
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-ct-strong">
                    {formatMonthly(row.monthlyTotal)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {isCheapest ? (
                      <span className="text-ct-exact font-medium">{t('simulator.cheapestBadge')}</span>
                    ) : (
                      <span className="text-ct-subtle">
                        +{formatCost(delta)}/mo
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ct-subtle">
        {t('simulator.disclaimer')}
      </p>
    </section>
  );
}
