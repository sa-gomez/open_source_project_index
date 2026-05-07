'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSavedIds } from '@/lib/api'
import { useStore } from '@/lib/store'

export function useSavedIds() {
  const setSavedIds = useStore((s) => s.setSavedIds)
  const result = useQuery({
    queryKey: ['savedIds'],
    queryFn: getSavedIds,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (result.data) {
      setSavedIds(result.data)
    }
  }, [result.data, setSavedIds])

  return result
}
