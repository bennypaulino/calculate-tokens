'use client';

import { useCalculatorStore } from '../../store/calculatorStore';

const STEPS = [0.25, 0.5, 1, 2, 3, 5, 10];

interface Props {
  hasThinkingModels: boolean;
}

export default function OutputSlider({ hasThinkingModels }: Props) {
  const outputMultiplier = useCalculatorStore((s) => s.outputMultiplier);
  const thinkingEnabled = useCalculatorStore((s) => s.thinkingEnabled);
  const setOutputMultiplier = useCalculatorStore((s) => s.setOutputMultiplier);
  const setThinkingEnabled = useCalculatorStore((s) => s.setThinkingEnabled);

  const stepIndex = STEPS.indexOf(outputMultiplier);
  const currentIndex = stepIndex >= 0 ? stepIndex : 2;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    setOutputMultiplier(STEPS[idx]);
  };

  const label =
    outputMultiplier === 1
      ? 'Same as input'
      : outputMultiplier < 1
      ? `${outputMultiplier}× input`
      : `${outputMultiplier}× input`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="output-slider" className="text-sm font-medium text-gray-700">
          Output length
        </label>
        <span className="text-sm text-gray-500 tabular-nums">{label}</span>
      </div>

      <input
        id="output-slider"
        type="range"
        min={0}
        max={STEPS.length - 1}
        step={1}
        value={currentIndex}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        aria-valuetext={label}
      />

      <div className="flex justify-between text-xs text-gray-400 -mt-1 select-none" aria-hidden>
        {STEPS.map((s) => (
          <span key={s}>{s}×</span>
        ))}
      </div>

      {hasThinkingModels && (
        <label className="flex items-center gap-2.5 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={thinkingEnabled}
            onChange={(e) => setThinkingEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-sm text-gray-700">
            Include thinking tokens
            <span className="text-gray-400 ml-1 text-xs">(o4-mini, DeepSeek R1)</span>
          </span>
        </label>
      )}
    </div>
  );
}
