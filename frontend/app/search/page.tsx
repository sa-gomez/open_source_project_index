import { FilterSidebar } from '@/components/FilterSidebar'
import { RepoTable } from '@/components/RepoTable'

export default function SearchPage() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-[280px] shrink-0 border-r border-gray-800 overflow-y-auto">
        <FilterSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <RepoTable />
      </main>
    </div>
  )
}
