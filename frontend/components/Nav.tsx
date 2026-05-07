'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/browse', label: 'Browse' },
  { href: '/search', label: 'Live Search' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-4">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname.startsWith(href)
              ? 'text-sm font-medium text-white'
              : 'text-sm text-gray-400 hover:text-gray-200 transition-colors'
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
