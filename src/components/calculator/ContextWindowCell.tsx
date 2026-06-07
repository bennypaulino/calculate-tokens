import { formatContextWindow } from '../../lib/tokenCount';

interface Props {
  contextWindow: number;
  inputTokens: number;
}

export default function ContextWindowCell({ contextWindow, inputTokens }: Props) {
  const overLimit = inputTokens > contextWindow;
  const pct = contextWindow > 0 ? Math.min((inputTokens / contextWindow) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-0.5 items-end">
      <span
        className={`text-xs font-medium tabular-nums ${overLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
        title={overLimit ? `Exceeds context window (${inputTokens.toLocaleString()} > ${contextWindow.toLocaleString()})` : undefined}
      >
        {overLimit && <span className="mr-0.5" aria-label="Exceeds limit">⚠</span>}
        {formatContextWindow(contextWindow)}
      </span>
      {inputTokens > 0 && (
        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
