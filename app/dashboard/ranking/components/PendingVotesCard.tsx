'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Check, Lock, CheckCheck } from 'lucide-react'
import { type VoteRecord } from '../page'

interface PendingVotesCardProps {
  pendingVotes: VoteRecord[]
  isAuthorized: boolean
  onConfirm: (id: string, title: string) => void
  onConfirmAll?: () => void
}

export default function PendingVotesCard({
  pendingVotes,
  isAuthorized,
  onConfirm,
  onConfirmAll,
}: PendingVotesCardProps) {
  return (
    <Card className="border-amber-500/25 bg-amber-500/5 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-600 dark:text-amber-500 font-bold text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Pending Confirmation ({pendingVotes.length} records)</span>
        </div>

        {isAuthorized && onConfirmAll && (
          <Button
            onClick={onConfirmAll}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <Lock className="w-3.5 h-3.5" />
            Confirm All & Lock Ranking
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {pendingVotes.map(vote => (
          <div
            key={vote.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm truncate">{vote.seriesTitle}</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                  {vote.period}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Readers: <strong className="text-foreground">{vote.readerCount.toLocaleString()}</strong> | Votes: <strong className="text-foreground">{vote.voteCount.toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary mr-2">
                Score: {vote.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
