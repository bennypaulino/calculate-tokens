import type { CostRow } from '../../types/calculator';
import { formatCost } from '../../lib/tokenCount';
import ContextWindowCell from './ContextWindowCell';

interface Props {
  row: CostRow;
  isCheapest: boolean;
  stalenessLevel: 'fresh' | 'amber' | 'red';
  lastVerified: string;
}

const statusSymbol = {
  pending: { symbol: '·', title: 'Pending', className: 'text-gray-300' },
  heuristic: { symbol: '~', title: 'Approximate (÷4 heuristic)', className: 'text-gray-500' },
  wasm: { symbol: '', title: 'Exact (model tokenizer)', className: 'text-green-600' },
  error: { symbol: '?', title: 'Exact tokenization unavailable for this model', className: 'text-red-400' },
};

export default function CostGridRow({ row, isCheapest, stalenessLevel, lastVerified }: Props) {
  const inputStatus = statusSymbol[row.inputStatus];
  const totalStatus = statusSymbol[row.inputStatus];

  return (
    <tr
      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${isCheapest ? 'bg-green-50/50' : ''}`}
    >
      <td className="py-3 pl-4 pr-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 leading-tight">
            {stalenessLevel === 'amber' && (
              <span
                className="text-amber-500 mr-1"
                aria-label={"Pricing last verified " + lastVerified + " — may have changed"}
              >●</span>
            )}
            {stalenessLevel === 'red' && (
              <span
                className="text-red-500 mr-1"
                aria-label="Pricing unverified for 30+ days — confirm at provider"
              >⚠</span>
            )}
            {row.modelName}
          </span>
          <span className="text-xs text-gray-500">{row.provider}</span>
        </div>
      </td>

      <td className="py-3 px-2 text-right tabular-nums">
        <span
          className={`text-sm ${inputStatus.className}`}
          title={inputStatus.title}
        >
          {row.inputStatus === 'heuristic' && <span className="text-xs mr-0.5">~</span>}
          {row.inputTokens.toLocaleString()}
        </span>
      </td>

      <td className="py-3 px-2 text-right tabular-nums">
        <span className="text-sm text-gray-700">{row.outputTokens.toLocaleString()}</span>
      </td>

      <td
        className="py-3 px-2 text-right tabular-nums"
        data-model={row.modelId}
        data-price-input={row.inputCost.toFixed(6)}
      >
        <span className="text-sm text-gray-700">{formatCost(row.inputCost)}</span>
      </td>

      <td
        className="py-3 px-2 text-right tabular-nums"
        data-price-output={row.outputCost.toFixed(6)}
      >
        <span className="text-sm text-gray-700">{formatCost(row.outputCost)}</span>
      </td>

      <td className="py-3 pl-2 pr-4 text-right tabular-nums">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`text-sm font-semibold ${isCheapest ? 'text-green-700' : 'text-gray-900'}`}
            title={totalStatus.title}
          >
            {row.inputStatus === 'heuristic' && (
              <span className="text-xs font-normal mr-0.5 text-gray-500">~</span>
            )}
            {formatCost(row.totalCost)}
          </span>
          {isCheapest && (
            <span className="text-xs text-green-700 font-medium leading-none">cheapest</span>
          )}
        </div>
      </td>

      <td className="py-3 pl-2 pr-4 text-right">
        <ContextWindowCell contextWindow={row.contextWindow} inputTokens={row.inputTokens} />
      </td>
    </tr>
  );
}
