'use client'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Users, ShieldAlert } from 'lucide-react'
import { type RankingRow } from '../page'
import { tokenService } from '@/services/tokenService'

interface RankingTableProps {
  rankings: RankingRow[]
  isAuthorized: boolean
  role: string
  votedSeries: Record<string, 'Discontinue' | 'Continue'>
  onDiscontinue: (id: string, title: string) => void
  onVote: (id: string, vote: 'Approved' | 'Rejected', title: string) => void
  onOpenVoteModal: (row: RankingRow) => void
  selectedPeriod: string
  isPeriodLocked?: boolean
}

export default function RankingTable({
  rankings,
  isAuthorized,
  role,
  votedSeries,
  onDiscontinue,
  onVote,
  onOpenVoteModal,
  selectedPeriod,
  isPeriodLocked,
}: RankingTableProps) {
  const currentUser = tokenService.getUserInfo()
  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub
  return (
    <Card className="border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30 border-b border-border">
            <TableRow>
              <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Rank</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Series</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Genre</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Votes</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Readers</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Score</TableHead>
              {isAuthorized && (
                <TableHead className="w-64 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Board Decisions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {rankings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAuthorized ? 7 : 6} className="p-12 text-center text-muted-foreground space-y-2">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
                  <p className="text-xs">No ranking data confirmed for period {selectedPeriod}.</p>
                </TableCell>
              </TableRow>
            ) : (
              rankings.map(row => {
                // Determine Score Text styling class
                let scoreClass = 'text-slate-600 dark:text-slate-400'
                if (row.score >= 70) scoreClass = 'text-emerald-500 font-extrabold'
                else if (row.score >= 40) scoreClass = 'text-amber-500 font-bold'
                else scoreClass = 'text-rose-500 font-bold'

                return (
                  <TableRow key={row.seriesId} className={`border-b border-border transition-colors ${row.rank === 1 ? 'bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100/60' :
                    row.rank === 2 ? 'bg-slate-50 dark:bg-slate-500/5 hover:bg-slate-100/60' :
                      row.rank === 3 ? 'bg-orange-50 dark:bg-orange-500/5 hover:bg-orange-100/60' :
                        'hover:bg-muted/15'
                    }`}>
                    {/* Rank Cell */}
                    <TableCell className="text-center font-bold">
                      {row.rank === 1 ? (
                        <div className="flex flex-col items-center" title="Rank 1">
                          <Trophy className="w-6 h-6 text-amber-500" />
                          <span className="text-[10px] font-extrabold text-amber-600">TOP 1</span>
                        </div>
                      ) : row.rank === 2 ? (
                        <div className="flex flex-col items-center" title="Rank 2">
                          <Medal className="w-6 h-6 text-slate-400" />
                          <span className="text-[10px] font-extrabold text-slate-500">TOP 2</span>
                        </div>
                      ) : row.rank === 3 ? (
                        <div className="flex flex-col items-center" title="Rank 3">
                          <Medal className="w-6 h-6 text-orange-600" />
                          <span className="text-[10px] font-extrabold text-orange-600">TOP 3</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-slate-400 text-sm font-bold">
                          {row.rank}
                        </span>
                      )}
                    </TableCell>

                    {/* Title */}
                    <TableCell className="font-bold text-foreground">{row.seriesTitle}</TableCell>

                    {/* Genre */}
                    <TableCell className="text-xs text-muted-foreground font-semibold">{row.genre}</TableCell>

                    {/* Votes count */}
                    <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {row.voteCount.toLocaleString()}
                    </TableCell>

                    {/* Readers count */}
                    <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {row.readerCount.toLocaleString()}
                    </TableCell>

                    {/* Vote percentage score */}
                    <TableCell className={`text-right text-sm ${scoreClass}`}>
                      {row.score.toFixed(2)}%
                    </TableCell>

                    {/* Board Decisions column */}
                    {isAuthorized && (
                      <TableCell className="text-center">
                        {row.isDiscontinued || row.status === 'Cancelled' || row.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[10px] px-2.5 py-1 rounded-md">
                            CANCELLED
                          </span>
                        ) : row.continueVotes && row.continueVotes > 0 && row.continueVotes >= (row.discontinueVotes || 0) ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[10px] px-2.5 py-1 rounded-md">
                            CONTINUED
                          </span>
                        ) : !isPeriodLocked ? (
                          <span className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground border border-border font-semibold text-[10px] px-2.5 py-1 rounded-md" title="Confirm & Lock rankings for this period first before voting on decisions.">
                            Lock Required
                          </span>
                        ) : row.score < 20 || row.status === 'BOTTOM 20%' || row.status === 'INACTIVE' ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {role === 'EditorInChief' ? (
                              <Button
                                onClick={() => onDiscontinue(row.seriesId, row.seriesTitle)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer transition-colors"
                              >
                                Discontinue
                              </Button>
                            ) : row.createdBy && currentUserId && String(row.createdBy).toLowerCase() === String(currentUserId).toLowerCase() ? (
                              <button
                                onClick={() => onOpenVoteModal(row)}
                                className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                title="You created this voting session. Click to view votes (voting is restricted due to conflict of interest)."
                              >
                                <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                                Created (View Only)
                              </button>
                            ) : (
                              <Button
                                onClick={() => onOpenVoteModal(row)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                              >
                                Vote Decision
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
