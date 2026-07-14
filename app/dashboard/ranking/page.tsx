'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import { Trophy, FileSpreadsheet, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Import backend APIs and logic helpers
import { fetchAPI } from '@/services/api'
import { seriesService } from '@/services/seriesService'
import { chapterService } from '@/services/chapterService'

// Import custom sub-components
import PeriodTabs from './components/PeriodTabs'
import PendingVotesCard from './components/PendingVotesCard'
import RankingTable from './components/RankingTable'
import ImportVoteDialog from './components/ImportVoteDialog'

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
  const [availableChapters, setAvailableChapters] = useState<any[]>([])
  const [votedSeries, setVotedSeries] = useState<Record<string, 'Discontinue' | 'Continue'>>({})

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form states
  const [formSeriesId, setFormSeriesId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formReaderCount, setFormReaderCount] = useState<number>(0)
  const [formVoteCount, setFormVoteCount] = useState<number>(0)
  const [formPeriod, setFormPeriod] = useState('2026-Q1')

  const periods = ['2026-Q2', '2026-Q1', '2025-Q4']

  // Determine if active user is Authorized Admin for Vote Imports
  const isAuthorized = useMemo(() => {
    return role === 'EditorialBoard' || role === 'EditorInChief'
  }, [role])

  // Fetch all active series
  useEffect(() => {
    seriesService.listSeries().then((list) => {
      setAllSeries(list.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre?.join(', ') || 'Fantasy'
      })))
    }).catch((err) => {
      console.warn("Failed to load active series:", err)
      setAllSeries([])
    })
  }, [])

  // Fetch chapters when formSeriesId changes
  useEffect(() => {
    if (!formSeriesId) {
      setAvailableChapters([])
      return
    }
    chapterService.getChaptersBySeries(formSeriesId).then((res) => {
      setAvailableChapters(res.map(c => ({
        id: c.id,
        title: `Ch. ${c.number || (c as any).chapterNo || 1}: ${c.title}`
      })))
    }).catch(() => {
      setAvailableChapters([{ id: 'C_default', title: 'Ch. 1: Storyboard Draft' }])
    })
  }, [formSeriesId])

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
                genre: s.genre || 'Fantasy',
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

  // Handle vote import submission (validations)
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formSeriesId || !formChapterId) {
      toast.error('Please select both a Series and a Chapter.')
      return
    }

    if (formReaderCount < 0 || formVoteCount < 0) {
      toast.error('Reader count and Vote count must be non-negative values.')
      return
    }

    // constraint: readerCount >= voteCount
    if (formVoteCount > formReaderCount) {
      toast.error('Vote count cannot exceed total readers.')
      return
    }

    const payload = {
      seriesId: formSeriesId,
      period: formPeriod,
      readerCount: formReaderCount,
      voteCount: formVoteCount
    }

    fetchAPI('/api/vote-records', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(() => {
      toast.success('Vote record successfully imported as Pending Confirmation!')
      setIsDialogOpen(false)

      // Reset form fields
      setFormSeriesId('')
      setFormChapterId('')
      setFormReaderCount(0)
      setFormVoteCount(0)

      refreshData()
    }).catch((err: any) => {
      toast.error(err.message || 'Failed to import vote data.')
    })
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
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
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

            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Enter Vote Data
            </Button>
          </div>
        ) : (
          <div className="text-[11px] bg-muted/50 border border-border p-2 rounded-lg text-muted-foreground max-w-xs text-center">
            💡 <strong>Read-Only Mode:</strong> Only the Editorial Board is authorized to import ranking vote data.
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

      {/* Rules Footnote */}
      <div className="flex items-start gap-2.5 p-4 bg-muted/30 border border-border/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground">Rules enforced:</span> Entry authority, uniqueness, validation, formula, tie-break, auto-recalculate, bottom 20% flag
        </div>
      </div>

      {/* Manual Input Dialog */}
      <ImportVoteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formSeriesId={formSeriesId}
        setFormSeriesId={setFormSeriesId}
        formChapterId={formChapterId}
        setFormChapterId={setFormChapterId}
        formReaderCount={formReaderCount}
        setFormReaderCount={setFormReaderCount}
        formVoteCount={formVoteCount}
        setFormVoteCount={setFormVoteCount}
        formPeriod={formPeriod}
        setFormPeriod={setFormPeriod}
        allSeries={allSeries}
        availableChapters={availableChapters}
        periods={periods}
        onSubmit={handleImportSubmit}
      />
    </div>
  )
}
