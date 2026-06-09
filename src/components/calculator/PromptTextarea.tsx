'use client';

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { renderTokenHighlights, getTokenStringsForHighlight } from '../../lib/highlighter';
import { t } from '../../lib/i18n';

const HIGHLIGHT_CHAR_LIMIT = 50_000;

interface Props {
  onTextChange?: (text: string) => void;
  /** The encoding of the first active model, or null when unsupported. */
  highlightEncoding?: 'o200k_base' | 'cl100k_base' | null;
  /** The tokenizer key of the first active model, used for analytics. */
  tokenizerType?: string;
}

const PromptTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function PromptTextarea({ onTextChange, highlightEncoding, tokenizerType }, ref) {
    const text = useCalculatorStore((s) => s.text);
    const setText = useCalculatorStore((s) => s.setText);
    const modelTokenStates = useCalculatorStore((s) => s.modelTokenStates);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const umamiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const highlightDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);

    const [highlightEnabled, setHighlightEnabled] = useState(false);
    const [highlightLoading, setHighlightLoading] = useState(false);

    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

    const firstState = Object.values(modelTokenStates)[0];
    const isWasmLoading = firstState?.status === 'heuristic';

    const tokenDisplay = firstState ? (
      firstState.status === 'wasm' ? (
        <>
          <span className="text-ct-exact mr-0.5" title={t('calculator.exactCount')} aria-label={t('calculator.exactCount')}>✓</span>
          {firstState.tokenCount.toLocaleString()} tokens
        </>
      ) : (
        <>~{firstState.tokenCount.toLocaleString()} tokens</>
      )
    ) : null;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setText(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onTextChange?.(value);
        }, 100);
        if (umamiDebounceRef.current) clearTimeout(umamiDebounceRef.current);
        umamiDebounceRef.current = setTimeout(() => {
          window.umami?.track('tokenize', {
            tokenizer_type: tokenizerType ?? 'heuristic',
            char_count: Math.round(value.length / 100) * 100,
            locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en',
          });
        }, 2000);
      },
      [setText, onTextChange, tokenizerType]
    );

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === 'H') {
          const tag = (e.target as HTMLElement).tagName;
          if (tag === 'INPUT' || tag === 'SELECT') return;
          setHighlightEnabled((prev) => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleHighlightToggle = useCallback(() => {
      const next = !highlightEnabled;
      setHighlightEnabled(next);
      window.umami?.track('token_highlighter_toggled', { enabled: next ? '1' : '0', locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en' });
    }, [highlightEnabled]);

    useEffect(() => {
      if (!highlightEnabled) {
        const mirror = mirrorRef.current;
        if (mirror) {
          while (mirror.firstChild) mirror.removeChild(mirror.firstChild);
        }
        return;
      }

      if (charCount > HIGHLIGHT_CHAR_LIMIT) return;
      if (!highlightEncoding) return;

      if (highlightDebounceRef.current) clearTimeout(highlightDebounceRef.current);

      highlightDebounceRef.current = setTimeout(async () => {
        const mirror = mirrorRef.current;
        if (!mirror) return;

        setHighlightLoading(true);
        const tokens = await getTokenStringsForHighlight(text, highlightEncoding);
        renderTokenHighlights(mirror, tokens);
        setHighlightLoading(false);
      }, 150);
    }, [highlightEnabled, text, highlightEncoding, charCount]);

    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (umamiDebounceRef.current) clearTimeout(umamiDebounceRef.current);
        if (highlightDebounceRef.current) clearTimeout(highlightDebounceRef.current);
      };
    }, []);

    const isToggleDisabled = isWasmLoading;
    const toggleTitle = isToggleDisabled
      ? t('calculator.highlightTooltipLoading')
      : highlightEnabled
      ? t('calculator.highlightTooltipOn')
      : t('calculator.highlightTooltipOff');

    const showEncodingUnsupported = highlightEnabled && highlightEncoding == null;
    const showCharLimit = highlightEnabled && charCount > HIGHLIGHT_CHAR_LIMIT;
    const showMirror = highlightEnabled && !showEncodingUnsupported && !showCharLimit;

    return (
      <div className="relative">
        <div className="relative">
          {showMirror && (
            <div
              ref={mirrorRef}
              aria-hidden="true"
              className="absolute inset-0 px-4 py-3 text-sm leading-relaxed text-transparent pointer-events-none overflow-hidden whitespace-pre-wrap break-words rounded-xl border border-transparent"
              style={{ wordBreak: 'break-word' }}
            />
          )}
          {!showMirror && (
            <div ref={mirrorRef} aria-hidden="true" className="hidden" />
          )}
          <textarea
            ref={ref}
            role="textbox"
            value={text}
            onChange={handleChange}
            placeholder={t('calculator.placeholder')}
            className={[
              'w-full min-h-[160px] sm:min-h-[200px] px-4 py-3 text-sm text-ct-strong border border-ct-border rounded-xl resize-y',
              'placeholder:text-ct-faint leading-relaxed font-sans',
              'focus:outline-none focus:ring-2 focus:ring-ct-accent focus:border-ct-accent',
              showMirror ? 'bg-transparent relative z-10' : 'bg-ct-sunken',
            ].join(' ')}
            aria-label={t('calculator.ariaLabel')}
            data-testid="prompt-textarea"
            spellCheck={false}
          />
        </div>

        <p className="flex items-center gap-1 text-xs text-ct-subtle mt-1.5 px-1">
          <span aria-hidden="true">🔒</span>{t('calculator.privacyNote')}
        </p>

        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex items-center gap-3 text-xs text-ct-muted font-mono">
            <span>{charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words{tokenDisplay ? <> · {tokenDisplay}</> : null}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="highlight-toggle"
              onClick={handleHighlightToggle}
              disabled={isToggleDisabled}
              title={toggleTitle}
              aria-pressed={highlightEnabled}
              className={[
                'text-xs px-2 py-0.5 rounded transition-colors border',
                highlightEnabled
                  ? 'border-ct-accent text-ct-accent'
                  : 'border-ct-border text-ct-muted hover:border-ct-accent hover:text-ct-body',
                isToggleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
              style={highlightEnabled ? { background: 'var(--accent-tint)' } : { background: 'var(--surface-control)' }}
            >
              {highlightLoading ? t('calculator.highlightLoading') : highlightEnabled ? t('calculator.hideHighlights') : t('calculator.highlightTokens')}
            </button>
            {text && (
              <button
                onClick={() => { setText(''); onTextChange?.(''); }}
                className="text-xs text-ct-subtle hover:text-ct-muted transition-colors"
                aria-label={t('calculator.clearText')}
              >
                {t('calculator.clearText')}
              </button>
            )}
          </div>
        </div>

        {showCharLimit && (
          <p className="text-xs text-ct-accent mt-1 px-1">
            {t('calculator.charLimitWarning')}
          </p>
        )}
        {showEncodingUnsupported && (
          <p className="text-xs text-ct-accent mt-1 px-1">
            Token highlighting requires OpenAI or GPT-4 model selected.
          </p>
        )}
      </div>
    );
  }
);

export default PromptTextarea;
