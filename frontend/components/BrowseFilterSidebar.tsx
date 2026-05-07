'use client'

import { useStore } from '@/lib/store'
import { FilterSidebar } from './FilterSidebar'

export function BrowseFilterSidebar() {
  const { browseFilters, setBrowseFilter, submitBrowse } = useStore()

  return (
    <FilterSidebar
      filters={{
        language: browseFilters.language,
        minStars: browseFilters.minStars || null,
        minSizeKb: browseFilters.minSizeKb,
        pushedAfter: browseFilters.pushedAfter,
        limit: browseFilters.limit,
      }}
      onChange={(key, value) => {
        if (key === 'query') return
        setBrowseFilter(
          key as keyof typeof browseFilters,
          (key === 'minStars' && value === null ? 0 : value) as never,
        )
      }}
      onSubmit={submitBrowse}
      submitLabel="Apply Filters"
      showQuery={false}
    />
  )
}
