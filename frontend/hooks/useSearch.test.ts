import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { handlers, mockRepo } from '../mocks/handlers'
import { useSearch } from './useSearch'
import { useStore } from '@/lib/store'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  useStore.setState({
    filters: {
      query: '',
      language: null,
      minStars: null,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
      topics: [],
    },
    submittedFilters: null,
    showScore: false,
  })
})

afterAll(() => server.close())

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

test('does not fetch before search is submitted', () => {
  const { result } = renderHook(() => useSearch(), { wrapper })
  expect(result.current.data).toBeUndefined()
  expect(result.current.isLoading).toBe(false)
  expect(result.current.fetchStatus).toBe('idle')
})

test('fetches and returns results after submitSearch', async () => {
  useStore.setState({
    submittedFilters: {
      query: '',
      language: 'python',
      minStars: 1000,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
      topics: [],
    },
  })

  const { result } = renderHook(() => useSearch(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(result.current.data).toHaveLength(1)
  expect(result.current.data![0].full_name).toBe(mockRepo.full_name)
  expect(result.current.data![0].quality_score).toBe(75.0)
})

test('surfaces error message on 502', async () => {
  server.use(
    http.get('http://localhost:8000/search', () =>
      HttpResponse.json({ detail: 'GitHub API error' }, { status: 502 }),
    ),
  )

  useStore.setState({
    submittedFilters: {
      query: '',
      language: null,
      minStars: 1000,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
      topics: [],
    },
  })

  const { result } = renderHook(() => useSearch(), { wrapper })

  await waitFor(() => expect(result.current.isError).toBe(true))

  expect(result.current.error).toBeInstanceOf(Error)
  expect((result.current.error as Error).message).toContain('GitHub API unavailable')
})
