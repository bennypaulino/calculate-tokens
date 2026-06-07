'use client';

import { useCallback } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';

interface Props {
  onTextChange?: (text: string) => void;
}

export default function PromptTextarea({ onTextChange }: Props) {
  const text = useCalculatorStore((s) => s.text);
  const setText = useCalculatorStore((s) => s.setText);
  const modelTokenStates = useCalculatorStore((s) => s.modelTokenStates);

  const charCount = text.length;

  // Representative token display: use first model's count if available
  const firstState = Object.values(modelTokenStates)[0];
  const tokenDisplay = firstState
    ? `${firstState.status === 'heuristic' ? '~' : ''}${firstState.tokenCount.toLocaleString()} tokens`
    : null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);
      onTextChange?.(value);
    },
    [setText, onTextChange]
  );

  return (
    <div className="relative">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Paste your prompt here to calculate token counts and costs across all models…"
        className="w-full min-h-[160px] sm:min-h-[200px] px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 leading-relaxed"
        aria-label="Prompt text"
        spellCheck={false}
      />
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{charCount.toLocaleString()} chars</span>
          {tokenDisplay && <span>{tokenDisplay}</span>}
        </div>
        {text && (
          <button
            onClick={() => { setText(''); onTextChange?.(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear text"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
