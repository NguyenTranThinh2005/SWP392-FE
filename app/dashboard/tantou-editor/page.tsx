'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import {
  type Chapter,
} from '@/lib/chapters-store'
import { manuscriptService } from '@/services/manuscriptService'
import type { ManuscriptItem } from '@/types/manuscript'
import { seriesService } from '@/services/seriesService'
import { userService } from '@/services/userService'
import { chapterService } from '@/services/chapterService'

// Import components
import EditorDashboardTab from './components/EditorDashboardTab'
import EditorSeriesTab from './components/EditorSeriesTab'
import EditorProposalsTab from './components/EditorProposalsTab'
import EditorManuscriptsTab from './components/EditorManuscriptsTab'

function TantouEditorWorkspace() {
  const { role } = useRole()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'

  // Current logged in user info
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('Editor')
  const [assignedMangakas, setAssignedMangakas] = useState<{ id: string; name: string; email: string }[]>([])

  // Data states
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [manuscripts, setManuscripts] = useState<ManuscriptItem[]>([])

  // Load Data function
  const loadData = useCallback(async (editorId?: string) => {
    const targetEditorId = editorId || currentUserId
    let list: any[] = []

    try {
      list = await seriesService.listSeries()
      setSeriesList(list)
    } catch (e) {
      console.error('Failed to load series from backend:', e)
    }

    if (targetEditorId) {
      try {
        let assigned: { id: string; name: string; email: string }[] = []
        try {
          const res = await userService.getMyMangakas()
          if (res && res.data) {
            assigned = res.data.map(u => ({
              id: u.userId,
              name: u.displayName || u.userName,
              email: u.email
            }))
          }
        } catch (e) {
          console.warn('Failed to load assigned mangakas from backend:', e)
        }

        // Merge local storage overrides if any
        if (typeof window !== 'undefined') {
          try {
            const overrides = JSON.parse(localStorage.getItem('editor_assignments_override') || '{}')
            for (const [mangakaId, editorId] of Object.entries(overrides)) {
              if (typeof editorId === 'string' && editorId.toLowerCase() === targetEditorId.toLowerCase()) {
                const alreadyAdded = assigned.some(m => m.id.toLowerCase() === mangakaId.toLowerCase())
                if (!alreadyAdded) {
                  const seriesObj = list.find(s => s.mangakaId?.toLowerCase() === mangakaId.toLowerCase())
                  const name = seriesObj ? seriesObj.author : 'Assigned Mangaka'
                  assigned.push({
                    id: mangakaId,
                    name: name,
                    email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`
                  })
                }
              }
            }
          } catch { }
        }

        setAssignedMangakas(assigned)
      } catch (e) {
        console.error('Failed to process assigned mangakas:', e)
      }
    }

    setManuscripts(manuscriptService.getManuscripts())

    try {
      const allChaps = await chapterService.listChapters()
      setChapters(allChaps)
    } catch (e) {
      console.warn('Failed to load chapters from backend:', e)
    }

    // Background sync manuscripts
    try {
      const synced = await manuscriptService.syncManuscriptsFromBackend()
      if (synced) setManuscripts(synced)
    } catch (e) {
      console.warn('Failed to sync manuscripts from backend:', e)
    }
  }, [currentUserId])

  useEffect(() => {
    let editorId = currentUserId
    const saved = localStorage.getItem('user-info')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.id) {
        editorId = parsed.id
        setCurrentUserId(parsed.id)
      }
      if (parsed?.displayName || parsed?.userName) {
        setCurrentUserName(parsed.displayName || parsed.userName)
      }
      if (parsed?.assignedMangakas) {
        setAssignedMangakas(parsed.assignedMangakas)
      }
    }
    if (editorId) {
      loadData(editorId)
    }
  }, [loadData, currentUserId])

  // Filters manuscript dashboard to show only works of creators supervised by the active editor.
  const supervisedSeries = useMemo(() => {
    const assignedIds = new Set(assignedMangakas.map(m => m.id.toLowerCase()))
    const filteredList = seriesList.filter(
      (s) => s.mangakaId && assignedIds.has(s.mangakaId.toLowerCase())
    )
    return [...filteredList].sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
  }, [seriesList, assignedMangakas])

  // Stats Counters
  const pendingReviewsCount = useMemo(() => {
    const manuscriptsSubmitted = manuscripts.filter(
      (m) =>
        m.status === 'SUBMITTED' &&
        supervisedSeries.some((s) => s.id === m.seriesId)
    ).length
    const chaptersReadyForReview = chapters.filter(
      (c) =>
        c.status === 'Ready for Editor' &&
        supervisedSeries.some((s) => s.id === c.seriesId)
    ).length
    return manuscriptsSubmitted + chaptersReadyForReview
  }, [manuscripts, chapters, supervisedSeries])

  // Render stats summary helper
  const stats = useMemo(() => {
    return {
      seriesCount: supervisedSeries.length,
      pendingCount: pendingReviewsCount,
    }
  }, [supervisedSeries, pendingReviewsCount])



  const triggerRefresh = () => {
    loadData()
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1.5">
            Welcome, <span className="text-primary">{currentUserName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-lg text-xs font-bold text-muted-foreground shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Active: {assignedMangakas.length} Assigned Mangaka{assignedMangakas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* RENDER VIEW BASED ON TAB PARAMETER */}
      {activeTab === 'dashboard' && (
        <EditorDashboardTab
          supervisedSeries={supervisedSeries}
          assignedMangakas={assignedMangakas}
          stats={stats}
        />
      )}

      {activeTab === 'series' && (
        <EditorSeriesTab
          supervisedSeries={supervisedSeries}
        />
      )}

      {activeTab === 'proposals' && (
        <EditorProposalsTab
          supervisedSeries={supervisedSeries}
          seriesList={seriesList}
          onRefresh={triggerRefresh}
        />
      )}

      {activeTab === 'manuscripts' && (
        <EditorManuscriptsTab
          manuscripts={manuscripts}
          supervisedSeries={supervisedSeries}
          onRefresh={triggerRefresh}
        />
      )}
    </div>
  )
}

export default function TantouEditorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading workspace...
          </p>
        </div>
      }
    >
      <TantouEditorWorkspace />
    </Suspense>
  )
}
