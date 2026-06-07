import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CalculatorStoreState, ModelTokenState, SortColumn } from '../types/calculator';
import { heuristicCount } from '../lib/tokenCount';

export const useCalculatorStore = create<CalculatorStoreState>()(
  subscribeWithSelector((set, get) => ({
    text: '',
    outputMultiplier: 1,
    thinkingEnabled: false,
    modelTokenStates: {},
    sortColumn: 'total',
    sortDirection: 'desc',

    setText: (text: string) => {
      const charCount = text.length;
      const existingStates = get().modelTokenStates;

      const newStates: Record<string, ModelTokenState> = {};
      for (const modelId of Object.keys(existingStates)) {
        newStates[modelId] = {
          tokenCount: heuristicCount(charCount),
          status: charCount === 0 ? 'pending' : 'heuristic',
        };
      }

      set({ text, modelTokenStates: newStates });
    },

    setOutputMultiplier: (multiplier: number) => {
      set({ outputMultiplier: multiplier });
    },

    setThinkingEnabled: (enabled: boolean) => {
      set({ thinkingEnabled: enabled });
    },

    setModelTokenState: (modelId: string, state: Partial<ModelTokenState>) => {
      set((prev) => ({
        modelTokenStates: {
          ...prev.modelTokenStates,
          [modelId]: {
            ...prev.modelTokenStates[modelId],
            ...state,
          },
        },
      }));
    },

    initializeModelStates: (modelIds: string[], charCount: number) => {
      const newStates: Record<string, ModelTokenState> = {};
      for (const modelId of modelIds) {
        newStates[modelId] = {
          tokenCount: heuristicCount(charCount),
          status: charCount === 0 ? 'pending' : 'heuristic',
        };
      }
      set({ modelTokenStates: newStates });
    },

    setSortColumn: (column: SortColumn) => {
      set((prev) => ({
        sortColumn: column,
        sortDirection:
          prev.sortColumn === column && prev.sortDirection === 'desc' ? 'asc' : 'desc',
      }));
    },
  }))
);
