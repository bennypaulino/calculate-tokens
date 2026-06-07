'use client';

import { useMemo } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import type { ModelEntry } from '../../types/prices';
import type { CostRow } from '../../types/calculator';
import { computeCostRow } from '../../lib/costCalc';
import CostGridRow from './CostGridRow';
import CostRatioCallout from './CostRatioCallout';

interface Props {
  models: ModelEntry[];
}

type SortCol = 'name' | 'input' | 'output' | 'total' | 'context';

const HEADERS: { key: SortCol; label: string; align: string }[] = [
  { key: 'name', label: 'Model', align: 'text-left' },
  { key: 'input', label: 'Input tokens', align: 'text-right' },
  { key: 'output', label: 'Output tokens', align: 'text-right' },
  { key: 'input', label: 'Input cost', align: 'text-right' },
  { key: 'output', label: 'Output cost', align: 'text-right' },
  { key: 'total', label: 'Total cost', align: 'text-right' },
  { key: 'context', label: 'Context', align: 'text-right' },
];

export default function CostGrid({ models }: Props) {
  const modelTokenStates = useCalculatorStore((s) => s.modelTokenStates);
  const outputMultiplier = useCalculatorStore((s) => s.outputMultiplier);
  const thinkingEnabled = useCalculatorStore((s) => s.thinkingEnabled);
  const sortColumn = useCalculatorStore((s) => s.sortColumn);
  const sortDirection = useCalculatorStore((s) => s.sortDirection);
  const setSortColumn = useCalculatorStore((s) => s.setSortColumn);

  const rows = useMemo<CostRow[]>(() => {
    return models.map((model) => {
      const state = modelTokenStates[model.id];
      const inputTokens = state?.tokenCount ?? 0;
      const inputStatus = state?.status ?? 'pending';

      const computed = computeCostRow(model, inputTokens, outputMultiplier, thinkingEnabled);

      return {
        ...computed,
        inputStatus,
        outputStatus: inputStatus,
      };
    });
  }, [models, modelTokenStates, outputMultiplier, thinkingEnabled]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === 'name') {
        cmp = a.modelName.localeCompare(b.modelName);
      } else if (sortColumn === 'input') {
        cmp = a.inputCost - b.inputCost;
      } else if (sortColumn === 'output') {
        cmp = a.outputCost - b.outputCost;
      } else {
        cmp = a.totalCost - b.totalCost;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortColumn, sortDirection]);

  const cheapestId = rows.reduce<string | null>((cheapId, row) => {
    if (row.totalCost === 0) return cheapId;
    if (!cheapId) return row.modelId;
    const cheapRow = rows.find((r) => r.modelId === cheapId);
    return cheapRow && row.totalCost < cheapRow.totalCost ? row.modelId : cheapId;
  }, null);

  const SortIcon = ({ col }: { col: string }) => {
    if (col !== sortColumn) {
      return <span className="ml-1 text-gray-300 text-xs">↕</span>;
    }
    return (
      <span className="ml-1 text-blue-500 text-xs">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th
                scope="col"
                className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                onClick={() => setSortColumn('name')}
              >
                Model <SortIcon col="name" />
              </th>
              <th scope="col" className="py-2.5 px-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Input tokens
              </th>
              <th scope="col" className="py-2.5 px-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Output tokens
              </th>
              <th
                scope="col"
                className="py-2.5 px-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                onClick={() => setSortColumn('input')}
              >
                Input cost <SortIcon col="input" />
              </th>
              <th
                scope="col"
                className="py-2.5 px-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                onClick={() => setSortColumn('output')}
              >
                Output cost <SortIcon col="output" />
              </th>
              <th
                scope="col"
                className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                onClick={() => setSortColumn('total')}
              >
                Total cost <SortIcon col="total" />
              </th>
              <th scope="col" className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Context
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <CostGridRow
                key={row.modelId}
                row={row}
                isCheapest={row.modelId === cheapestId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <CostRatioCallout rows={rows} />
    </div>
  );
}
