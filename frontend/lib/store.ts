import { create } from 'zustand'
import type { BrowseFilters, FilterState } from './types'

interface StoreState {
  // live search
  filters: FilterState
  submittedFilters: FilterState | null
  showScore: boolean
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  submitSearch: () => void
  toggleScore: () => void

  // indexed browse
  browseFilters: BrowseFilters
  submittedBrowseFilters: BrowseFilters
  currentPage: number
  setBrowseFilter: <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => void
  submitBrowse: () => void
  setBrowsePage: (page: number) => void
}

const defaultFilters: FilterState = {
  query: '',
  language: null,
  minStars: null,
  minSizeKb: null,
  pushedAfter: null,
  limit: 20,
  topics: [],
}

const defaultBrowseFilters: BrowseFilters = {
  language: null,
  minStars: 0,
  minSizeKb: null,
  pushedAfter: null,
  topics: [],
  limit: 20,
  offset: 0,
}

export const useStore = create<StoreState>((set) => ({
  // live search
  filters: defaultFilters,
  submittedFilters: null,
  showScore: false,

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  submitSearch: () =>
    set((state) => ({ submittedFilters: { ...state.filters } })),

  toggleScore: () => set((state) => ({ showScore: !state.showScore })),

  // indexed browse — starts with defaults so browse page auto-fetches on mount
  browseFilters: defaultBrowseFilters,
  submittedBrowseFilters: defaultBrowseFilters,
  currentPage: 0,

  setBrowseFilter: (key, value) =>
    set((state) => ({ browseFilters: { ...state.browseFilters, [key]: value } })),

  submitBrowse: () =>
    set((state) => ({
      submittedBrowseFilters: { ...state.browseFilters, offset: 0 },
      currentPage: 0,
    })),

  setBrowsePage: (page) =>
    set((state) => ({
      currentPage: page,
      submittedBrowseFilters: {
        ...state.submittedBrowseFilters,
        offset: page * state.submittedBrowseFilters.limit,
      },
    })),
}))
