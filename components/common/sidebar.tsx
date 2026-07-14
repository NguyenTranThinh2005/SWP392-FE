'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRole } from '@/context/RoleContext'
import Image from 'next/image'
import {
  BookOpen,
  PencilLine,
  Layers,
  ClipboardList,
  UserPlus,
  LayoutDashboard,
  Trophy,
  Wallet,
  Users
} from 'lucide-react'

function SidebarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { role } = useRole()

  const menuItems = {
    Mangaka: [
      { label: 'Dashboard', href: '/dashboard/mangaka', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'My Proposals', href: '/dashboard/series', icon: PencilLine },
      { label: 'Create New Proposal', href: '/dashboard/series/new', icon: UserPlus },
      { label: 'Manuscripts', href: '/dashboard/manuscripts', icon: Layers },
      { label: 'Chapters & Tasks', href: '/dashboard/chapters', icon: ClipboardList },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
      { label: 'Salary History', href: '/dashboard/salary', icon: Wallet },
    ],
    Assistant: [
      { label: 'Dashboard', href: '/dashboard/assistant', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'My Tasks', href: '/dashboard/chapters', icon: ClipboardList },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
      { label: 'Salary History', href: '/dashboard/salary', icon: Wallet },
    ],
    TantouEditor: [
      { label: 'Dashboard', href: '/dashboard/tantou-editor?tab=dashboard', icon: LayoutDashboard },
      { label: 'Series', href: '/dashboard/tantou-editor?tab=series', icon: BookOpen },
      { label: 'Approve Proposals', href: '/dashboard/tantou-editor?tab=proposals', icon: ClipboardList },
      { label: 'Manuscripts', href: '/dashboard/tantou-editor?tab=manuscripts', icon: Layers },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    EditorialBoard: [
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PencilLine },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    EditorInChief: [
      { label: 'Dashboard', href: '/dashboard/editor-in-chief', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PencilLine },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    Admin: [
      { label: 'Account Management', href: '/dashboard/admin', icon: Users },
    ],
  }

  const currentLinks = menuItems[role] || []

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-card text-foreground p-5 border-r border-border">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <Image
            src="/logo.svg"
            alt="MangaFlow Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            MangaFlow
          </span>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 mb-2">
            Main Features
          </p>
          <nav className="space-y-1">
            {currentLinks.map((item) => {
              const Icon = item.icon
              let isActive = pathname === item.href

              if (item.href.includes('?tab=')) {
                const urlObj = new URL(item.href, 'http://localhost')
                const tabParam = urlObj.searchParams.get('tab')
                const activeTab = searchParams.get('tab') || 'dashboard'
                isActive = pathname === urlObj.pathname && activeTab === tabParam
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all group ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <aside className="flex w-64 h-screen flex-col sticky top-0 z-30 shrink-0">
      <SidebarContent />
    </aside>
  )
}

import { Suspense } from 'react'

export function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 bg-card border-r border-border h-screen flex flex-col p-5"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-3/4"></div><div className="h-4 bg-muted rounded w-1/2"></div></div></div>}>
      <SidebarInner />
    </Suspense>
  )
}
