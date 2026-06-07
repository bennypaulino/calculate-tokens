'use client';

import { useCalculatorStore } from '../../store/calculatorStore';
import type { ModelEntry } from '../../types/prices';

interface Props {
  activeModels: ModelEntry[];
}

const TICKS: { value: number; label: string }[] = [
  { value: 0, label: '0' },
  { value: 500, label: '500' },
  { value: 1000, label: '1k' },
  { value: 2000, label: '2k' },
  { value: 4000, label: '4k' },
  { value: 8000, label: '8k' },
];

export default function OutputSlider({ activeModels }: Props) {
  const outputTokens = useCalculatorStore((s) => s.outputTokens);
  const thinkingEnabled = useCalculatorStore((s) => s.thinkingEnabled);
  const setOutputTokens = useCalculatorStore((s) => s.setOutputTokens);
  const setThinkingEnabled = useCalculatorStore((s) => s.setThinkingEnabled);

  const hasThinkingModels = activeModels.some((m) => m.thinking_model);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setOutputTokens(value);
    window.umami?.track('output_slider_adjusted', { value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="output-slider" className="text-sm font-medium text-gray-700">
          Output tokens
        </label>
        <span className="text-sm text-gray-500 tabular-nums">
          {outputTokens.toLocaleString()} tokens
        </span>
      </div>

      <input
        id="output-slider"
        type="range"
        min={0}
        max={8000}
        step={1}
        value={outputTokens}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        aria-label="Output token estimate"
        aria-valuemin={0}
        aria-valuemax={8000}
        aria-valuenow={outputTokens}
      />

      <div className="flex justify-between text-xs text-gray-400 -mt-1 select-none" aria-hidden>
        {TICKS.map((tick) => (
          <span key={tick.value}>{tick.label}</span>
        ))}
      </div>

      {hasThinkingModels && (
        <div className="flex flex-col gap-2 mt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={thinkingEnabled}
              onChange={(e) => {
                setThinkingEnabled(e.target.checked);
                if (e.target.checked) {
                  const firstThinkingModelId =
                    activeModels.find((m) => m.thinking_model)?.id ?? '';
                  window.umami?.track('thinking_toggle_enabled', {
                    model: firstThinkingModelId,
                  });
                }
              }}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              Include thinking tokens
            </span>
          </label>

          {thinkingEnabled && activeModels
            .filter((m) => m.thinking_model)
            .map((m) => {
              if (m.thinking_billed_separately && m.thinking_multiplier !== null) {
                return (
                  <p key={m.id} className="text-xs text-gray-500 ml-6">
                    {m.display_name}: +&nbsp;~{Math.round(outputTokens * m.thinking_multiplier).toLocaleString()} thinking tokens estimated
                  </p>
                );
              }
              if (!m.thinking_billed_separately) {
                return (
                  <p
                    key={m.id}
                    className="text-xs text-gray-500 ml-6"
                    title="DeepSeek R1 includes thinking in its output token pricing — no additional cost is applied"
                  >
                    {m.display_name}: thinking included in output pricing
                  </p>
                );
              }
              return null;
            })}
        </div>
      )}
    </div>
  );
}
