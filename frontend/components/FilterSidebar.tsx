'use client'

export interface SidebarFilters {
  query?: string
  language: string | null
  minStars: number | null
  minSizeKb: number | null
  pushedAfter: string | null
  limit: number
}

interface FilterSidebarProps {
  filters: SidebarFilters
  onChange: (key: keyof SidebarFilters, value: SidebarFilters[keyof SidebarFilters]) => void
  onSubmit: () => void
  submitLabel?: string
  showQuery?: boolean
}

export function FilterSidebar({
  filters,
  onChange,
  onSubmit,
  submitLabel = 'Search',
  showQuery = true,
}: FilterSidebarProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  const inputClass =
    'w-full rounded bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500'
  const labelClass = 'block text-xs text-gray-400 mb-1'

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {showQuery && (
        <div>
          <label className={labelClass}>Search Query</label>
          <input
            type="text"
            value={filters.query ?? ''}
            onChange={(e) => onChange('query', e.target.value)}
            placeholder="e.g. machine learning"
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Language</label>
        <input
          type="text"
          value={filters.language ?? ''}
          onChange={(e) => onChange('language', e.target.value || null)}
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
            onChange('minStars', e.target.value ? Number(e.target.value) : null)
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
            onChange('minSizeKb', e.target.value ? Number(e.target.value) : null)
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
          onChange={(e) => onChange('pushedAfter', e.target.value || null)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Limit</label>
        <input
          type="number"
          value={filters.limit}
          onChange={(e) => onChange('limit', Number(e.target.value) || 20)}
          min={1}
          max={100}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-3 py-2 text-sm font-medium transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  )
}
