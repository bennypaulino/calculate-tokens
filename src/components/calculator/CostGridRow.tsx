import type { CostRow } from '../../types/calculator';
import { formatCost } from '../../lib/tokenCount';
import ContextWindowCell from './ContextWindowCell';
import { t } from '../../lib/i18n';

interface Props {
  row: CostRow;
  isCheapest: boolean;
  stalenessLevel: 'fresh' | 'amber' | 'red';
  lastVerified: string;
}

const statusSymbol = {
  pending: { symbol: '·', title: t('grid.statusPending'), className: 'text-ct-faint' },
  heuristic: { symbol: '~', title: t('grid.statusApprox'), className: 'text-ct-muted' },
  wasm: { symbol: '', title: t('grid.statusExact'), className: 'text-ct-exact' },
  error: { symbol: '?', title: t('grid.statusUnavailable'), className: 'text-ct-error' },
};

export default function CostGridRow({ row, isCheapest, stalenessLevel, lastVerified }: Props) {
  const inputStatus = statusSymbol[row.inputStatus];
  const totalStatus = statusSymbol[row.inputStatus];

  return (
    <tr
      className="border-b border-ct-border-subtle last:border-0 transition-colors"
      style={isCheapest ? { background: 'var(--status-exact-tint)' } : undefined}
      onMouseEnter={(e) => {
        if (!isCheapest) (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = isCheapest ? 'var(--status-exact-tint)' : '';
      }}
    >
      <td className="py-3 pl-4 pr-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ct-strong leading-tight">
            {stalenessLevel === 'amber' && (
              <span
                className="text-ct-accent mr-1"
                aria-label={t('grid.stalenessWarningAria', { date: lastVerified })}
              >●</span>
            )}
            {stalenessLevel === 'red' && (
              <span
                className="text-ct-error mr-1"
                aria-label={t('grid.stalenessOutdatedAria')}
              >⚠</span>
            )}
            {row.modelName}
          </span>
          <span className="text-xs text-ct-subtle">{row.provider}</span>
        </div>
      </td>

      <td className="py-3 px-2 text-right font-mono tabular-nums">
        <span
          className={`text-sm ${inputStatus.className}`}
          title={inputStatus.title}
        >
          {row.inputStatus === 'heuristic' && <span className="text-xs mr-0.5">~</span>}
          {row.inputTokens.toLocaleString()}
        </span>
      </td>

      <td className="py-3 px-2 text-right font-mono tabular-nums">
        <span className="text-sm text-ct-body">{row.outputTokens.toLocaleString()}</span>
      </td>

      <td
        className="py-3 px-2 text-right font-mono tabular-nums"
        data-model={row.modelId}
        data-price-input={row.inputCost.toFixed(6)}
      >
        <span className="text-sm text-ct-body">{formatCost(row.inputCost)}</span>
      </td>

      <td
        className="py-3 px-2 text-right font-mono tabular-nums"
        data-price-output={row.outputCost.toFixed(6)}
      >
        <span className="text-sm text-ct-body">{formatCost(row.outputCost)}</span>
      </td>

      <td className="py-3 pl-2 pr-4 text-right font-mono tabular-nums">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`text-sm font-semibold ${isCheapest ? 'text-ct-exact' : 'text-ct-strong'}`}
            title={totalStatus.title}
          >
            {row.inputStatus === 'heuristic' && (
              <span className="text-xs font-normal mr-0.5 text-ct-muted">~</span>
            )}
            {formatCost(row.totalCost)}
          </span>
          {isCheapest && (
            <span className="text-xs text-ct-exact font-medium leading-none">{t('simulator.cheapestBadge')}</span>
          )}
        </div>
      </td>

      <td className="py-3 pl-2 pr-4 text-right">
        <ContextWindowCell contextWindow={row.contextWindow} inputTokens={row.inputTokens} />
      </td>
    </tr>
  );
}
