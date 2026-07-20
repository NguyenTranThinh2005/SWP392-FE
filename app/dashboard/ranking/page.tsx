'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import { Trophy, FileSpreadsheet, Info, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Import backend APIs and logic helpers
import { fetchAPI } from '@/services/api'
import { seriesService } from '@/services/seriesService'

// Import custom sub-components
import PeriodTabs from './components/PeriodTabs'
import PendingVotesCard from './components/PendingVotesCard'
import RankingTable from './components/RankingTable'

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
  status: 'TOP 3' | 'BOTTOM 20%' | '—'
}

export default function RankingPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // State variables
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-Q1')
  const [pendingVotes, setPendingVotes] = useState<VoteRecord[]>([])
  const [rankings, setRankings] = useState<RankingRow[]>([])
  const [allSeries, setAllSeries] = useState<any[]>([])
  const [votedSeries, setVotedSeries] = useState<Record<string, 'Discontinue' | 'Continue'>>({})

  const periods = ['2026-Q2', '2026-Q1', '2025-Q4']

  // Determine if active user is Authorized Admin for Vote Imports
  const isAuthorized = useMemo(() => {
    return role === 'EditorialBoard' || role === 'EditorInChief'
  }, [role])

  // Fetch all active series for ranking (Explicitly filter eligible statuses)
  useEffect(() => {
    seriesService.listSeries().then((list) => {
      // Statuses allowed for ranking & Excel download
      const ALLOWED_STATUSES = ['active', 'ongoing', 'published']
      // Statuses strictly excluded (drafts, pending proposals, under review, cancelled)
      const EXCLUDED_STATUSES = ['underreview', 'pendingreview', 'rejected', 'draft', 'boardvoting', 'cancelled', 'inactive', 'expired']

      const activeSeriesOnly = list.filter((s) => {
        const rawStatus = (s.status || s.rawStatus || '').toLowerCase().replace(/[\s_]/g, '')

        // 1. If explicitly in allowed active statuses -> ACCEPT
        if (ALLOWED_STATUSES.includes(rawStatus)) return true
        // 2. If in excluded proposal/review statuses -> REJECT
        if (EXCLUDED_STATUSES.includes(rawStatus)) return false

        // 3. Fallback: accept if not excluded
        return true
      })

      setAllSeries(activeSeriesOnly.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre?.join(', ') || ''
      })))
    }).catch((err) => {
      console.warn("Failed to load active series:", err)
      setAllSeries([])
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [selectedPeriod, role, allSeries])

  const refreshData = async () => {
    if (allSeries.length === 0) return
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
      setPendingVotes(flatRecords.filter(r => !r.confirmed))

      // Calculate rankings for the selected period
      const confirmedForPeriod = flatRecords.filter(r => r.confirmed && r.period === selectedPeriod)
      const sorted = [...confirmedForPeriod].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.voteCount - a.voteCount
      })
      const total = sorted.length
      const calculatedRankings = sorted.map((v, index) => {
        const rank = index + 1
        let status: 'TOP 3' | 'BOTTOM 20%' | '—' = '—'

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
      setRankings(calculatedRankings)
    } catch (err) {
      console.error("Failed to refresh ranking/votes data from backend:", err)
    }
  }

  // Handle Excel (.xlsx) file import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
          const period = row["Period"]
          const readerCount = parseInt(row["Readers"] || row["ReaderCount"] || row["Reader Count"] || "0", 10)
          const voteCount = parseInt(row["Votes"] || row["VoteCount"] || row["Vote Count"] || "0", 10)

          if (!seriesTitle || !period) {
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
            period: period.toString(),
            readerCount,
            voteCount
          }

          try {
            await fetchAPI('/api/vote-records', {
              method: 'POST',
              body: JSON.stringify(payload)
            })
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
          toast.warning(`Skipped ${errorsCount} invalid rows. Double check series titles or counts.`)
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
      const templateData = allSeries.length > 0
        ? allSeries.map((s) => ({
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
      toast.success(`Excel template downloaded with ${allSeries.length} active series!`)
    } catch (err) {
      console.error("Failed to download template:", err)
      toast.error("Failed to download template file.")
    }
  }

  // Handle vote confirmation
  const handleConfirmVote = (id: string, title: string) => {
    fetchAPI(`/api/vote-records/${id}/confirm`, {
      method: 'PUT'
    }).then(() => {
      toast.success(`Confirmed vote record for "${title}". Rankings recalculated!`)
      refreshData()
    }).catch(() => {
      toast.error('Failed to confirm vote record.')
    })
  }

  // Handle Chief Editor Veto / Discontinuation of Series
  const handleDiscontinueSeries = (seriesId: string, title: string) => {
    if (confirm(`Are you sure you want to discontinue the publication of "${title}"? This action is irreversible.`)) {
      seriesService.deleteSeries(seriesId).then(() => {
        toast.success(`"${title}" has been discontinued from publication!`)
        // Filter out from rankings locally
        setRankings(prev => prev.filter(r => r.seriesId !== seriesId))
      }).catch((err: any) => {
        toast.error(err.message || 'Failed to discontinue publication.')
      })
    }
  }

  // Handle Editorial Board Member Vote on Discontinuation
  const handleVoteDiscontinue = (seriesId: string, vote: 'Approved' | 'Rejected', title: string) => {
    seriesService.voteSeries(seriesId, vote).then(() => {
      const voteLabel = vote === 'Rejected' ? 'Discontinue' : 'Continue'
      toast.success(`Successfully cast vote to "${voteLabel}" for "${title}".`)
      setVotedSeries(prev => ({
        ...prev,
        [seriesId]: voteLabel
      }))
    }).catch(() => {
      toast.error('Failed to cast vote.')
    })
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
              <Download className="w-4 h-4 text-emerald-500" /> Download Template
            </Button>

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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel (.xlsx)
            </label>
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
        />
      )}

      {/* Period Selector Tabs */}
      <PeriodTabs
        periods={periods}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
      />

      {/* Main Ranking Table Component */}
      <RankingTable
        rankings={rankings}
        isAuthorized={isAuthorized}
        role={role}
        votedSeries={votedSeries}
        onDiscontinue={handleDiscontinueSeries}
        onVote={handleVoteDiscontinue}
        selectedPeriod={selectedPeriod}
      />
    </div>
  )
}
