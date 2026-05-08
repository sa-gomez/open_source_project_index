import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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

  // curation
  savedIds: Set<number>
  showNewOnly: boolean
  selectedRepos: Set<number>
  setSavedIds: (ids: Set<number>) => void
  addSavedId: (id: number) => void
  removeSavedId: (id: number) => void
  toggleNewOnly: () => void
  toggleSelected: (id: number) => void
  selectAll: (ids: number[]) => void
  clearSelected: () => void
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

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
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

      // curation
      savedIds: new Set(),
      showNewOnly: true,
      selectedRepos: new Set(),

      setSavedIds: (ids) => set({ savedIds: ids }),

      addSavedId: (id) =>
        set((state) => ({ savedIds: new Set([...state.savedIds, id]) })),

      removeSavedId: (id) =>
        set((state) => {
          const next = new Set(state.savedIds)
          next.delete(id)
          return { savedIds: next }
        }),

      toggleNewOnly: () => set((state) => ({ showNewOnly: !state.showNewOnly })),

      toggleSelected: (id) =>
        set((state) => {
          const next = new Set(state.selectedRepos)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return { selectedRepos: next }
        }),

      selectAll: (ids) => set({ selectedRepos: new Set(ids) }),

      clearSelected: () => set({ selectedRepos: new Set() }),
    }),
    {
      name: 'repo-index-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        submittedFilters: state.submittedFilters,
        showScore: state.showScore,
        showNewOnly: state.showNewOnly,
        browseFilters: state.browseFilters,
        submittedBrowseFilters: state.submittedBrowseFilters,
        currentPage: state.currentPage,
      }),
    }
  )
)
