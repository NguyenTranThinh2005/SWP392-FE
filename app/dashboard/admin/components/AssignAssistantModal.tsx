'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { type User } from '@/types/user'
import { userService, type UserAssignmentResponse } from '@/services/userService'

interface AssignAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  mangaka: User | null
  assistants: User[]
  getAssistantName: (assistantId?: string) => string
  onSuccess: () => void
}

export default function AssignAssistantModal({
  isOpen,
  onClose,
  mangaka,
  assistants,
  getAssistantName,
  onSuccess
}: AssignAssistantModalProps) {
  const [selectedAssistantId, setSelectedAssistantId] = useState('')
  const [isReassigning, setIsReassigning] = useState(false)
  const [assignmentHistory, setAssignmentHistory] = useState<UserAssignmentResponse[]>([])
  const [activeAssignmentId, setActiveAssignmentId] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (mangaka && isOpen) {
      setSelectedAssistantId(mangaka.assistantId || '')
      setActiveAssignmentId('')
      setAssignmentHistory([])
      setLoadingHistory(true)

      userService.getMyAssignment(mangaka.id)
        .then((history) => {
          const sortedHistory = [...history].sort((a, b) =>
            new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
          )
          const activeAssignment = sortedHistory.find(item => !item.unassignedAt) || sortedHistory[0]
          setAssignmentHistory(sortedHistory)
          setActiveAssignmentId(activeAssignment?.assignmentId || '')
          setSelectedAssistantId(activeAssignment?.fromUserId || mangaka.assistantId || '')
        })
        .catch((err: any) => {
          toast.error(err.message || 'Failed to load assistant assignment history.')
        })
        .finally(() => {
          setLoadingHistory(false)
        })
    }
  }, [mangaka, isOpen])

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mangaka) return
    if (!selectedAssistantId) {
      toast.error('Please select an Assistant.')
      return
    }

    setIsReassigning(true)
    try {
      await userService.assignAssistantToMangaka(mangaka.id, selectedAssistantId, activeAssignmentId)
      toast.success(`Successfully assigned Assistant to Mangaka ${mangaka.name}!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while assigning Assistant.')
    } finally {
      setIsReassigning(false)
    }
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!mangaka) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Assign Drawing Assistant to Mangaka
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleConfirmAssignment} className="space-y-4 pt-3">
          <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 text-xs space-y-1.5">
            <p className="text-muted-foreground">Selected Mangaka:</p>
            <p className="font-bold text-foreground text-sm">{mangaka.name} ({mangaka.email})</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Select Assistant
            </label>
            <select
              value={selectedAssistantId}
              onChange={(e) => setSelectedAssistantId(e.target.value)}
              disabled={isReassigning || loadingHistory}
              className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
            >
              <option value="" disabled>-- Select Assistant --</option>
              {assistants.map(ast => (
                <option key={ast.id} value={ast.id}>{ast.name} ({ast.username})</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Assistant Assignment History
              </p>
              {activeAssignmentId && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                  Active
                </Badge>
              )}
            </div>

            {loadingHistory ? (
              <p className="text-xs text-muted-foreground">Loading assignment history...</p>
            ) : assignmentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No assignment data available for this Mangaka.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {assignmentHistory.map((item) => {
                  const isActive = !item.unassignedAt
                  return (
                    <div
                      key={item.assignmentId}
                      className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {item.fromUserName || getAssistantName(item.fromUserId)}
                          </p>
                        </div>
                        <Badge className={isActive
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold"
                          : "bg-muted text-muted-foreground border border-border text-[10px] font-bold"
                        }>
                          {isActive ? 'Assigned' : 'Ended'}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                        <span>Assigned: {formatDateTime(item.assignedAt)}</span>
                        <span>Ended: {formatDateTime(item.unassignedAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isReassigning || loadingHistory || !selectedAssistantId} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl mt-2 cursor-pointer transition-all">
            {isReassigning ? 'Changing Assistant...' : 'Confirm Assistant Assignment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
