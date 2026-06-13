import { fetchAPI } from '@/services/api'
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
  chapterId: string   // chapterId from backend — needed to update chapter status on approve/reject
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

const SEED_MANUSCRIPTS: ManuscriptItem[] = []

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

  // Background API calls to backend C# Web API
  if (typeof window !== 'undefined') {
    if (newStatus === 'APPROVED') {
      if (id.startsWith('local-ms-')) {
        const payload = {
          chapterId: item.chapterId,
          fileUrl: `https://api.mangahub.vn/manuscripts/ch${item.chapterNumber}_final.zip`,
          notes: feedbackText || "Được duyệt và phát hành bởi Tantou Editor",
          status: 'Approved'
        }
        fetchAPI('/api/manuscripts', {
          method: 'POST',
          suppressGlobalError: true,
          body: JSON.stringify(payload)
        } as any)
          .then(res => console.log("Created approved manuscript on backend successfully", res))
          .catch(err => console.warn("Failed to create approved manuscript on backend:", err))
      } else {
        const payload = {
          status: 'Approved',
          feedback: feedbackText || 'Bản vẽ đã được phê duyệt.'
        }
        fetchAPI(`/api/manuscripts/${id}`, {
          method: 'PUT',
          suppressGlobalError: true,
          body: JSON.stringify(payload)
        } as any)
          .then(res => console.log("Approved manuscript on backend successfully", res))
          .catch(err => console.warn("Failed to approve manuscript on backend:", err))
      }
    } else if (newStatus === 'REVISION REQUIRED') {
      if (!id.startsWith('local-ms-')) {
        const payload = {
          status: 'Rejected',
          feedback: feedbackText || 'Cần sửa đổi bản vẽ.'
        }
        fetchAPI(`/api/manuscripts/${id}`, {
          method: 'PUT',
          suppressGlobalError: true,
          body: JSON.stringify(payload)
        } as any)
          .then(res => console.log("Requested manuscript revision on backend successfully", res))
          .catch(err => console.warn("Failed to request manuscript revision on backend:", err))
      }
    }
  }

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

  // Background API call to backend
  if (typeof window !== 'undefined') {
    const payload = {
      pageNo: 1, // Default page coordinate fallback
      positionX: 50.00,
      positionY: 50.00,
      content: text
    }

    fetchAPI<{ id: string; annotationId: string }>(`/api/manuscripts/${manuscriptId}/annotations`, {
      method: 'POST',
      suppressGlobalError: true,
      body: JSON.stringify(payload)
    } as any).then((res: any) => {
      const realId = res?.data?.annotationId || res?.data?.id || res?.annotationId || res?.id
      if (realId) {
        const currentAnns = loadAnnotations()
        const foundIdx = currentAnns.findIndex(a => a.id === newAnn.id)
        if (foundIdx !== -1) {
          currentAnns[foundIdx].id = realId
          saveAnnotations(currentAnns)
        }
      }
    }).catch(err => {
      console.warn("Failed to create annotation on backend:", err)
    })
  }

  return newAnn
}

// ---------- Async Backend Synchronizers ----------

const mapBackendManuscriptStatus = (status: string): 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED' => {
  if (!status) return 'SUBMITTED'
  const clean = status.trim().toUpperCase()
  if (clean === 'APPROVED') return 'APPROVED'
  if (clean === 'REJECTED' || clean === 'REVISION REQUIRED' || clean === 'REVISIONREQUIRED') return 'REVISION REQUIRED'
  return 'SUBMITTED'
}

export async function syncManuscriptsFromBackend(): Promise<ManuscriptItem[]> {
  try {
    // 1. Fetch all chapters and series in parallel for enrichment
    const [chaptersResponse, seriesResponse] = await Promise.all([
      fetchAPI<{ data: any[] } | any[]>('/api/chapters', { suppressGlobalError: true } as any),
      fetchAPI<{ data: any[] } | any[]>('/api/series', { suppressGlobalError: true } as any).catch(() => ({ data: [] }))
    ])
    const chapters = (chaptersResponse as any).data || chaptersResponse
    const seriesList = (seriesResponse as any).data || seriesResponse || []
    
    if (Array.isArray(chapters)) {
      // Build a lookup map: seriesId -> seriesTitle
      const seriesTitleMap: Record<string, string> = {}
      if (Array.isArray(seriesList)) {
        seriesList.forEach((s: any) => {
          const sid = s.seriesId || s.id
          seriesTitleMap[sid] = s.title || s.Title || 'Untitled Series'
        })
      }

      // 2. Fetch manuscripts AND page tasks for all chapters in parallel
      const dataPromises = chapters.map(async (chapter: any) => {
        const chapterId = chapter.chapterId || chapter.id
        const [manuscriptsRes, tasksRes] = await Promise.all([
          fetchAPI<{ data: any[] } | any[]>(`/api/chapters/${chapterId}/manuscripts`, { suppressGlobalError: true } as any).catch(() => ({ data: [] })),
          fetchAPI<{ data: any[] } | any[]>(`/api/chapters/${chapterId}/page-tasks`, { suppressGlobalError: true } as any).catch(() => ({ data: [] }))
        ])
        const mList = (manuscriptsRes as any).data || manuscriptsRes
        const tList = (tasksRes as any).data || tasksRes
        return {
          chapter,
          manuscripts: Array.isArray(mList) ? mList : [],
          pageTasks: Array.isArray(tList) ? tList : []
        }
      })
      
      const results = await Promise.all(dataPromises)
      
      const allManuscripts: ManuscriptItem[] = []

      results.forEach(({ chapter, manuscripts, pageTasks }) => {
        const chapterId = chapter.chapterId || chapter.id
        const seriesId = chapter.seriesId || ''
        const seriesTitle = seriesTitleMap[seriesId] || 'Sakura Knights'
        const chapterNo = chapter.chapterNo || chapter.number || 1
        const chapterTitle = chapter.title || 'Chương mới'

        // Option B: if chapter status is ReadyForEditor (or equivalent), treat as 100% complete.
        // Otherwise compute from backend pageTasks (enum 3 = Approved).
        const chapterStatusStr = String(chapter.status || '').toLowerCase().replace(/\s+/g, '')
        const isReadyForEditor = chapterStatusStr === 'readyforeditor' || chapterStatusStr === 'ready for editor'

        let realProgress: number
        if (isReadyForEditor) {
          realProgress = 100
        } else {
          const approvedPageSet = new Set<number>()
          pageTasks
            .filter((pt: any) => {
              const s = String(pt.status ?? '').toLowerCase()
              return s === 'approved' || s === '3' // enum 3 = Approved
            })
            .forEach((pt: any) => {
              const start = pt.pageStart || 1
              const end = pt.pageEnd || start
              for (let p = start; p <= end; p++) approvedPageSet.add(p)
            })
          const totalPages = chapter.totalPages || 20
          realProgress = Math.min(100, Math.round((approvedPageSet.size / totalPages) * 100))
        }

        if (manuscripts.length > 0) {
          // Map real backend manuscripts
          manuscripts.forEach((m: any) => {
            const historyList: ManuscriptVersion[] = (m.history || []).map((h: any) => ({
              version: h.versionLabel || `v${h.versionNo}`,
              status: mapBackendManuscriptStatus(h.status),
              submittedAt: h.submittedAt || new Date().toISOString(),
              reviewedAt: h.reviewedAt || undefined,
              feedback: h.revisionNotes || h.feedback || undefined,
              revisionNumber: h.revisionCount || undefined
            }))

            if (historyList.length === 0) {
              historyList.push({
                version: m.versionLabel || `v${m.versionNo || 1}`,
                status: mapBackendManuscriptStatus(m.status),
                submittedAt: m.submittedAt || new Date().toISOString(),
              })
            }

            allManuscripts.push({
              id: m.manuscriptId || m.id,
              chapterId,
              seriesId,
              seriesTitle,
              chapterNumber: chapterNo,
              chapterTitle,
              latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
              status: mapBackendManuscriptStatus(m.status),
              progress: realProgress,
              history: historyList,
              pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4']
            })
          })
        } else {
          // No manuscript on backend yet — skip. Do NOT create local placeholder.
          // The chapter will only appear in the Manuscripts tab once a real manuscript
          // has been submitted via the API.
        }
      })

      saveManuscripts(allManuscripts)
      return allManuscripts
    }
  } catch (error) {
    console.warn("syncManuscriptsFromBackend failed:", error)
  }
  // Return empty array instead of stale local data
  return []
}

export async function syncAnnotationsFromBackend(manuscriptId: string): Promise<Annotation[]> {
  try {
    const response = await fetchAPI<{ data: any[]; annotations: any[] } | any>(`/api/manuscripts/${manuscriptId}/annotations`, { suppressGlobalError: true } as any)
    const rawAnns = response.data || response.annotations || (Array.isArray(response) ? response : [])
    if (Array.isArray(rawAnns)) {
      const backendAnns: Annotation[] = rawAnns.map((a: any) => ({
        id: a.annotationId || a.id,
        manuscriptId: a.manuscriptId || manuscriptId,
        versionName: `v${a.versionNo || 1}`,
        text: a.content || a.text,
        createdAt: a.createdAt || new Date().toISOString()
      }))

      const localAnns = loadAnnotations()
      const filtered = localAnns.filter(la => la.manuscriptId !== manuscriptId)
      const merged = [...filtered, ...backendAnns]
      saveAnnotations(merged)
      return backendAnns
    }
  } catch (error) {
    console.warn("syncAnnotationsFromBackend failed, using offline data:", error)
  }
  return loadAnnotations().filter(a => a.manuscriptId === manuscriptId)
}
