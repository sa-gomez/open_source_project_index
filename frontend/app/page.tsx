import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Discover Production-Grade Open Source</h2>
      <p className="text-gray-400 max-w-md mb-8">
        Search and explore high-quality open source repositories scored by real-world signals like
        size, activity, community health, and completeness.
      </p>
      <div className="flex gap-4">
        <Link
          href="/browse"
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Browse Index
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-medium transition-colors"
        >
          Live Search
        </Link>
      </div>
    </main>
  )
}
