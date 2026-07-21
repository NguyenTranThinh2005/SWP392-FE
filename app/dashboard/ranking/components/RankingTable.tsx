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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, AlertTriangle, Users } from 'lucide-react'
import { type RankingRow } from '../page'

interface RankingTableProps {
  rankings: RankingRow[]
  isAuthorized: boolean
  role: string
  votedSeries: Record<string, 'Discontinue' | 'Continue'>
  onDiscontinue: (id: string, title: string) => void
  onVote: (id: string, vote: 'Approved' | 'Rejected', title: string) => void
  selectedPeriod: string
}

export default function RankingTable({
  rankings,
  isAuthorized,
  role,
  votedSeries,
  onDiscontinue,
  onVote,
  selectedPeriod,
}: RankingTableProps) {
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
              <TableHead className="w-48 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
              {isAuthorized && (
                <TableHead className="w-64 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Board Decisions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {rankings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAuthorized ? 8 : 7} className="p-12 text-center text-muted-foreground space-y-2">
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
                  <TableRow key={row.seriesId} className={`border-b border-border transition-colors ${
                    row.rank === 1 ? 'bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100/60' :
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

                    {/* Status badge */}
                    <TableCell className="text-center">
                      {row.status === 'TOP 3' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          TOP 3
                        </Badge>
                      ) : row.status === 'BOTTOM 20%' ? (
                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> BOTTOM 20%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Board Decisions column */}
                    {isAuthorized && (
                      <TableCell className="text-center">
                        {row.status === 'BOTTOM 20%' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {role === 'EditorInChief' ? (
                              <Button
                                onClick={() => onDiscontinue(row.seriesId, row.seriesTitle)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                              >
                                Discontinue
                              </Button>
                            ) : (
                              <>
                                {votedSeries[row.seriesId] ? (
                                  <span className="text-[10px] text-muted-foreground font-semibold italic">
                                    Voted: {votedSeries[row.seriesId]}
                                  </span>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => onVote(row.seriesId, 'Rejected', row.seriesTitle)}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors mr-1"
                                    >
                                      Vote Discontinue
                                    </Button>
                                    <Button
                                      onClick={() => onVote(row.seriesId, 'Approved', row.seriesTitle)}
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                                    >
                                      Vote Continue
                                    </Button>
                                  </>
                                )}
                              </>
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
