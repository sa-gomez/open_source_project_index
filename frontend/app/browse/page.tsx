import { BrowseFilterSidebar } from '@/components/BrowseFilterSidebar'
import { BrowseTable } from '@/components/BrowseTable'

export default function BrowsePage() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-[280px] shrink-0 border-r border-gray-800 overflow-y-auto">
        <BrowseFilterSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <BrowseTable />
      </main>
    </div>
  )
}
