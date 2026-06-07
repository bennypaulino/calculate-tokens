'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { fetchPrices, getStalenessLevel } from '../../lib/prices';
import { WorkerManager } from '../../lib/workerManager';
import { decodeUrlState, encodeUrlState } from '../../lib/urlState';
import type { PricesData, ModelEntry } from '../../types/prices';
import PromptTextarea from './PromptTextarea';
import OutputSlider from './OutputSlider';
import CostGrid from './CostGrid';
import StalenessIndicator from './StalenessIndicator';
import OfflineBanner from './OfflineBanner';
import PresetsPlaceholder from './PresetsPlaceholder';
import AdSlotPlaceholder from './AdSlotPlaceholder';

// Module-level singleton — survives React re-renders
const workerManagerSingleton = new WorkerManager();

export default function CalculatorShell() {
  const [pricesData, setPricesData] = useState<PricesData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [offlineBanner, setOfflineBanner] = useState(false);

  const setText = useCalculatorStore((s) => s.setText);
  const text = useCalculatorStore((s) => s.text);
  const outputMultiplier = useCalculatorStore((s) => s.outputMultiplier);
  const thinkingEnabled = useCalculatorStore((s) => s.thinkingEnabled);
  const setOutputMultiplier = useCalculatorStore((s) => s.setOutputMultiplier);
  const setThinkingEnabled = useCalculatorStore((s) => s.setThinkingEnabled);
  const initializeModelStates = useCalculatorStore((s) => s.initializeModelStates);
  const setModelTokenState = useCalculatorStore((s) => s.setModelTokenState);

  const activeModelsRef = useRef<ModelEntry[]>([]);

  // Load prices and initialize
  useEffect(() => {
    fetchPrices()
      .then((data) => {
        setPricesData(data);
        const active = data.models.filter((m) => m.active);
        activeModelsRef.current = active;

        // Decode URL state
        const urlState = decodeUrlState(window.location.search);
        if (urlState.out !== undefined) setOutputMultiplier(urlState.out);
        if (urlState.think !== undefined) setThinkingEnabled(urlState.think);

        const charCount = useCalculatorStore.getState().text.length;
        initializeModelStates(active.map((m) => m.id), charCount);
      })
      .catch(() => setLoadError(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none', scope: '/' })
        .catch(() => {});

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PRICES_STALE') {
          setOfflineBanner(true);
        }
        if (event.data?.type === 'PRICES_UPDATED') {
          setOfflineBanner(false);
        }
      });
    }
  }, []);

  // Sync URL state when relevant values change
  useEffect(() => {
    if (!pricesData) return;
    const encoded = encodeUrlState({ out: outputMultiplier, think: thinkingEnabled });
    const newUrl = `${window.location.pathname}${encoded}`;
    window.history.replaceState(null, '', newUrl);
  }, [outputMultiplier, thinkingEnabled, pricesData]);

  // Tokenize text when it changes
  const tokenizeAll = useCallback(
    (newText: string) => {
      const active = activeModelsRef.current;
      if (!active.length) return;

      workerManagerSingleton.cancelAll();

      for (const model of active) {
        workerManagerSingleton.tokenize(
          model.id,
          newText,
          model.tokenizer,
          model.tokenizer === 'o200k_base' || model.tokenizer === 'cl100k_base'
            ? model.tokenizer
            : undefined,
          (tokenCount, isWasm) => {
            setModelTokenState(model.id, {
              tokenCount,
              status: isWasm ? 'wasm' : 'heuristic',
            });
          },
          () => {
            setModelTokenState(model.id, { status: 'error' });
          }
        );
      }
    },
    [setModelTokenState]
  );

  // Watch text changes via store subscription
  useEffect(() => {
    const unsub = useCalculatorStore.subscribe(
      (state) => state.text,
      (text) => tokenizeAll(text)
    );
    return unsub;
  }, [tokenizeAll]);

  // Handle thinking toggle: remove URL param if no thinking models active
  useEffect(() => {
    if (!pricesData) return;
    const hasThinkingModels = activeModelsRef.current.some((m) => m.thinking_model);
    if (!hasThinkingModels && thinkingEnabled) {
      setThinkingEnabled(false);
    }
  }, [pricesData, thinkingEnabled, setThinkingEnabled]);

  const activeModels = pricesData?.models.filter((m) => m.active) ?? [];
  const hasThinkingModels = activeModels.some((m) => m.thinking_model);

  // Staleness: use worst staleness across all active models
  const stalenessLevel = pricesData
    ? activeModels.reduce<'fresh' | 'amber' | 'red'>((worst, m) => {
        const level = getStalenessLevel(m.last_human_verified);
        if (level === 'red') return 'red';
        if (level === 'amber' && worst === 'fresh') return 'amber';
        return worst;
      }, 'fresh')
    : 'fresh';

  const oldestVerified = pricesData
    ? activeModels.reduce((oldest, m) =>
        m.last_human_verified < oldest ? m.last_human_verified : oldest,
        activeModels[0]?.last_human_verified ?? ''
      )
    : '';

  if (loadError) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-8 text-center">
        <p className="text-red-700 text-sm font-medium">Failed to load pricing data.</p>
        <p className="text-red-500 text-xs mt-1">Please refresh the page to try again.</p>
      </div>
    );
  }

  if (!pricesData) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm mt-2">Loading pricing data…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner show={offlineBanner} />

      {/* Presets row */}
      <PresetsPlaceholder />

      {/* Textarea */}
      <PromptTextarea onTextChange={tokenizeAll} />

      {/* Controls row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <OutputSlider hasThinkingModels={hasThinkingModels} />

        <div className="flex items-end justify-end sm:justify-start">
          <StalenessIndicator level={stalenessLevel} lastVerified={oldestVerified} />
        </div>
      </div>

      {/* Cost grid */}
      <CostGrid models={activeModels} />

      {/* Ad slot */}
      <AdSlotPlaceholder />
    </div>
  );
}
