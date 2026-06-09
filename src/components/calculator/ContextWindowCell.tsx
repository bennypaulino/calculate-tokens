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
        className={`text-xs font-medium font-mono tabular-nums ${overLimit ? 'text-ct-error font-semibold' : 'text-ct-muted'}`}
        title={overLimit ? `Exceeds context window (${inputTokens.toLocaleString()} > ${contextWindow.toLocaleString()})` : undefined}
      >
        {overLimit && <span className="mr-0.5" aria-label="Exceeds limit">⚠</span>}
        {formatContextWindow(contextWindow)}
      </span>
      {inputTokens > 0 && (
        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: overLimit
                ? 'var(--status-error)'
                : pct > 80
                ? 'var(--accent)'
                : 'var(--status-exact)',
            }}
          />
        </div>
      )}
    </div>
  );
}
