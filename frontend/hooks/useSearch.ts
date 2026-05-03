import { useQuery } from '@tanstack/react-query'
import { searchRepos } from '@/lib/api'
import { useStore } from '@/lib/store'

export function useSearch() {
  const submittedFilters = useStore((state) => state.submittedFilters)

  return useQuery({
    queryKey: ['search', submittedFilters],
    queryFn: () => searchRepos(submittedFilters!),
    enabled: submittedFilters !== null,
  })
}
