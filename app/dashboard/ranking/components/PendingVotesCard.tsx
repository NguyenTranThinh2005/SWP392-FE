'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Check } from 'lucide-react'
import { type VoteRecord } from '../page'

interface PendingVotesCardProps {
  pendingVotes: VoteRecord[]
  isAuthorized: boolean
  onConfirm: (id: string, title: string) => void
}

export default function PendingVotesCard({
  pendingVotes,
  isAuthorized,
  onConfirm,
}: PendingVotesCardProps) {
  return (
    <Card className="border-amber-500/25 bg-amber-500/5 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span>Pending Confirmation ({pendingVotes.length} records)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {pendingVotes.map(vote => (
          <div
            key={vote.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0d1527]/60 border border-border/60 rounded-lg"
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
              <span className="text-xs font-bold text-cyan-500 mr-2">
                Score: {vote.score}%
              </span>
              {isAuthorized ? (
                <Button
                  onClick={() => onConfirm(vote.id, vote.seriesTitle)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-md shrink-0 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Confirm
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">Awaiting Admin Confirmation</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
