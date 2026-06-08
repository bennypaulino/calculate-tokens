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
import PresetBar from './PresetBar';
import ModelFilter from './ModelFilter';
import AdSlotPlaceholder from './AdSlotPlaceholder';
import AdSlotSidebar from './AdSlotSidebar';
import ShareButton from './ShareButton';
import ScalingSimulator from './ScalingSimulator';

// Module-level singleton — survives React re-renders
const workerManagerSingleton = new WorkerManager();

export default function CalculatorShell() {
  const [pricesData, setPricesData] = useState<PricesData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setText = useCalculatorStore((s) => s.setText);
  const text = useCalculatorStore((s) => s.text);
  const outputTokens = useCalculatorStore((s) => s.outputTokens);
  const thinkingEnabled = useCalculatorStore((s) => s.thinkingEnabled);
  const setOutputTokens = useCalculatorStore((s) => s.setOutputTokens);
  const setThinkingEnabled = useCalculatorStore((s) => s.setThinkingEnabled);
  const initializeModelStates = useCalculatorStore((s) => s.initializeModelStates);
  const setModelTokenState = useCalculatorStore((s) => s.setModelTokenState);
  const selectedModelIds = useCalculatorStore((s) => s.selectedModelIds);
  const setSelectedModelIds = useCalculatorStore((s) => s.setSelectedModelIds);
  const modelTokenStates = useCalculatorStore((s) => s.modelTokenStates);
  const volumeRequests = useCalculatorStore((s) => s.volumeRequests);
  const cachingEnabled = useCalculatorStore((s) => s.cachingEnabled);
  const batchEnabled = useCalculatorStore((s) => s.batchEnabled);
  const setVolumeRequests = useCalculatorStore((s) => s.setVolumeRequests);
  const setCachingEnabled = useCalculatorStore((s) => s.setCachingEnabled);
  const setBatchEnabled = useCalculatorStore((s) => s.setBatchEnabled);

  const activeModelsRef = useRef<ModelEntry[]>([]);
  const hasTrackedFilterRef = useRef<boolean>(false);

  // Load prices and initialize
  useEffect(() => {
    fetchPrices()
      .then((data) => {
        setPricesData(data);
        const active = data.models.filter((m) => m.active);
        activeModelsRef.current = active;

        // Decode URL state
        // AC-2.4.6: URLSearchParams never assigns to arbitrary object props, so prototype
        // pollution params (e.g. __proto__, constructor) are silently discarded.
        const urlState = decodeUrlState(window.location.search);
        if (urlState.out !== undefined) setOutputTokens(urlState.out);
        if (urlState.think !== undefined) setThinkingEnabled(urlState.think);
        if (urlState.vol !== undefined) setVolumeRequests(urlState.vol);
        if (urlState.cache !== undefined) setCachingEnabled(urlState.cache);
        if (urlState.batch !== undefined) setBatchEnabled(urlState.batch);

        // Apply URL models param: validate IDs against known active models
        if (urlState.models && urlState.models.length > 0) {
          const activeIds = new Set(active.map((m) => m.id));
          const validIds = urlState.models.filter((id) => activeIds.has(id));
          if (validIds.length >= 2) {
            // Only set filter if it doesn't include all models
            if (validIds.length < active.length) {
              setSelectedModelIds(validIds);
            }
          }
        }

        const charCount = useCalculatorStore.getState().text.length;
        initializeModelStates(active.map((m) => m.id), charCount);
      })
      .catch(() => setLoadError(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none', scope: '/' })
      .catch(() => {});

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PRICES_STALE') {
        setOfflineBanner(true);
      } else if (event.data?.type === 'PRICES_UPDATED') {
        setOfflineBanner(false);
      } else if (event.data?.type === 'PRICES_REFRESH_AVAILABLE') {
        const ta = document.querySelector('[aria-label="Enter your AI prompt or text"]');
        if (!(ta instanceof HTMLTextAreaElement) || ta.value === '') window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, []);

  // Sync URL state when relevant values change
  useEffect(() => {
    if (!pricesData) return;
    const encoded = encodeUrlState({
      out: outputTokens,
      think: thinkingEnabled,
      models: selectedModelIds ?? undefined,
      vol: volumeRequests,
      cache: cachingEnabled,
      batch: batchEnabled,
    });
    const newUrl = `${window.location.pathname}${encoded}`;
    window.history.replaceState(null, '', newUrl);
  }, [outputTokens, thinkingEnabled, selectedModelIds, volumeRequests, cachingEnabled, batchEnabled, pricesData]);

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
      (text) => {
        tokenizeAll(text);
        // Clear active preset when user edits text directly
        setActivePresetId(null);
      }
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

  // Load preset text into textarea using native DOM insertText so browser undo works (AC-2.3.2)
  const handlePresetSelect = useCallback((presetId: string, text: string) => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.select();
      // setRangeText + input event preserves the native undo stack
      el.setRangeText(text, 0, el.value.length, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fallback if ref isn't attached yet
      setText(text);
      tokenizeAll(text);
    }
    setActivePresetId(presetId);
  }, [setText, tokenizeAll]);

  const activeModels = pricesData?.models.filter((m) => m.active) ?? [];

  // Derive filtered models for the grid
  const filteredModels = selectedModelIds
    ? activeModels.filter((m) => selectedModelIds.includes(m.id))
    : activeModels;

  // Toggle a single model in/out of the selection
  const handleModelToggle = useCallback((id: string) => {
    const current = selectedModelIds ?? activeModels.map((m) => m.id);
    const next = current.includes(id)
      ? current.filter((mid) => mid !== id)
      : [...current, id];
    // Enforce minimum 2 — guard should already be in UI but be safe
    if (next.length < 2) return;
    // If all selected, treat as "all" (null)
    if (next.length === activeModels.length) {
      setSelectedModelIds(null);
    } else {
      setSelectedModelIds(next);
      // Track first-time filter event
      if (!hasTrackedFilterRef.current) {
        hasTrackedFilterRef.current = true;
        window.umami?.track('compare_tab_switched', { tab: 'filtered' });
      }
    }
  }, [selectedModelIds, activeModels, setSelectedModelIds]);

  const handleSelectAllModels = useCallback(() => {
    setSelectedModelIds(null);
    window.umami?.track('compare_tab_switched', { tab: 'all' });
  }, [setSelectedModelIds]);

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
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1.2fr)] lg:gap-6">
      {/* Left sidebar — desktop only, contains PresetBar and ModelFilter */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-4">
        <PresetBar
          activePresetId={activePresetId}
          onSelect={(text, id) => handlePresetSelect(id, text)}
          className="flex flex-col gap-2"
        />
        {activeModels.length > 0 && (
          <ModelFilter
            models={activeModels}
            selectedIds={selectedModelIds}
            onToggle={handleModelToggle}
            onSelectAll={handleSelectAllModels}
          />
        )}
      </aside>

      {/* Center column */}
      <main className="flex flex-col gap-6 min-w-0">
        <OfflineBanner show={offlineBanner} />

        {/* PresetBar — mobile only, horizontal mode — with ShareButton right-aligned */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <PresetBar
              activePresetId={activePresetId}
              onSelect={(text, id) => handlePresetSelect(id, text)}
              className="flex flex-row flex-wrap gap-2"
            />
            <ShareButton />
          </div>
        </div>

        {/* ShareButton — desktop, right-aligned above textarea */}
        <div className="hidden lg:flex lg:justify-end">
          <ShareButton />
        </div>

        {/* Textarea */}
        <PromptTextarea
          ref={textareaRef}
          onTextChange={tokenizeAll}
          highlightEncoding={
            (() => {
              const firstModel = filteredModels[0] ?? activeModels[0];
              if (!firstModel) return null;
              return firstModel.tokenizer === 'o200k_base' || firstModel.tokenizer === 'cl100k_base'
                ? firstModel.tokenizer
                : null;
            })()
          }
          tokenizerType={(filteredModels[0] ?? activeModels[0])?.tokenizer}
        />

        {/* Controls row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <OutputSlider activeModels={activeModels} />

          <div className="flex items-end justify-end sm:justify-start">
            <StalenessIndicator level={stalenessLevel} lastVerified={oldestVerified} />
          </div>
        </div>

        {/* Compare All button — shown above grid when any model is deselected */}
        {selectedModelIds !== null && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllModels}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 transition-colors"
            >
              Compare All ({activeModels.length} models)
            </button>
            <span className="text-xs text-gray-500">
              Showing {filteredModels.length} of {activeModels.length}
            </span>
          </div>
        )}

        {/* Cost grid */}
        <CostGrid models={filteredModels} />

        {/* Scaling simulator */}
        <ScalingSimulator
          models={filteredModels}
          tokenStates={modelTokenStates}
          outputTokens={outputTokens}
        />

        {/* Inline ad slot */}
        <AdSlotPlaceholder type="inline" />
      </main>

      {/* Right sidebar — desktop only, sticky ad */}
      <aside className="hidden lg:block">
        <div className="sticky top-4">
          <AdSlotSidebar />
        </div>
      </aside>
    </div>
  );
}
