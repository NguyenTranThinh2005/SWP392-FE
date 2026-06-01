export interface ManuscriptVersion {
  version: string
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED'
  submittedAt: string
  reviewedAt?: string
  revisionNumber?: number // for BR-83 display, e.g. 1 for v1, 2 for v2
  feedback?: string
}

export interface ManuscriptItem {
  id: string
  seriesId: string
  seriesTitle: string
  chapterNumber: number
  chapterTitle: string
  latestVersion: string
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED'
  progress: number // chapter drawing progress (e.g., 0 to 100) for BR-84 check
  history: ManuscriptVersion[]
  pages: string[] // mock page previews
}

export interface Annotation {
  id: string
  manuscriptId: string
  versionName: string
  text: string
  createdAt: string
}

const STORAGE_MANUSCRIPTS_KEY = 'mangaflow_manuscripts'
const STORAGE_ANNOTATIONS_KEY = 'mangaflow_annotations'

// Seed data matching the user's screenshots exactly
const SEED_MANUSCRIPTS: ManuscriptItem[] = [
  {
    id: 'M01',
    seriesId: 'S11',
    seriesTitle: 'Steel Horizon',
    chapterNumber: 15,
    chapterTitle: 'Iron Will',
    latestVersion: 'v1',
    status: 'APPROVED',
    progress: 100,
    history: [
      {
        version: 'v1',
        status: 'APPROVED',
        submittedAt: '2026-03-25T10:00:00Z',
        reviewedAt: '2026-03-26T14:30:00Z',
        feedback: 'Excellent line work and pacing. Ready for publishing!'
      }
    ],
    pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4']
  },
  {
    id: 'M02',
    seriesId: 'S12',
    seriesTitle: 'Blade of Eternity',
    chapterNumber: 22,
    chapterTitle: 'Shadows of the Past',
    latestVersion: 'v1',
    status: 'APPROVED',
    progress: 100,
    history: [
      {
        version: 'v1',
        status: 'APPROVED',
        submittedAt: '2026-04-05T09:00:00Z',
        reviewedAt: '2026-04-07T11:20:00Z',
        feedback: 'Perfect shading. The story beats flow beautifully.'
      }
    ],
    pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4']
  },
  {
    id: 'M03',
    seriesId: 'S16',
    seriesTitle: 'Crimson Protocol',
    chapterNumber: 9,
    chapterTitle: 'Final Hack',
    latestVersion: 'v1',
    status: 'SUBMITTED',
    progress: 0, // 0% triggers BR-84 warning: "Cannot approve — chapter completion is 0%, must be 100%"
    history: [
      {
        version: 'v1',
        status: 'SUBMITTED',
        submittedAt: '2026-02-12T14:00:00Z'
      }
    ],
    pages: ['Page 5', 'Page 6', 'Page 7', 'Page 8']
  },
  {
    id: 'M04',
    seriesId: 'S01',
    seriesTitle: 'Sakura Knights',
    chapterNumber: 3,
    chapterTitle: 'Resonance Force',
    latestVersion: 'v2',
    status: 'REVISION REQUIRED',
    progress: 80,
    history: [
      {
        version: 'v2',
        status: 'REVISION REQUIRED',
        submittedAt: '2026-03-24T08:00:00Z',
        reviewedAt: '2026-03-25T16:00:00Z',
        revisionNumber: 2,
        feedback: 'Background is better. Page 15 still needs work on the close-up panel.'
      },
      {
        version: 'v1',
        status: 'APPROVED',
        submittedAt: '2026-03-28T10:00:00Z',
        reviewedAt: '2026-03-30T13:40:00Z'
      },
      {
        version: 'v1',
        status: 'REVISION REQUIRED',
        submittedAt: '2026-03-20T09:00:00Z',
        reviewedAt: '2026-03-22T10:30:00Z',
        revisionNumber: 1,
        feedback: 'Please refine background grids on the dojo scene.'
      }
    ],
    pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4', 'Page 5']
  }
]

const SEED_ANNOTATIONS: Annotation[] = []

function loadManuscripts(): ManuscriptItem[] {
  if (typeof window === 'undefined') return SEED_MANUSCRIPTS
  try {
    const raw = localStorage.getItem(STORAGE_MANUSCRIPTS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_MANUSCRIPTS_KEY, JSON.stringify(SEED_MANUSCRIPTS))
      return SEED_MANUSCRIPTS
    }
    return JSON.parse(raw) as ManuscriptItem[]
  } catch {
    return SEED_MANUSCRIPTS
  }
}

function saveManuscripts(items: ManuscriptItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_MANUSCRIPTS_KEY, JSON.stringify(items))
}

function loadAnnotations(): Annotation[] {
  if (typeof window === 'undefined') return SEED_ANNOTATIONS
  try {
    const raw = localStorage.getItem(STORAGE_ANNOTATIONS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_ANNOTATIONS_KEY, JSON.stringify(SEED_ANNOTATIONS))
      return SEED_ANNOTATIONS
    }
    return JSON.parse(raw) as Annotation[]
  } catch {
    return SEED_ANNOTATIONS
  }
}

function saveAnnotations(anns: Annotation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_ANNOTATIONS_KEY, JSON.stringify(anns))
}

export function getManuscripts(): ManuscriptItem[] {
  return loadManuscripts()
}

export function getManuscriptById(id: string): ManuscriptItem | undefined {
  return loadManuscripts().find(m => m.id === id)
}

export function updateManuscriptStatus(
  id: string,
  newStatus: 'APPROVED' | 'REVISION REQUIRED',
  feedbackText: string
): boolean {
  const items = loadManuscripts()
  const idx = items.findIndex(m => m.id === id)
  if (idx === -1) return false

  const item = items[idx]
  item.status = newStatus

  // Update latest version details in history
  const activeVerIdx = item.history.findIndex(h => h.version === item.latestVersion && h.status === 'SUBMITTED')
  if (activeVerIdx !== -1) {
    item.history[activeVerIdx].status = newStatus
    item.history[activeVerIdx].reviewedAt = new Date().toISOString()
    item.history[activeVerIdx].feedback = feedbackText
    if (newStatus === 'REVISION REQUIRED') {
      // Calculate revision cycle (max 3 rounds in BR-83)
      const prevRevsCount = item.history.filter(h => h.status === 'REVISION REQUIRED').length
      item.history[activeVerIdx].revisionNumber = prevRevsCount + 1
    }
  } else {
    // Append to history if not existing
    item.history.unshift({
      version: item.latestVersion,
      status: newStatus,
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      feedback: feedbackText,
      revisionNumber: newStatus === 'REVISION REQUIRED' ? 1 : undefined
    })
  }

  saveManuscripts(items)
  return true
}

export function getAnnotations(manuscriptId: string, versionName: string): Annotation[] {
  return loadAnnotations().filter(a => a.manuscriptId === manuscriptId && a.versionName === versionName)
}

export function addAnnotation(manuscriptId: string, versionName: string, text: string): Annotation {
  const anns = loadAnnotations()
  const newAnn: Annotation = {
    id: `A${String(anns.length + 1).padStart(2, '0')}`,
    manuscriptId,
    versionName,
    text,
    createdAt: new Date().toISOString()
  }
  anns.push(newAnn)
  saveAnnotations(anns)
  return newAnn
}
