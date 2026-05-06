import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { browseRepos } from '@/lib/api'
import { useStore } from '@/lib/store'

export function useBrowse() {
  const submittedBrowseFilters = useStore((s) => s.submittedBrowseFilters)

  return useQuery({
    queryKey: ['browse', submittedBrowseFilters],
    queryFn: () => browseRepos(submittedBrowseFilters),
    placeholderData: keepPreviousData,
  })
}
