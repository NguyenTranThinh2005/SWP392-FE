import { calculateVoteScore } from './business-logic'
import { rankingService } from '@/services/rankingService'

export interface VoteRecord {
  id: string
  seriesId: string
  seriesTitle: string
  genre: string
  chapterId: string
  chapterTitle: string
  period: string // e.g., "2026-Q2", "2026-Q1", "2025-Q4"
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
  status: 'TOP 3' | 'BOTTOM 20% (BR-94)' | '—'
}

const STORAGE_KEY = 'mangaflow_votes'
const SEED_VOTES: VoteRecord[] = []

function loadVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return SEED_VOTES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VOTES))
      return SEED_VOTES
    }
    return JSON.parse(raw) as VoteRecord[]
  } catch {
    return SEED_VOTES
  }
}

function saveVotes(votes: VoteRecord[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

export function getVoteRecords(): VoteRecord[] {
  return loadVotes()
}

export function getPendingVotes(): VoteRecord[] {
  return loadVotes().filter(v => !v.confirmed)
}

export function createVoteRecord(data: Omit<VoteRecord, 'id' | 'score' | 'confirmed' | 'createdAt'>): VoteRecord {
  const votes = loadVotes()
  
  // Enforce BR-88: One VoteRecord per period per series
  const exists = votes.some(v => v.seriesId === data.seriesId && v.period === data.period)
  if (exists) {
    throw new Error(`A vote record already exists for ${data.seriesTitle} in period ${data.period}.`)
  }

  const score = calculateVoteScore(data.voteCount, data.readerCount)

  const newRecord: VoteRecord = {
    ...data,
    id: `V${String(votes.length + 1).padStart(2, '0')}`,
    score: Math.round(score * 100) / 100, // round to 2 decimals
    confirmed: false,
    createdAt: new Date().toISOString()
  }

  votes.push(newRecord)
  saveVotes(votes)

  // Background API call to backend C# API
  if (typeof window !== 'undefined') {
    rankingService.createVoteRecord(newRecord).then((res: any) => {
      const createdData = res.data || res
      if (createdData) {
        const currentVotes = loadVotes()
        const foundIdx = currentVotes.findIndex(v => v.id === newRecord.id)
        if (foundIdx !== -1) {
          currentVotes[foundIdx].id = createdData.voteRecordId || createdData.id
          saveVotes(currentVotes)
        }
      }
    }).catch(err => {
      console.warn("Failed to create vote record on backend, using offline local storage fallback:", err)
    })
  }

  return newRecord
}

export function confirmVoteRecord(id: string): boolean {
  const votes = loadVotes()
  const idx = votes.findIndex(v => v.id === id)
  if (idx === -1) return false
  
  votes[idx].confirmed = true
  votes[idx].confirmedAt = new Date().toISOString()
  
  // Recalculate score on confirm just to be consistent
  const calculatedScore = calculateVoteScore(votes[idx].voteCount, votes[idx].readerCount)
  votes[idx].score = Math.round(calculatedScore * 100) / 100
  
  saveVotes(votes)

  // Background API call to backend C# API
  if (typeof window !== 'undefined') {
    rankingService.confirmVoteRecord(id).then((res: any) => {
      console.log("Confirmed vote record on backend successfully", res)
    }).catch(err => {
      console.warn("Failed to confirm vote record on backend:", err)
    })
  }

  return true
}

export function getRankingsForPeriod(period: string): RankingRow[] {
  const allVotes = loadVotes()
  const confirmed = allVotes.filter(v => v.confirmed && v.period === period)

  // Sort by score desc, then by voteCount desc
  const sorted = [...confirmed].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.voteCount - a.voteCount
  })

  const total = sorted.length
  const allScores = sorted.map(v => v.score)

  return sorted.map((v, index) => {
    const rank = index + 1
    let status: 'TOP 3' | 'BOTTOM 20% (BR-94)' | '—' = '—'

    if (rank <= 3) {
      status = 'TOP 3'
    } else if (total >= 5) {
      // BR-94: Bottom 20% calculations.
      // If total < 5, only generate report, do not flag.
      const bottomCount = Math.ceil((total * 20) / 100)
      if (rank > total - bottomCount) {
        status = 'BOTTOM 20% (BR-94)'
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
}

export async function syncRankingsFromBackend(period?: string): Promise<VoteRecord[]> {
  try {
    const res = await rankingService.getRankingSnapshots(period)
    const list = res.data || res || []
    
    if (Array.isArray(list)) {
      const localVotes = loadVotes()
      const merged = [...localVotes]
      
      list.forEach((br: any) => {
        const recordId = br.voteRecordId || br.id
        const score = br.voteScore || br.score || calculateVoteScore(br.voteCount, br.readerCount)
        
        const voteItem: VoteRecord = {
          id: recordId,
          seriesId: br.seriesId || '',
          seriesTitle: br.seriesTitle || br.title || '',
          genre: br.genre || '',
          chapterId: br.chapterId || '',
          chapterTitle: br.chapterTitle || '',
          period: br.period || '',
          readerCount: br.readerCount || 0,
          voteCount: br.voteCount || 0,
          score: Math.round(score * 100) / 100,
          confirmed: br.isConfirmed || br.confirmed || (br.status === 'Confirmed'),
          createdAt: br.createdAt || new Date().toISOString(),
          confirmedAt: br.confirmedAt || undefined
        }
        
        const idx = merged.findIndex(v => v.id === voteItem.id || (v.seriesId === voteItem.seriesId && v.period === voteItem.period))
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...voteItem }
        } else {
          merged.push(voteItem)
        }
      })
      
      saveVotes(merged)
      return period ? merged.filter(v => v.period === period) : merged
    }
  } catch (error) {
    console.warn("syncRankingsFromBackend failed, using offline data:", error)
  }
  return getVoteRecords()
}

