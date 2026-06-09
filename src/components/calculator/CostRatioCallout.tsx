import type { CostRow } from '../../types/calculator';
import { formatCost } from '../../lib/tokenCount';
import { t } from '../../lib/i18n';

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
    <p role="status" aria-live="polite" className="text-xs text-ct-subtle text-center">
      {t('grid.cheaperCallout', {
        cheapest: cheapest.modelName,
        ratio: String(Math.round(ratio)),
        priciest: priciest.modelName,
        cheapCost: formatCost(cheapest.totalCost),
        priciestCost: formatCost(priciest.totalCost),
      })}
    </p>
  );
}
