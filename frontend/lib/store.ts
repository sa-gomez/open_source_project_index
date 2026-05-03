import { create } from 'zustand'
import type { FilterState } from './types'

interface StoreState {
  filters: FilterState
  submittedFilters: FilterState | null
  showScore: boolean
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  submitSearch: () => void
  toggleScore: () => void
}

const defaultFilters: FilterState = {
  query: '',
  language: null,
  minStars: null,
  minSizeKb: null,
  pushedAfter: null,
  limit: 20,
}

export const useStore = create<StoreState>((set) => ({
  filters: defaultFilters,
  submittedFilters: null,
  showScore: false,

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  submitSearch: () =>
    set((state) => ({ submittedFilters: { ...state.filters } })),

  toggleScore: () => set((state) => ({ showScore: !state.showScore })),
}))
