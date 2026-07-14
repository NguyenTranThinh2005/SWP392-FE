'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { proposalService } from '@/services/proposalService'
import type { Proposal, ProposalStatus } from '@/types/proposal'
import { toast } from 'sonner'

import ProposalHeader from './components/ProposalHeader'
import ProposalStats from './components/ProposalStats'
import ProposalFilterTabs from './components/ProposalFilterTabs'
import ProposalList from './components/ProposalList'
import DeleteConfirmModal from './components/DeleteConfirmModal'

const { getProposalsByMangaka, deleteDraft, hasPendingProposal } =
  proposalService

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>(
    'All'
  )
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [mangakaId, setMangakaId] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)

  const reload = useCallback(async (currentId: string) => {
    if (!currentId) return
    const list = await getProposalsByMangaka(currentId)
    setProposals(list)
    const blocked = await hasPendingProposal(currentId)
    setIsBlocked(blocked)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = ''
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.id) {
          currentId = parsed.id
          setMangakaId(parsed.id)
        }
      } catch {}
    }
    reload(currentId)
  }, [reload])

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        const success = await deleteDraft(deleteConfirmId)
        if (success) {
          toast.success('Xóa bản thảo thành công!')
        } else {
          toast.error(
            'Xóa bản thảo thất bại. Có thể do giới hạn phân quyền API (AdminOnly).'
          )
        }
      } catch (err: any) {
        toast.error(err?.message || 'Có lỗi xảy ra khi xóa bản thảo.')
      }
      setDeleteConfirmId(null)
      await reload(mangakaId)
    }
  }

  const filtered =
    statusFilter === 'All'
      ? proposals
      : proposals.filter((p) => p.status === statusFilter)

  const counts = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'Draft').length,
    pending: proposals.filter(
      (p) => p.status === 'Pending Review' || p.status === 'Under Review'
    ).length,
    approved: proposals.filter((p) => p.status === 'Approved').length,
    rejected: proposals.filter((p) => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <ProposalHeader isBlocked={isBlocked} />

      {/* Stats strip */}
      <ProposalStats counts={counts} />

      {/* Warning banner */}
      {isBlocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">
              Bạn đang có đề xuất trong quá trình xét duyệt
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Bạn chỉ có thể gửi đề xuất mới sau khi đề xuất hiện tại (trạng thái: Chờ duyệt hoặc Đang duyệt) được xử lý bởi Hội đồng Biên tập.
            </p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <ProposalFilterTabs
        proposals={proposals}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Proposal List */}
      <ProposalList
        filteredProposals={filtered}
        statusFilter={statusFilter}
        isBlocked={isBlocked}
        onDelete={handleDelete}
      />

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
