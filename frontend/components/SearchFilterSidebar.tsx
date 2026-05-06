'use client'

import { useStore } from '@/lib/store'
import { FilterSidebar } from './FilterSidebar'
import type { SidebarFilters } from './FilterSidebar'

export function SearchFilterSidebar() {
  const { filters, setFilter, submitSearch } = useStore()

  return (
    <FilterSidebar
      filters={filters}
      onChange={(key, value) => setFilter(key as keyof typeof filters, value as never)}
      onSubmit={submitSearch}
      submitLabel="Search"
      showQuery={true}
    />
  )
}
