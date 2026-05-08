'use client'

import { useQuery } from '@tanstack/react-query'
import { getRepo } from '@/lib/api'

export function useRepo(id: number) {
  return useQuery({
    queryKey: ['repo', id],
    queryFn: () => getRepo(id),
  })
}
