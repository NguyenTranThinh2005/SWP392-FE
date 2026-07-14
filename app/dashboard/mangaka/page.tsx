'use client'

import { useEffect, useState } from 'react'
import { proposalService } from '@/services/proposalService'
import type { Proposal } from '@/types/proposal'
import WelcomeHeader from './components/WelcomeHeader'
import StatsGrid from './components/StatsGrid'
import RecentProposals from './components/RecentProposals'

const { getProposalsByMangaka, hasPendingProposal } = proposalService

export default function MangakaDashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [mounted, setMounted] = useState(false)
  const [mangakaName, setMangakaName] = useState('Mangaka')
  const [mangakaId, setMangakaId] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [assignedEditor, setAssignedEditor] = useState<{
    name: string
    email: string
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = ''
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.name) {
          setMangakaName(parsed.name)
        }
        if (parsed?.id) {
          setMangakaId(parsed.id)
          currentId = parsed.id
        }
        if (parsed?.assignedEditorName) {
          setAssignedEditor({
            name: parsed.assignedEditorName,
            email: parsed.assignedEditorEmail || ''
          })
        }
      } catch {}
    }

    if (currentId) {
      getProposalsByMangaka(currentId).then((list) => {
        setProposals(list)
        hasPendingProposal(currentId).then((blocked) => {
          setIsBlocked(blocked)
          setMounted(true)
        })
      })
    } else {
      setMounted(true)
    }
  }, [])

  if (!mounted) return null

  const counts = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'Draft').length,
    pending: proposals.filter(
      (p) =>
        p.status === 'Under Review' ||
        p.status === 'Board Voting' ||
        p.status === 'Pending Review'
    ).length,
    approved: proposals.filter(
      (p) => p.status === 'Approved' || p.status === 'Active'
    ).length,
    rejected: proposals.filter((p) => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Welcome header component */}
      <WelcomeHeader
        mangakaName={mangakaName}
        assignedEditor={assignedEditor}
        isBlocked={isBlocked}
      />

      {/* Statistics counters component */}
      <StatsGrid counts={counts} />

      {/* Recent proposals component */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentProposals proposals={proposals} />
      </div>
    </div>
  )
}
