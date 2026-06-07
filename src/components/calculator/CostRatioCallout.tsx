import type { CostRow } from '../../types/calculator';
import { formatCost } from '../../lib/tokenCount';

interface Props {
  rows: CostRow[];
}

export default function CostRatioCallout({ rows }: Props) {
  const withCost = rows.filter((r) => r.totalCost > 0);
  if (withCost.length < 2) return null;

  const sorted = [...withCost].sort((a, b) => a.totalCost - b.totalCost);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  const ratio = priciest.totalCost / cheapest.totalCost;

  if (ratio < 10) return null;

  return (
    <p role="status" aria-live="polite" className="text-xs text-gray-500 text-center">
      <span className="font-medium text-gray-700">{cheapest.modelName}</span> is{' '}
      <span className="font-medium text-gray-900">{Math.round(ratio)}x</span> cheaper than{' '}
      <span className="font-medium text-gray-700">{priciest.modelName}</span> for this prompt
      {' '}({formatCost(cheapest.totalCost)} vs {formatCost(priciest.totalCost)}).
    </p>
  );
}
