'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import { Trophy, FileSpreadsheet, Info, Download, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Import backend APIs and logic helpers
import { fetchAPI } from '@/services/api'
import { seriesService } from '@/services/seriesService'
import { tokenService } from '@/services/tokenService'

// Import custom sub-components
import PeriodTabs from './components/PeriodTabs'
import PendingVotesCard from './components/PendingVotesCard'
import RankingTable from './components/RankingTable'
import BoardVoteModal from './components/BoardVoteModal'

export interface VoteRecord {
  id: string
  seriesId: string
  seriesTitle: string
  genre: string
  chapterId: string
  chapterTitle: string
  period: string
  readerCount: number
  voteCount: number
  score: number
  confirmed: boolean
  createdAt: string
  confirmedAt?: string
}

export interface RankingRow {
  rank: number
  seriesId: string
  seriesTitle: string
  genre: string
  voteCount: number
  readerCount: number
  score: number
  status: 'TOP 3' | 'BOTTOM 20%' | 'INACTIVE' | 'Rejected' | 'Cancelled' | 'Active' | '—' | string
  rankingSnapshotId?: string
  boardDecisionId?: string
  createdBy?: string
  continueVotes?: number
  discontinueVotes?: number
  isDiscontinued?: boolean
}

// Helper to generate dynamic quarters range (e.g. 2024-Q1 to 2027-Q4)
const generateDefaultPeriods = (): string[] => {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 2
  const endYear = currentYear + 1

  const list: string[] = []
  for (let y = endYear; y >= startYear; y--) {
    for (let q = 4; q >= 1; q--) {
      list.push(`${y}-Q${q}`)
    }
  }
  return list
}

// Helper to convert period strings like "2026-Q1" or "2026-01" to "dd/MM/yyyy" required by backend
const formatPeriodToDdMmYyyy = (period: string): string => {
  if (!period) return "01/01/2026"
  const trimmed = period.trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed
  }
  const qMatch = trimmed.match(/^(\d{4})-Q([1-4])$/i)
  if (qMatch) {
    const year = qMatch[1]
    const q = parseInt(qMatch[2], 10)
    const month = (q - 1) * 3 + 1
    const monthStr = month < 10 ? `0${month}` : `${month}`
    return `01/${monthStr}/${year}`
  }
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (dateMatch) {
    const year = dateMatch[1]
    const month = dateMatch[2]
    return `01/${month}/${year}`
  }
  return trimmed
}

// Helper to convert dd/MM/yyyy back to Quarter format (e.g. "01/10/2030" -> "2030-Q4")
const formatDdMmYyyyToQuarter = (period: string): string => {
  if (!period) return ''
  const trimmed = period.trim()
  if (/^\d{4}-Q[1-4]$/i.test(trimmed)) return trimmed.toUpperCase()
  const match = trimmed.match(/^01\/(\d{2})\/(\d{4})$/)
  if (match) {
    const month = parseInt(match[1], 10)
    const year = match[2]
    const q = Math.ceil(month / 3)
    return `${year}-Q${q}`
  }
  return trimmed
}

export default function RankingPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // State variables
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-Q1')
  const [allVoteRecords, setAllVoteRecords] = useState<VoteRecord[]>([])
  const [pendingVotes, setPendingVotes] = useState<VoteRecord[]>([])
  const [rankings, setRankings] = useState<RankingRow[]>([])
  const [allSeries, setAllSeries] = useState<any[]>([])
  const [votedSeries, setVotedSeries] = useState<Record<string, 'Discontinue' | 'Continue'>>({})
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)

  const [periods, setPeriods] = useState<string[]>(() => {
    const defaults = generateDefaultPeriods()
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('custom_ranking_periods')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const formatted = parsed
              .map(p => formatDdMmYyyyToQuarter(p))
              .filter(p => /^\d{4}-Q[1-4]$/i.test(p))
            return Array.from(new Set([...defaults, ...formatted])).sort((a, b) => b.localeCompare(a))
          }
        }
      } catch (e) {
        console.warn("Failed to load custom periods from localStorage", e)
      }
    }
    return defaults
  })

  // Add new custom period
  const handleAddPeriod = (newPeriod: string) => {
    setPeriods(prev => {
      if (prev.includes(newPeriod)) return prev
      const updated = [...prev, newPeriod].sort((a, b) => b.localeCompare(a))
      try {
        localStorage.setItem('custom_ranking_periods', JSON.stringify(updated))
      } catch (e) { }
      return updated
    })
  }

  // Determine if active user is Authorized Admin for Vote Imports
  const isAuthorized = useMemo(() => {
    return role === 'EditorialBoard' || role === 'EditorInChief'
  }, [role])

  // Determine if the current selected period is already confirmed & locked
  const isPeriodLocked = useMemo(() => {
    const formattedSelected = formatPeriodToDdMmYyyy(selectedPeriod)
    return allVoteRecords.some(r => r.confirmed && (r.period === selectedPeriod || formatPeriodToDdMmYyyy(r.period) === formattedSelected))
  }, [allVoteRecords, selectedPeriod])

  // Fetch all eligible series for ranking (Active, Cancelled, Discontinued)
  useEffect(() => {
    seriesService.listSeries().then((list) => {
      const eligibleSeries = list.filter((s) => {
        const rawStatus = (s.status || s.rawStatus || '').toLowerCase().replace(/[\s_]/g, '')
        return rawStatus === 'active' || rawStatus === 'cancelled' || rawStatus === 'discontinued'
      })

      setAllSeries(eligibleSeries.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre?.join(', ') || '',
        rawStatus: s.status || s.rawStatus || ''
      })))
    }).catch((err) => {
      console.warn("Failed to load series for ranking:", err)
      setAllSeries([])
      setIsLoadingData(false)
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [selectedPeriod, role, allSeries])

  const refreshData = async () => {
    if (allSeries.length === 0) return
    setIsLoadingData(true)
    try {
      const allRecordsList = await Promise.all(
        allSeries.map(async (s) => {
          try {
            const res = await fetchAPI<{ data: any[] } | any[]>(`/api/series/${s.id}/vote-records`)
            const records = (res as any).data || res
            if (Array.isArray(records)) {
              return records.map(r => ({
                id: r.voteRecordId || r.id,
                seriesId: s.id,
                seriesTitle: s.title,
                genre: s.genre || '',
                chapterId: 'C_default',
                chapterTitle: `Period: ${r.period}`,
                period: r.period,
                readerCount: r.readerCount,
                voteCount: r.voteCount,
                score: Math.round(((r.voteCount / (r.readerCount || 1)) * 100) * 100) / 100,
                confirmed: r.status?.toLowerCase() === 'confirmed',
                confirmedBy: r.confirmedBy || r.ConfirmedBy || r.confirmerId || r.createdById || r.createdBy,
                createdAt: r.createdAt
              }))
            }
          } catch (e) {
            console.warn(`Failed to fetch vote records for series ${s.id}:`, e)
          }
          return []
        })
      )

      const flatRecords = allRecordsList.flat()
      setAllVoteRecords(flatRecords)
      setPendingVotes(flatRecords.filter(r => !r.confirmed))

      // Auto-extract any unique periods from backend vote records
      const fetchedPeriods = Array.from(new Set(flatRecords.map(r => formatDdMmYyyyToQuarter(r.period)))).filter(p => p && /^\d{4}-Q[1-4]$/i.test(p)) as string[]
      if (fetchedPeriods.length > 0) {
        setPeriods(prev => {
          const merged = Array.from(new Set([...prev, ...fetchedPeriods]))
            .map(p => formatDdMmYyyyToQuarter(p))
            .filter(p => /^\d{4}-Q[1-4]$/i.test(p))
          return merged.sort((a, b) => b.localeCompare(a))
        })
      }

      // Calculate rankings for the selected period
      const formattedSelected = formatPeriodToDdMmYyyy(selectedPeriod)
      const confirmedForPeriod = flatRecords.filter(r => r.confirmed && (r.period === selectedPeriod || formatPeriodToDdMmYyyy(r.period) === formattedSelected))
      const sorted = [...confirmedForPeriod].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.voteCount - a.voteCount
      })
      const total = sorted.length
      let calculatedRankings: RankingRow[] = sorted.map((v, index) => {
        const rank = index + 1
        let status: 'TOP 3' | 'BOTTOM 20%' | 'INACTIVE' | '—' = '—'

        if (rank <= 3) {
          status = 'TOP 3'
        } else if (total >= 5) {
          const bottomCount = Math.ceil((total * 20) / 100)
          if (rank > total - bottomCount) {
            status = 'BOTTOM 20%'
          }
        }
        return {
          rank,
          seriesId: v.seriesId,
          seriesTitle: v.seriesTitle,
          genre: v.genre,
          voteCount: v.voteCount,
          readerCount: v.readerCount,
          score: v.score,
          status
        }
      })

      // Fetch official period ranking snapshots from backend to get rankingSnapshotId and official list
      try {
        const periodRes = await fetchAPI<{ data: any[] }>(`/api/ranking/periods?period=${encodeURIComponent(formattedSelected)}`)
        const backendSnapshots = (periodRes as any).data || periodRes || []
        if (Array.isArray(backendSnapshots) && backendSnapshots.length > 0) {
          const snapshotMap = new Map(backendSnapshots.map((s: any) => [s.seriesId, s]))
          calculatedRankings = calculatedRankings.map((row) => {
            const snap = snapshotMap.get(row.seriesId)
            if (snap) {
              return {
                ...row,
                rankingSnapshotId: snap.rankingSnapshotId || snap.id
              }
            }
            return row
          })
        }

        // Always sort by score descending and re-index sequential ranks (1..N) for the selected period
        calculatedRankings.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return b.voteCount - a.voteCount
        })
        const totalRows = calculatedRankings.length
        calculatedRankings = calculatedRankings.map((row, index) => {
          const rank = index + 1
          let status = row.status
          if (rank <= 3) {
            status = 'TOP 3'
          } else if (totalRows >= 5) {
            const bottomCount = Math.ceil((totalRows * 20) / 100)
            if (rank > totalRows - bottomCount) {
              status = 'BOTTOM 20%'
            } else {
              status = '—'
            }
          }
          return {
            ...row,
            rank,
            status
          }
        })
      } catch (e) {
        console.warn("Failed to fetch official period snapshots:", e)
      }

      // Fetch board decisions & votes count for bottom series to calculate INACTIVE status and vote totals
      const currentUser = tokenService.getUserInfo()
      const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub
      const updatedVotedSeries: Record<string, 'Discontinue' | 'Continue'> = {}

      try {
        calculatedRankings = await Promise.all(
          calculatedRankings.map(async (row) => {
            const seriesObj = allSeries.find(s => s.id === row.seriesId)
            const rawStat = (seriesObj?.rawStatus || '').toLowerCase().replace(/[\s_]/g, '')
            const isBackendCancelled = rawStat === 'cancelled' || rawStat === 'discontinued'

            // Find confirmedBy user ID for THIS selected period's vote record
            const currentPeriodRecord = confirmedForPeriod.find(r => r.seriesId === row.seriesId)
            const recordConfirmedBy = currentPeriodRecord?.confirmedBy

            try {
              const resDecisions = await fetchAPI<{ data: any[] }>(`/api/series/${row.seriesId}/board-decisions`)
              const decisions = (resDecisions as any).data || resDecisions || []

              if (Array.isArray(decisions) && decisions.length > 0) {
                // Strictly filter ONLY RankingElimination decisions for Ranking dashboard
                const eliminationDecisions = decisions.filter((d: any) =>
                  d.decisionType === 'RankingElimination' || d.decisionType === 'Elimination'
                )

                if (eliminationDecisions.length > 0) {
                  let cVotes = 0
                  let dVotes = 0
                  let isDiscontinued = isBackendCancelled || eliminationDecisions.some((d: any) =>
                    d.status === 'Cancelled' || d.status === 'Discontinued' || d.status === 'Approved' || d.result === 'Rejected' || d.result === 'Approved'
                  )

                  // Match decision specifically for this period/snapshot or open decision
                  const matchingSnapshotDecision = row.rankingSnapshotId
                    ? eliminationDecisions.find((d: any) => d.rankingSnapshotId && String(d.rankingSnapshotId).toLowerCase() === String(row.rankingSnapshotId).toLowerCase())
                    : null

                  const openDecision = eliminationDecisions.find((d: any) => d.status?.toLowerCase() === 'open')
                  const sortedDecisions = [...eliminationDecisions].sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                  )

                  const rankingDecision = matchingSnapshotDecision || openDecision || sortedDecisions[0]
                  const decisionId = rankingDecision?.boardDecisionId || rankingDecision?.id
                  const decisionCreatedBy = rankingDecision?.createdBy || rankingDecision?.userId || rankingDecision?.createdById

                  const effectiveCreatedBy = (openDecision ? (openDecision.createdBy || openDecision.userId || openDecision.createdById) : null) || recordConfirmedBy || decisionCreatedBy

                  if (rankingDecision) {
                    const dId = rankingDecision.boardDecisionId || rankingDecision.id
                    const dCreatedBy = rankingDecision.createdBy || rankingDecision.userId || rankingDecision.createdById
                    try {
                      const resVotes = await fetchAPI<{ data: any[] }>(`/api/board-decisions/${dId}/votes`)
                      const votes = (resVotes as any).data || resVotes || []
                      if (Array.isArray(votes)) {
                        votes.forEach((v: any) => {
                          const voterId = v.voterId || v.createdBy || v.userId || v.voter?.id

                          // BR-16: Exclude the decision creator's own vote
                          if (dCreatedBy && voterId && String(voterId).toLowerCase() === String(dCreatedBy).toLowerCase()) {
                            return
                          }

                          const isDiscontinue = v.voteValue === true || v.voteType === 'Approved'
                          const isContinue = v.voteValue === false || v.voteType === 'Rejected'
                          if (isContinue) cVotes++
                          else if (isDiscontinue) dVotes++

                          if (currentUserId && voterId && String(voterId).toLowerCase() === String(currentUserId).toLowerCase()) {
                            updatedVotedSeries[row.seriesId] = isDiscontinue ? 'Discontinue' : 'Continue'
                          }
                        })
                      }
                    } catch { }
                  }

                  if (dVotes >= 3) {
                    isDiscontinued = true
                  }

                  if (isDiscontinued) {
                    return {
                      ...row,
                      status: 'Cancelled' as const,
                      boardDecisionId: decisionId,
                      createdBy: effectiveCreatedBy,
                      continueVotes: cVotes,
                      discontinueVotes: dVotes,
                      isDiscontinued: true
                    }
                  }

                  return {
                    ...row,
                    boardDecisionId: decisionId,
                    createdBy: effectiveCreatedBy,
                    continueVotes: cVotes,
                    discontinueVotes: dVotes,
                    isDiscontinued: false
                  }
                }
              }

              if (isBackendCancelled) {
                return {
                  ...row,
                  status: 'Cancelled' as const,
                  createdBy: recordConfirmedBy,
                  isDiscontinued: true
                }
              }
            } catch {
              if (isBackendCancelled) {
                return {
                  ...row,
                  status: 'Cancelled' as const,
                  createdBy: recordConfirmedBy,
                  isDiscontinued: true
                }
              }
            }
            return {
              ...row,
              createdBy: recordConfirmedBy || row.createdBy
            }
          })
        )
      } catch (e) {
        console.warn("Failed to enrich rankings with board decisions:", e)
      }

      setVotedSeries(prev => ({ ...prev, ...updatedVotedSeries }))
      setRankings(calculatedRankings)
    } catch (err) {
      console.error("Failed to refresh ranking/votes data from backend:", err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Handle Excel (.xlsx) file import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Prevent import if period is already confirmed & locked
    if (isPeriodLocked) {
      toast.error(`Rankings for period "${selectedPeriod}" have already been confirmed & locked. Further Excel imports are disabled.`)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result
        if (!data) return
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        if (rows.length === 0) {
          toast.error("The selected file contains no data.")
          return
        }

        // Validate and import rows
        let importedCount = 0
        let errorsCount = 0

        for (const row of rows) {
          // Expected columns: Series Title, Period, Readers, Votes
          const seriesTitle = row["Series Title"] || row["SeriesTitle"] || row["Title"]
          const period = row["Period"] || selectedPeriod
          const readerCount = parseInt(row["Readers"] || row["ReaderCount"] || row["Reader Count"] || "0", 10)
          const voteCount = parseInt(row["Votes"] || row["VoteCount"] || row["Vote Count"] || "0", 10)

          if (!seriesTitle || !period) {
            errorsCount++
            continue
          }

          // Check if this row's period is locked
          const isRowPeriodLocked = allVoteRecords.some(r => r.confirmed && r.period === period.toString())
          if (isRowPeriodLocked) {
            console.warn(`Period ${period} is already confirmed & locked. Skipping row for "${seriesTitle}".`)
            errorsCount++
            continue
          }

          // Match series title (case insensitive, trim spaces)
          const matchedSeries = allSeries.find(
            (s) => s.title.toLowerCase().trim() === seriesTitle.toString().toLowerCase().trim()
          )

          if (!matchedSeries) {
            console.warn(`Series not found for title: ${seriesTitle}`)
            errorsCount++
            continue
          }

          if (readerCount < 0 || voteCount < 0 || voteCount > readerCount) {
            console.warn(`Invalid counts for ${seriesTitle}: Readers=${readerCount}, Votes=${voteCount}`)
            errorsCount++
            continue
          }

          const payload = {
            seriesId: matchedSeries.id,
            period: formatPeriodToDdMmYyyy(period.toString()),
            readerCount,
            voteCount
          }

          try {
            await fetchAPI('/api/ranking/vote-records', {
              method: 'POST',
              body: JSON.stringify(payload)
            }).catch(() => fetchAPI('/api/vote-records', {
              method: 'POST',
              body: JSON.stringify(payload)
            }))
            importedCount++
          } catch (err) {
            console.error(`Failed to import row for ${seriesTitle}:`, err)
            errorsCount++
          }
        }

        if (importedCount > 0) {
          toast.success(`Successfully imported ${importedCount} vote records!`)
          refreshData()
        }

        if (errorsCount > 0) {
          toast.warning(`Skipped ${errorsCount} invalid or locked rows. Double check series titles or locked periods.`)
        }

      } catch (err) {
        console.error("Failed to parse Excel file:", err)
        toast.error("Failed to parse Excel file. Ensure it is a valid .xlsx file.")
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  // Handle Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx')
      const latestSeriesList = await seriesService.listSeries()
      const currentActiveSeries = latestSeriesList.filter((s) => {
        const rawStatus = (s.status || s.rawStatus || '').toLowerCase().replace(/[\s_]/g, '')
        return rawStatus === 'active'
      })

      const templateData = currentActiveSeries.length > 0
        ? currentActiveSeries.map((s) => ({
          "Series Title": s.title,
          "Period": selectedPeriod || "2026-Q1",
          "Readers": 0,
          "Votes": 0
        }))
        : [
          { "Series Title": "Sample Series Title", "Period": selectedPeriod || "2026-Q1", "Readers": 0, "Votes": 0 }
        ]
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "RankingImportTemplate")
      XLSX.writeFile(workbook, `Ranking_Vote_Import_Template_${selectedPeriod || '2026-Q1'}.xlsx`)
      toast.success(`Excel template downloaded with ${currentActiveSeries.length} active series!`)
    } catch (err) {
      console.error("Failed to download template:", err)
      toast.error("Failed to download template file.")
    }
  }

  // Auto-ensure open board decisions for bottom tier series when confirming rankings
  const ensureOpenBoardDecisions = async (rows?: RankingRow[]) => {
    const targetPeriod = formatPeriodToDdMmYyyy(selectedPeriod)
    let currentRows = rows && rows.length > 0 ? rows : rankings

    try {
      const periodRes = await fetchAPI<{ data: any[] }>(`/api/ranking/periods?period=${encodeURIComponent(targetPeriod)}`)
      const backendSnapshots = (periodRes as any).data || periodRes || []
      if (Array.isArray(backendSnapshots) && backendSnapshots.length > 0) {
        currentRows = backendSnapshots.map((s: any) => ({
          rank: s.rankNo,
          seriesId: s.seriesId,
          seriesTitle: s.seriesTitle,
          genre: s.genre || '',
          voteCount: s.voteCount,
          readerCount: s.readerCount,
          score: s.score,
          status: s.rankNo <= 3 ? 'TOP 3' : (s.isBottom20Percent ? 'BOTTOM 20%' : '—'),
          rankingSnapshotId: s.rankingSnapshotId || s.id
        }))
      }
    } catch (e) {
      console.warn("Failed to fetch official snapshots during ensureOpenBoardDecisions:", e)
    }

    const bottomSeries = currentRows.filter(r => r.score < 20 || r.status === 'BOTTOM 20%')
    if (bottomSeries.length === 0) return

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    for (const row of bottomSeries) {
      try {
        let snapshotId = row.rankingSnapshotId
        if (!snapshotId) {
          try {
            const resHist = await fetchAPI<{ data: any[] }>(`/api/ranking/series/${row.seriesId}`)
            const hist = (resHist as any).data || resHist || []
            if (Array.isArray(hist) && hist.length > 0) {
              snapshotId = hist[0].rankingSnapshotId || hist[0].id
            }
          } catch { }
        }

        if (!snapshotId) continue

        const resDecisions = await fetchAPI<{ data: any[] }>(`/api/series/${row.seriesId}/board-decisions`)
        const decisions = (resDecisions as any).data || resDecisions || []
        const hasOpen = Array.isArray(decisions) && decisions.some((d: any) => d.status?.toLowerCase() === 'open' && (d.decisionType === 'RankingElimination' || d.decisionType === 'Elimination'))

        if (!hasOpen) {
          await fetchAPI(`/api/ranking/snapshots/${snapshotId}/elimination-decision`, {
            method: 'POST',
            body: JSON.stringify({ votingDeadline: nextWeek.toISOString() })
          })
        }
      } catch (err) {
        console.warn(`Auto-open board decision check skipped for ${row.seriesTitle}:`, err)
      }
    }
  }

  // Handle vote confirmation
  const handleConfirmVote = (id: string, title: string) => {
    const confirmPromise = fetchAPI(`/api/ranking/vote-records/${id}/confirm`, { method: 'POST' })
      .catch(() => fetchAPI(`/api/vote-records/${id}/confirm`, { method: 'PUT' }))

    confirmPromise.then(async () => {
      toast.success(`Confirmed vote record for "${title}". Rankings recalculated! You are not allowed to vote (conflict of interest).`)
      await refreshData()
      await ensureOpenBoardDecisions()
      await refreshData()
    }).catch((err) => {
      console.error("Failed to confirm vote record:", err)
      toast.error('Failed to confirm vote record.')
    })
  }

  // Handle confirm all pending votes & lock ranking
  const handleConfirmAllVotes = async () => {
    if (pendingVotes.length === 0) return
    if (!confirm(`Are you sure you want to confirm all ${pendingVotes.length} pending vote record(s) and lock rankings for period "${selectedPeriod}"?`)) {
      return
    }

    try {
      await Promise.all(
        pendingVotes.map(v =>
          fetchAPI(`/api/ranking/vote-records/${v.id}/confirm`, { method: 'POST' })
            .catch(() => fetchAPI(`/api/vote-records/${v.id}/confirm`, { method: 'PUT' }))
        )
      )
      toast.success(`All vote records confirmed! Rankings for "${selectedPeriod}" have been locked. You are not allowed to vote (conflict of interest).`)
      await refreshData()
      await ensureOpenBoardDecisions()
      await refreshData()
    } catch (err) {
      console.error("Failed to confirm all votes:", err)
      toast.error("Failed to confirm all vote records.")
    }
  }

  // Handle Chief Editor Veto / Discontinuation of Series
  const handleDiscontinueSeries = (seriesId: string, title: string) => {
    if (confirm(`Are you sure you want to discontinue the publication of "${title}"? This action is irreversible.`)) {
      seriesService.deleteSeries(seriesId).then(async () => {
        toast.success(`"${title}" has been discontinued from publication!`)
        await refreshData()
      }).catch((err: any) => {
        toast.error(err.message || 'Failed to discontinue publication.')
      })
    }
  }

  // Handle Editorial Board Member Vote on Discontinuation
  const handleVoteDiscontinue = (seriesId: string, vote: 'Approved' | 'Rejected', title: string) => {
    seriesService.voteSeries(seriesId, vote).then(() => {
      const voteLabel = vote === 'Approved' ? 'Discontinue' : 'Continue'
      toast.success(`Successfully cast vote to "${voteLabel}" for "${title}".`)
      setVotedSeries(prev => ({
        ...prev,
        [seriesId]: voteLabel
      }))
    }).catch(() => {
      toast.error('Failed to cast vote.')
    })
  }

  // Modal States for Editorial Board Voting
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [selectedVoteRow, setSelectedVoteRow] = useState<RankingRow | null>(null)

  const handleOpenVoteModal = (row: RankingRow) => {
    setSelectedVoteRow(row)
    setIsVoteModalOpen(true)
  }

  const handleCastVoteModal = async (
    seriesId: string,
    decision: 'Continue' | 'Discontinue',
    comment: string
  ) => {
    const voteType = decision === 'Discontinue' ? 'Approved' : 'Rejected'
    try {
      // Pass selectedPeriod so voteSeries can resolve the rankingSnapshotId from the locked period
      await seriesService.voteSeries(seriesId, voteType, comment, selectedVoteRow?.rankingSnapshotId, selectedPeriod)
      toast.success(`Successfully cast vote to "${decision}" for "${selectedVoteRow?.seriesTitle}".`)
      setVotedSeries(prev => ({
        ...prev,
        [seriesId]: decision
      }))
      await refreshData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit vote.')
      throw err
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Series Ranking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated ranking based on reader votes
          </p>
        </div>

        {/* Import Buttons: only visible to Editorial Board or Editor-in-Chief */}
        {isAuthorized ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all border-border text-foreground hover:bg-accent"
            >
              <Download className="w-4 h-4 text-primary" /> Download Template
            </Button>

            {isLoadingData ? (
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-muted/65 border border-border text-muted-foreground font-semibold text-xs px-4 py-2.5 rounded-lg opacity-70">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Syncing Votes...
              </div>
            ) : isPeriodLocked ? (
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm font-semibold">
                <Lock className="w-4 h-4 text-amber-500" /> Ranking Locked ({selectedPeriod})
              </div>
            ) : (
              <>
                {/* Hidden File Input for Excel Import */}
                <input
                  type="file"
                  id="excel-import-file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <label
                  htmlFor="excel-import-file"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Import Excel (.xlsx)
                </label>
              </>
            )}
          </div>
        ) : (
          <div className="text-[11px] bg-muted/50 border border-border p-2 rounded-lg text-muted-foreground max-w-xs text-center">
            <strong>Read-Only Mode:</strong> Only the Editorial Board is authorized to import ranking vote data.
          </div>
        )}
      </div>

      {/* Pending Confirmation List */}
      {pendingVotes.length > 0 && (
        <PendingVotesCard
          pendingVotes={pendingVotes}
          isAuthorized={isAuthorized}
          onConfirm={handleConfirmVote}
          onConfirmAll={handleConfirmAllVotes}
        />
      )}

      {/* Period Selector Tabs Carousel */}
      <PeriodTabs
        periods={periods}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        onAddPeriod={handleAddPeriod}
        isAuthorized={isAuthorized}
      />

      {/* Main Ranking Table Component */}
      <RankingTable
        rankings={rankings}
        isAuthorized={isAuthorized}
        role={role}
        votedSeries={votedSeries}
        onDiscontinue={handleDiscontinueSeries}
        onVote={handleVoteDiscontinue}
        onOpenVoteModal={handleOpenVoteModal}
        selectedPeriod={selectedPeriod}
        isPeriodLocked={isPeriodLocked}
      />

      {/* Editorial Board Vote Modal */}
      {selectedVoteRow && (
        <BoardVoteModal
          isOpen={isVoteModalOpen}
          onClose={() => {
            setIsVoteModalOpen(false)
            setSelectedVoteRow(null)
          }}
          seriesId={selectedVoteRow.seriesId}
          seriesTitle={selectedVoteRow.seriesTitle}
          score={selectedVoteRow.score}
          rank={selectedVoteRow.rank}
          period={selectedPeriod}
          createdBy={selectedVoteRow.createdBy}
          isPeriodLocked={isPeriodLocked}
          onCastVote={handleCastVoteModal}
        />
      )}
    </div>
  )
}
