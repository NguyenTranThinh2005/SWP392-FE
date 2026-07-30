'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Vote,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  TrendingDown,
  Users,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { seriesService } from '@/services/seriesService'
import { tokenService } from '@/services/tokenService'

interface BoardVoteModalProps {
  isOpen: boolean
  onClose: () => void
  seriesId: string
  seriesTitle: string
  score: number
  rank: number
  period: string
  createdBy?: string
  onCastVote: (seriesId: string, decision: 'Continue' | 'Discontinue', comment: string) => Promise<void>
}

export default function BoardVoteModal({
  isOpen,
  onClose,
  seriesId,
  seriesTitle,
  score,
  rank,
  period,
  createdBy,
  onCastVote
}: BoardVoteModalProps) {
  const currentUser = tokenService.getUserInfo()
  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub
  const isCreator = Boolean(
    createdBy &&
    currentUserId &&
    String(createdBy).toLowerCase() === String(currentUserId).toLowerCase()
  )

  const [selectedDecision, setSelectedDecision] = useState<'Continue' | 'Discontinue' | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [votesList, setVotesList] = useState<any[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(false)

  // Fetch list of votes specifically for the Ranking Elimination decision of this series
  useEffect(() => {
    if (!isOpen || !seriesId) return
    setIsLoadingVotes(true)
    ;(async () => {
      try {
        const rankingDecision = await seriesService.getRankingBoardDecision(seriesId)
        if (rankingDecision) {
          const decisionId = rankingDecision.boardDecisionId || rankingDecision.id
          if (decisionId) {
            const votes = await seriesService.getBoardVotes(decisionId)
            if (Array.isArray(votes)) {
              setVotesList(votes)
            }
          }
        } else {
          setVotesList([])
        }
      } catch (err) {
        console.warn("Failed to load ranking board votes in modal:", err)
      } finally {
        setIsLoadingVotes(false)
      }
    })()
  }, [isOpen, seriesId])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedDecision) return
    setIsSubmitting(true)
    try {
      await onCastVote(seriesId, selectedDecision, comment.trim())
      onClose()
    } catch {
      // Handled in parent toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-0 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                Editorial Board Vote
              </h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Period: <span className="text-primary font-bold">{period}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Series Overview Box */}
          <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-foreground">{seriesTitle}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                  Current Rank: <span className="text-foreground font-extrabold">#{rank}</span>
                </p>
              </div>
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Score: {score.toFixed(2)}%
              </Badge>
            </div>

            {score < 20 && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>This series is in the bottom performance tier. Your vote determines whether to continue or discontinue publication.</span>
              </div>
            )}
          </div>

          {/* Creator Conflict of Interest Alert */}
          {isCreator ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-700 dark:text-amber-300">Creator Voting Restriction (Conflict of Interest)</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  You initiated/created this elimination voting session. Under Editorial Board policy, voting is restricted for session creators to preserve impartiality. You can inspect active board member votes below.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Voting Options */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Select Your Vote Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: Continue */}
                  <button
                    type="button"
                    onClick={() => setSelectedDecision('Continue')}
                    className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${selectedDecision === 'Continue'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-border/70 hover:border-emerald-500/50 bg-card'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CheckCircle2 className={`w-5 h-5 ${selectedDecision === 'Continue' ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                      {selectedDecision === 'Continue' && (
                        <span className="text-[9px] uppercase font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Continue</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        Maintain publication
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Discontinue */}
                  <button
                    type="button"
                    onClick={() => setSelectedDecision('Discontinue')}
                    className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${selectedDecision === 'Discontinue'
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
                        : 'border-border/70 hover:border-rose-500/50 bg-card'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <XCircle className={`w-5 h-5 ${selectedDecision === 'Discontinue' ? 'text-rose-500' : 'text-muted-foreground/40'}`} />
                      {selectedDecision === 'Discontinue' && (
                        <span className="text-[9px] uppercase font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Discontinue</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        Cancel publication
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Editorial Rationale / Comment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Editorial Rationale (Optional)</span>
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/60" />
                </label>
                <textarea
                  placeholder="Provide context or reasoning for your vote..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-muted/30 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                />
              </div>
            </>
          )}

          {/* Current Board Votes List */}
          <div className="space-y-2 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Current Board Votes ({votesList.length})
              </label>
              {isLoadingVotes && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>

            {votesList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2.5 rounded-lg text-center border border-border/40 font-medium">
                No ranking votes recorded yet for this session.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {votesList.map((v: any, idx: number) => {
                  const isContinue = v.voteValue === true || v.voteType === 'Approved'
                  const voterName = v.voterName || v.voter?.name || v.voter?.fullName || v.voter?.username || `Editorial Board Member ${idx + 1}`
                  const votedAt = v.createdAt || v.votedAt || v.timestamp
                  const rawComment = (v.comment || v.rationale || '').trim()
                  const isAutoGenerated = !rawComment ||
                    rawComment.startsWith('Voted ') ||
                    rawComment.includes('from Editorial Board') ||
                    rawComment.includes('rejected based on ranking performance') ||
                    rawComment.includes('quality standards')
                  const commentText = isAutoGenerated ? '' : rawComment

                  // ponytail: simple vote log item rendering with optional comment
                  return (
                    <div
                      key={v.id || v.boardVoteId || idx}
                      className="p-2.5 bg-muted/30 border border-border/60 rounded-lg space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-extrabold text-foreground truncate">{voterName}</p>
                          {votedAt && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {new Date(votedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge className={isContinue
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] px-2.5 py-0.5 rounded-md shrink-0'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[9px] px-2.5 py-0.5 rounded-md shrink-0'
                        }>
                          {isContinue ? 'CONTINUE' : 'DISCONTINUE'}
                        </Badge>
                      </div>
                      {commentText && (
                        <p className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/30 italic">
                          "{commentText}"
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 font-semibold bg-muted/20 p-2.5 rounded-lg border border-border/40">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Votes are cryptographically recorded and verified under Editorial Board policy.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCreator || !selectedDecision || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs px-5 py-2 rounded-xl cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Submitting Vote...' : isCreator ? 'Voting Restricted' : 'Submit Official Vote'}
          </Button>
        </div>
      </div>
    </div>
  )
}
