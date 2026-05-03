'use client'

import { useStore } from '@/lib/store'

export function FilterSidebar() {
  const { filters, setFilter, submitSearch } = useStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitSearch()
  }

  const inputClass =
    'w-full rounded bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500'
  const labelClass = 'block text-xs text-gray-400 mb-1'

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className={labelClass}>Language</label>
        <input
          type="text"
          value={filters.language ?? ''}
          onChange={(e) => setFilter('language', e.target.value || null)}
          placeholder="e.g. python"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Min Stars</label>
        <input
          type="number"
          value={filters.minStars ?? ''}
          onChange={(e) =>
            setFilter('minStars', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g. 1000"
          min={0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Min Size (KB)</label>
        <input
          type="number"
          value={filters.minSizeKb ?? ''}
          onChange={(e) =>
            setFilter('minSizeKb', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g. 50000"
          min={0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Pushed After</label>
        <input
          type="date"
          value={filters.pushedAfter ?? ''}
          onChange={(e) => setFilter('pushedAfter', e.target.value || null)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Limit</label>
        <input
          type="number"
          value={filters.limit}
          onChange={(e) => setFilter('limit', Number(e.target.value) || 20)}
          min={1}
          max={100}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-3 py-2 text-sm font-medium transition-colors"
      >
        Search
      </button>
    </form>
  )
}
