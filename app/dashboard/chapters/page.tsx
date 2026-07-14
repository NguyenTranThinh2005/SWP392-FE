'use client'

import { compareAny,extractImagesFromZip  } from '@/lib/imageCompare'
import { getSalaryByAssistant, formatVND } from '@/lib/salary'
import { useCallback, useEffect, useState } from 'react'
import { useRole } from '@/context/RoleContext'
import { SubmissionFeedbackView } from '@/components/annotations/submission-feedback-view'
import {
  ClipboardList,
  Plus,
  BookOpen,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Check,
  X,
  FileEdit,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Eye,
  FileText,
  Upload,
  PlusCircle,
  PencilLine,
  ScrollText,
  CalendarDays,
  Hash,
  AlertCircle,
  Info,
  Layers,
  Sparkles,
  Send
} from 'lucide-react'
import {
  TASK_TYPE_SUGGESTIONS,
  type Chapter,
  type Task,
  type Assistant,
  type Series,
  type ChapterStatus,
  type TaskStatus
} from '@/lib/chapters-store'
import { fetchAPI } from '@/services/api'
import { API_BASE_URL } from '@/lib/constants'
import { seriesService } from '@/services/seriesService'
import { chapterService } from '@/services/chapterService'
import { userService } from '@/services/userService'
import { calculateChapterDeadline, calculateChapterProgress } from '@/lib/business-logic'
import type { Annotation } from '@/types/manuscript'
import { ImageCommentLayer } from '@/components/annotations/image-comment-layer'

export default function ChaptersPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  const [mangakaId, setMangakaId] = useState('')
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('A01') // Sato Takashi by default (demo fallback)
  const [assistantTasks, setAssistantTasks] = useState<Task[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const myId = parsed?.id || parsed?.userId
        if (myId) {
          setMangakaId(myId)
          // Nếu role là Assistant, tự động gán selectedAssistantId bằng ID của chính mình
          const activeRole = parsed.role || localStorage.getItem('user-role') || role
          if (activeRole?.toLowerCase() === 'assistant') {
            setSelectedAssistantId(myId)
          }
        }
      } catch { }
    }
  }, [role])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // --- State for Mangaka Role ---
  const [mangakaSeries, setMangakaSeries] = useState<Series[]>([])
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterTasks, setChapterTasks] = useState<Task[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])

  // Modal control states
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [activeTaskToReview, setActiveTaskToReview] = useState<Task | null>(null)
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false)
  const [activeTaskToView, setActiveTaskToView] = useState<Task | null>(null)
const [subCompareLoading, setSubCompareLoading] = useState(false)
  const [subCompareResult, setSubCompareResult] = useState<{ percent: number; diff?: string } | null>(null)
  const [subCompareError, setSubCompareError] = useState('')

  const handleCompareSubmissions = async () => {
    const cur = activeTaskToReview?.submittedWorkUrl
    const prev = activeTaskToReview?.prevSubmittedWorkUrl
    if (!cur || !prev) { setSubCompareError('Needs at least 2 submissions to compare.'); setSubCompareResult(null); return }
    setSubCompareError(''); setSubCompareLoading(true); setSubCompareResult(null)
    try {
      const r = await compareAny(prev, cur)
      setSubCompareResult({ percent: r.diffPercent, diff: r.diffDataUrl })
    } catch (e: any) {
      setSubCompareError('Comparison error: ' + (e?.message || 'cannot read file'))
    } finally { setSubCompareLoading(false) }
  }
  // Form states for creating chapter (Matching SubmitChapterPage.jsx)
  const [newChapterSeriesId, setNewChapterSeriesId] = useState('')
  const [newChapterNo, setNewChapterNo] = useState<string>('')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newChapterPages, setNewChapterPages] = useState<number>(24)
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false)
  const [editChapterId, setEditChapterId] = useState<string>('')
  const [editChapterTitle, setEditChapterTitle] = useState('')
  const [editChapterPages, setEditChapterPages] = useState<number>(0)
  const [editChapterPubDate, setEditChapterPubDate] = useState('')
  const [editChapterDeadline, setEditChapterDeadline] = useState('')
  const [newChapterPubDate, setNewChapterPubDate] = useState('')
  const [newChapterSynopsis, setNewChapterSynopsis] = useState('')
  const [newChapterNotes, setNewChapterNotes] = useState('')
  const [newChapterStoryboardFiles, setNewChapterStoryboardFiles] = useState<any[]>([])
  const [newChapterManuscriptFiles, setNewChapterManuscriptFiles] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form states for creating task
  const [newTaskType, setNewTaskType] = useState<string>('')
  const [newTaskPageStart, setNewTaskPageStart] = useState<number>(1)
  const [newTaskPageEnd, setNewTaskPageEnd] = useState<number>(3)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskAssistantId, setNewTaskAssistantId] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('')
  const [newTaskRate, setNewTaskRate] = useState<number>(0)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string>('')
  const [editTaskPageStart, setEditTaskPageStart] = useState<number>(1)
  const [editTaskPageEnd, setEditTaskPageEnd] = useState<number>(1)
  const [editTaskDescription, setEditTaskDescription] = useState<string>('')
  const [editTaskDueDate, setEditTaskDueDate] = useState<string>('')
  const [editTaskAssistantId, setEditTaskAssistantId] = useState('')
  const [editTaskOriginalAssistantId, setEditTaskOriginalAssistantId] = useState('')
  const [editTaskRate, setEditTaskRate] = useState<number>(0)
  const [isSubmitManuscriptOpen, setIsSubmitManuscriptOpen] = useState(false)
  const [submitManuscriptFile, setSubmitManuscriptFile] = useState<File | null>(null)
  const [submitManuscriptNotes, setSubmitManuscriptNotes] = useState<string>('')
  const [submitManuscriptUploading, setSubmitManuscriptUploading] = useState(false)
  const [newTaskAttachments, setNewTaskAttachments] = useState<any[]>([])

  // Review states (Approve / Reject)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [taskAnnotations, setTaskAnnotations] = useState<Annotation[]>([])

  const getTaskPageNo = (task: Task | null | undefined, pageIndex = 0) => {
    const start = task?.pageStart || 1
    return start + pageIndex
  }

  const getTaskAnnotationEndpoint = useCallback((task: Task) => {
    return task.submissionId ? '/api/submissions/' + task.submissionId + '/annotations' : null
  }, [])

  useEffect(() => {
    const activeTask = activeTaskToReview || activeTaskToView

    if (!activeTask?.id) {
      setTaskAnnotations([])
      return
    }

    const endpoint = getTaskAnnotationEndpoint(activeTask)
    if (!endpoint) {
      setTaskAnnotations([])
      return
    }

    let cancelled = false
    fetchAPI<any>(endpoint)
      .then((response) => {
        if (cancelled) return
        const raw = response.data || response.annotations || (Array.isArray(response) ? response : [])
        if (!Array.isArray(raw)) {
          setTaskAnnotations([])
          return
        }

        const anns: Annotation[] = raw.map((a: any) => ({
          id: a.annotationId || a.id,
          manuscriptId: a.manuscriptId || '',
          versionName: a.versionName || (a.versionNo ? `v${a.versionNo}` : undefined),
          pageNo: a.pageNo || 1,
          positionX: Number(a.positionX ?? 0),
          positionY: Number(a.positionY ?? 0),
          text: a.content || a.text || '',
          authorName: a.authorName,
          createdAt: a.createdAt || new Date().toISOString()
        }))

        setTaskAnnotations(anns)
      })
      .catch(() => {
        if (!cancelled) setTaskAnnotations([])
      })

    return () => {
      cancelled = true
    }
  }, [activeTaskToReview, activeTaskToView, getTaskAnnotationEndpoint])

  const handleAddTaskAnnotation = async (
    pageNo: number,
    x: number,
    y: number,
    text: string
  ) => {
    const activeTask = activeTaskToReview || activeTaskToView
    const activeId = activeTask?.id

    if (!activeTask) {
      showToast('Khong tim thay task dang review, khong the luu annotation.', 'error')
      return
    }

    const endpoint = getTaskAnnotationEndpoint(activeTask)

    if (!activeId || !endpoint) {
      showToast('Khong tim thay submission cua task nay, khong the luu annotation vao database.', 'error')
      return
    }

    try {
      const response = await fetchAPI<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          pageNo,
          positionX: x,
          positionY: y,
          content: text
        })
      })
      const data = response.data || response
      const newAnn: Annotation = {
        id: data.annotationId || data.id,
        manuscriptId: data.manuscriptId || '',
        pageNo: data.pageNo || pageNo,
        positionX: Number(data.positionX ?? x),
        positionY: Number(data.positionY ?? y),
        text: data.content || text,
        authorName: data.authorName || (role === 'Mangaka' ? 'Mangaka' : 'Assistant'),
        createdAt: data.createdAt || new Date().toISOString()
      }

      setTaskAnnotations(prev => [...prev, newAnn])
      showToast('Da them ghi chu tren anh!')
    } catch (error: any) {
      showToast(error?.message || 'Khong the luu annotation vao database.', 'error')
    }
  }

  const [imagePins, setImagePins] = useState<{ x: number; y: number; note: string; page: number }[]>([])
  const [zipPages, setZipPages] = useState<{ name: string; dataUrl: string }[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [zipLoading, setZipLoading] = useState(false)
  const [pinOverlayOpen, setPinOverlayOpen] = useState(false)
  const openPinOverlay = async () => {
    const url = activeTaskToReview?.submittedWorkUrl
    if (!url) return
    setCurrentPage(0)
    setPinOverlayOpen(true)
    if (/\.zip(\?|$)/i.test(url)) {
      setZipLoading(true)
      try {
        const imgs = await extractImagesFromZip(url)
        setZipPages(imgs.length ? imgs : [])
      } catch {
        setZipPages([])
      } finally {
        setZipLoading(false)
      }
    } else {
      setZipPages([{ name: 'image', dataUrl: url }])
    }
  }
  // --- State for Assistant Role ---
  const [isSubmitWorkModalOpen, setIsSubmitWorkModalOpen] = useState(false)
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState<Task | null>(null)
  const [submitWorkUrl, setSubmitWorkUrl] = useState('')
  const [submitWorkFile, setSubmitWorkFile] = useState<File | null>(null)
  const [submitFiles, setSubmitFiles] = useState<File[]>([])
  const MAX_SUBMISSIONS = 3
  const [submitWorkUploading, setSubmitWorkUploading] = useState(false)
  const [submitComment, setSubmitComment] = useState('')

  // Trigger Toast Notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load Initial Data
  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [role, selectedSeriesId, selectedChapterId, selectedAssistantId, mangakaId])

  useEffect(() => {
    if (!activeTaskToView) return

    let cancelled = false
    const url = activeTaskToView.submittedWorkUrl
    setCurrentPage(0)
    if (url) {
      if (/\.zip(\?|$)/i.test(url)) {
        setZipLoading(true)
        setZipPages([])
        extractImagesFromZip(url)
          .then((imgs) => {
            if (cancelled) return
            setZipPages(imgs.length ? imgs : [])
          })
          .catch(() => {
            if (cancelled) return
            setZipPages([])
          })
          .finally(() => {
            if (!cancelled) setZipLoading(false)
          })
      } else {
        setZipPages([{ name: 'image', dataUrl: url }])
      }
    } else {
      setZipPages([])
    }

    return () => {
      cancelled = true
    }
  }, [activeTaskToView])

  const getSubmissionStatus = (submission: any) => String(submission?.status).trim().toUpperCase()

  const getLatestSubmission = (submissions?: any[]) => {
    if (!Array.isArray(submissions) || submissions.length === 0) return null

    const sorted = [...submissions].sort((a, b) => {
      const bVersion = Number(b?.versionNo ?? b?.VersionNo ?? 0)
      const aVersion = Number(a?.versionNo ?? a?.VersionNo ?? 0)
      if (bVersion !== aVersion) return bVersion - aVersion

      const bSubmittedAt = new Date(b?.submittedAt ?? b?.SubmittedAt ?? 0).getTime()
      const aSubmittedAt = new Date(a?.submittedAt ?? a?.SubmittedAt ?? 0).getTime()
      return bSubmittedAt - aSubmittedAt
    })

    return sorted.find(s => {
      const status = getSubmissionStatus(s)
      return status === '0' || status === 'SUBMITTED'
    }) || sorted[0]
  }

  const getSubmissionFileUrl = (submission: any) => {
    const directUrl = submission?.submittedFileAssetUrl || submission?.publicUrl || submission?.PublicUrl
    if (directUrl) return directUrl

    const fileAssetId = submission?.submittedFileAssetId || submission?.SubmittedFileAssetId
    return fileAssetId ? `${API_BASE_URL}/api/files/${fileAssetId}` : undefined
  }

  const mapBackendTaskStatus = (status: any, submissions?: any[]): TaskStatus => {
    const statusStr = String(status).trim().toUpperCase();
    const latestSubmission = getLatestSubmission(submissions);
    const latestSubStatus = getSubmissionStatus(latestSubmission);

    if (statusStr === '3' || statusStr === 'APPROVED') {
      return 'Approved';
    }
    if (statusStr === '2' || statusStr === 'COMPLETED') {
      return 'Submitted';
    }
    if (statusStr === '1' || statusStr === 'INPROGRESS' || statusStr === 'IN-PROGRESS') {
      if (latestSubStatus === '2' || latestSubStatus === 'REJECTED') {
        return 'Rejected';
      }
      return 'In-Progress';
    }
    if (statusStr === '0' || statusStr === 'ASSIGNED') {
      return 'Pending';
    }
    return 'Pending';
  }

  const fetchTasks = async (chapterId?: string): Promise<Task[]> => {
    try {
      const activeRole = localStorage.getItem('user-role') || role
      let endpoint = '/api/page-tasks/mangaka'
      if (activeRole === 'Assistant') {
        endpoint = '/api/page-tasks/assistant'
      }
      const response = await fetchAPI<{ data: any[] }>(endpoint)
      const data = response.data || response || []

      if (Array.isArray(data)) {
        const mapped = data.map((t: any) => {
          const latestSub = getLatestSubmission(t.submissions);
          const sortedSubs = (t.submissions || []).slice().sort((a: any, b: any) => {
            const da = new Date(a.submittedAt || a.createdAt || a.submittedDate || 0).getTime()
            const db = new Date(b.submittedAt || b.createdAt || b.submittedDate || 0).getTime()
            return da - db // cu -> moi
          })
          const prevSub = sortedSubs.length >= 2 ? sortedSubs[sortedSubs.length - 2] : null;

          let uiStatus = mapBackendTaskStatus(t.status, t.submissions)
          const taskId = t.pageTaskId || t.id
          if (uiStatus === 'Pending' && typeof window !== 'undefined') {
            try {
              const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
              if (started.includes(taskId)) {
                uiStatus = 'In-Progress'
              }
            } catch {}
          }

          return {
            id: taskId,
            chapterId: t.chapterId,
            type: t.taskType,
            pages: `${t.pageStart}-${t.pageEnd}`,
            description: t.description || '',
            assistantId: t.assistantId,
            assistantName: t.assistantName,
            status: uiStatus,
            dueDate: t.dueDate || undefined,
            pageStart: t.pageStart,
            pageEnd: t.pageEnd,
ratePerPage: t.ratePerPage ?? 0,
            submittedWorkUrl: getSubmissionFileUrl(latestSub),
            prevSubmittedWorkUrl: getSubmissionFileUrl(prevSub),
            submittedFileAssetId: latestSub?.submittedFileAssetId || latestSub?.SubmittedFileAssetId || undefined,
            submitDescription: latestSub?.note || undefined,
            submissionId: latestSub?.submissionId || latestSub?.id || undefined,
            feedback: latestSub?.feedback || undefined,
            createdAt: t.createdAt || '',
            referenceFiles: t.taskReferences || t.referenceFiles || [],
            submissionCount: t.submissions?.length || 0
          }
        })
        return chapterId ? mapped.filter(t => t.chapterId === chapterId) : mapped
      }
    } catch (error) {
      console.warn("fetchTasks failed:", error)
    }
    return []
  }

  const refreshData = async (preferredChapterId?: string) => {
    try {
      // 1. Fetch series and filter by active and mangaka ownership
      const allProposals = await seriesService.listSeries()
      const mappedProposals: Series[] = allProposals.map(p => ({
        id: p.id,
        title: p.title,
        mangakaId: p.mangakaId || '',
        coverColor: p.coverColor || 'from-emerald-400 to-teal-500',
        status: p.status
      }))
      setAllSeries(mappedProposals)

      const allChaps = await chapterService.listChapters()
      setAllChapters(allChaps)

      const activeSeries = mappedProposals.filter(p => p.status === 'Active' && p.mangakaId === mangakaId)
      setMangakaSeries(activeSeries)

      let currentSeriesId = selectedSeriesId
      if (!currentSeriesId && activeSeries.length > 0) {
        currentSeriesId = activeSeries[0].id
        setSelectedSeriesId(currentSeriesId)
      }

      // 2. Load Chapters for series
      if (currentSeriesId) {
        const chapterList = await chapterService.getChaptersBySeries(currentSeriesId)
        setChapters(chapterList)

        let currentChapterId = preferredChapterId || selectedChapterId
        if (!currentChapterId && chapterList.length > 0) {
          currentChapterId = chapterList[0].id
          setSelectedChapterId(currentChapterId)
        }

        if (currentChapterId) {
          const chap = chapterList.find(c => c.id === currentChapterId)
          setSelectedChapter(chap || null)

          // Load tasks from backend
          const backendTasks = await fetchTasks(currentChapterId)
          setChapterTasks(
            [...backendTasks].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          )
        } else {
          setSelectedChapter(null)
          setChapterTasks([])
        }
      } else {
        setChapters([])
        setSelectedChapter(null)
        setChapterTasks([])
      }

     // 3. Load Assistant list from backend (bọc try/catch: Assistant bị 403, không được kéo sập refreshData)
      let assistantsList: any[] = []
      try {
        const usersRes = await userService.getAssistants()
        assistantsList = (usersRes.data || []).filter((u: any) => u.roleName?.toLowerCase() === 'assistant')
      } catch (e) {
        console.warn('Khong lay duoc danh sach assistant (co the do role Assistant):', e)
      }

      // Load all tasks to calculate active tasks per assistant
      const allTasksList = await fetchTasks()
      setAllTasks(allTasksList)
      const mappedAssistants = assistantsList.map(u => {
        const activeTasks = allTasksList.filter(
          t => t.assistantId === u.userId &&
            (t.status === 'Pending' || t.status === 'In-Progress' || t.status === 'Submitted' || t.status === 'Rejected')
        ).length
        return {
          id: u.userId,
          name: u.displayName || u.userName,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          specialty: 'Assistant',
          activeTasks
        }
      })
      setAssistants(mappedAssistants)

      // 4. Load tasks for assistant role
      if (role === 'Assistant' && selectedAssistantId) {
        const assTasks = allTasksList.filter(t => t.assistantId === selectedAssistantId)
        setAssistantTasks(
          [...assTasks].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        )
      }
    } catch (error) {
      console.error("refreshData failed:", error)
    }
  }

  if (!mounted) return null

  // --- Action Handlers for Mangaka ---

  // 1. Helper kiểm tra ngày xuất bản
  const validatePublicationDate = (pubDate: string, createdDate = new Date()) => {
    const pub = new Date(pubDate)
    const created = new Date(createdDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (pub <= today) return 'Expected publication date must be in the future'

    const deadline = new Date(pub)
    deadline.setDate(deadline.getDate() - 14) // Submission deadline is 14 days before publication

    const minDeadline = new Date(created)
    minDeadline.setDate(minDeadline.getDate() + 3) // Assistant/Mangaka must have at least 3 working days

    if (deadline < minDeadline) {
      return 'Publication date must be at least 17 days from current date (due to manuscript deadline being 14 days before publication + minimum 3 working days)'
    }
    return null
  }

  // Helper kiểm tra quyền tạo Chapter
  const canCreateChapter = (userId: string, series: Series) => {
    return series.mangakaId === userId && series.status === 'Active'
  }

  // Delete file giả lập
  const removeFile = (field: 'storyboardFiles' | 'manuscriptFiles', index: number) => {
    if (field === 'storyboardFiles') {
      setNewChapterStoryboardFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setNewChapterManuscriptFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  const removeTaskAttachment = (index: number) => {
    setNewTaskAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Tra cứu Tên Manga (Series Title) dựa vào task.chapterId và series.id
  const getMangaTitleForTask = (task: Task) => {
    const chapter = allChapters.find(c => c.id === task.chapterId)
    if (!chapter) return 'Unknown Manga'
    const series = allSeries.find(s => s.id === chapter.seriesId)
    return series ? series.title : 'Unknown Manga'
  }

  // Lấy thông tin số chương và tiêu đề chương tương ứng với task.chapterId
  const getChapterInfoForTask = (task: Task) => {
    const chapter = allChapters.find(c => c.id === task.chapterId)
    if (!chapter) return ''
    return `Ch. ${chapter.number}: ${chapter.title}`
  }

  const getChapterInfo = (chapterId: string) => {
    const chapter = allChapters.find(c => c.id === chapterId)
    if (!chapter) return `Ref: ${chapterId}`
    const series = allSeries.find(s => s.id === chapter.seriesId)
    const seriesTitle = series ? series.title : 'Manga'
    return `${seriesTitle} - Ch. ${chapter.number || (chapter as any).chapterNo || 1}: ${chapter.title}`
  }
  const openEditChapter = () => {
    const chap = chapters.find(c => c.id === selectedChapterId) as any
    if (!chap) {
      showToast('No chapter selected to edit!', 'error')
      return
    }
    setEditChapterId(chap.id)
    setEditChapterTitle(chap.title || '')
    setEditChapterPages(chap.totalPages ?? chap.pages ?? 0)
    setEditChapterPubDate((chap.publicationDate || '').slice(0, 10))
    setEditChapterDeadline((chap.deadline || '').slice(0, 10))
    setIsEditChapterOpen(true)
  }

  const handleSaveEditChapter = async () => {
    if (!editChapterTitle.trim()) {
      showToast('Title cannot be empty!', 'error')
      return
    }
    try {
      await chapterService.updateChapter(editChapterId, {
        title: editChapterTitle.trim(),
        totalPages: editChapterPages,
        publicationDate: editChapterPubDate || undefined,
        deadline: editChapterDeadline || undefined
      })
      showToast('Chapter updated!', 'success')
      setIsEditChapterOpen(false)
      refreshData()
    } catch {
      showToast('Failed to update.', 'error')
    }
  }
  // 1. Tạo Chapter mới
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!newChapterSeriesId) errs.seriesId = 'Please select a series'
    if (!newChapterNo) errs.chapterNo = 'Please enter chapter number'
    if (!newChapterTitle.trim()) errs.title = 'Please enter chapter title'
    if (!newChapterPubDate) {
      errs.publicationDate = 'Please select expected publication date'
    } else {
      const dateError = validatePublicationDate(newChapterPubDate)
      if (dateError) errs.publicationDate = dateError
    }

    if (newChapterManuscriptFiles.length === 0) {
      errs.manuscriptFiles = 'Must attach at least 1 rough manuscript file'
    }

    // Eligibility check
    const selectedSeries = mangakaSeries.find(s => s.id === newChapterSeriesId)
    if (selectedSeries && !canCreateChapter(mangakaId, selectedSeries)) {
      errs.seriesId = 'Only the Mangaka owner of an Active series can create a chapter'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      showToast('Please check the information again.', 'error')
      return
    }

    // Calculate deadline: publicationDate - 14 days
    const pubDateObj = new Date(newChapterPubDate)
    pubDateObj.setDate(pubDateObj.getDate() - 14)
    const deadlineString = pubDateObj.toISOString().split('T')[0]

    chapterService.createChapter({
      seriesId: newChapterSeriesId,
      number: parseInt(newChapterNo) || 0,
      title: newChapterTitle,
      totalPages: newChapterPages,
      publicationDate: newChapterPubDate,
      deadline: deadlineString
    }).then(async (res: any) => {
      const created = res.data || res
      const newChapterId = created.chapterId || created.id
      const realFiles = [...newChapterManuscriptFiles, ...newChapterStoryboardFiles].filter((f: any) => f instanceof File)
      if (newChapterId && realFiles.length > 0) {
        const formData = new FormData()
        formData.append('category', 'ChapterReference')
        realFiles.forEach((f: File) => formData.append('files', f))
        const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', { method: 'POST', body: formData })
        const fileAssetIds = uploadRes.data.files.map(f => f.fileAssetId)
        if (fileAssetIds.length > 0) {
          await fetchAPI(`/api/chapters/${newChapterId}/reference-files`, { method: 'POST', body: JSON.stringify({ fileAssetIds }) })
        }
      }
      showToast(`Đã tạo thành công Chapter ${created.chapterNo || created.number || newChapterNo}: ${created.title || newChapterTitle}!`)
      setIsChapterModalOpen(false)

      // Reset form states
      setNewChapterSeriesId(selectedSeriesId)
      setNewChapterNo('')
      setNewChapterTitle('')
      setNewChapterPages(24)
      setNewChapterPubDate('')
      setNewChapterSynopsis('')
      setNewChapterNotes('')
      setNewChapterStoryboardFiles([])
      setNewChapterManuscriptFiles([])
      setErrors({})

      setSelectedChapterId(created.chapterId || created.id)
      refreshData(created.chapterId || created.id)
    }).catch((err: any) => {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('already exists') || msg.includes('409')) {
        showToast('This chapter number already exists in the series. Please choose another.', 'error')
      } else {
        showToast(msg || 'Failed to create chapter.', 'error')
      }
    })
  }
  const openEditTask = (task: Task) => {
    setEditTaskId(task.id)
    setEditTaskPageStart(task.pageStart || 1)
    setEditTaskPageEnd(task.pageEnd || 1)
    setEditTaskDescription(task.description || '')
    setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    setEditTaskAssistantId(task.assistantId || '')
    setEditTaskOriginalAssistantId(task.assistantId || '')
    setEditTaskRate(task.ratePerPage || 0)
    setIsEditTaskOpen(true)
  }

  const handleSaveEditTask = async () => {
    if (editTaskPageStart > editTaskPageEnd) {
      showToast('Start page must be less than or equal to end page.', 'error')
      return
    }
    try {
     // Neu chi doi assistant -> chi gui assistantId (tranh BE chan "khong sua duoc khi da co submission")
      const onlyChangeAssistant = editTaskAssistantId && editTaskAssistantId !== editTaskOriginalAssistantId
      const body = onlyChangeAssistant
        ? { assistantId: editTaskAssistantId }
        : {
            pageStart: editTaskPageStart,
            pageEnd: editTaskPageEnd,
            description: editTaskDescription,
            dueDate: editTaskDueDate || null,
            ratePerPage: editTaskRate,
            assistantId: editTaskAssistantId || undefined,
          }
      await fetchAPI(`/api/page-tasks/${editTaskId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
      showToast(onlyChangeAssistant ? 'Reassigned task to the new assistant. Previous submissions have been deleted.' : 'Task updated!')
      setIsEditTaskOpen(false)
      refreshData()
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('overlap') || msg.includes('409')) {
        showToast('This page range has been assigned to another task. Please choose a different range.', 'error')
      } else {
        showToast(msg || 'Failed to update task.', 'error')
      }
    }
  }
  const handleSubmitManuscript = async () => {
    if (!submitManuscriptFile) {
      showToast('Please select a manuscript file.', 'error')
      return
    }
    try {
      setSubmitManuscriptUploading(true)
      const formData = new FormData()
      formData.append('category', 'Generic')
      formData.append('files', submitManuscriptFile)
      const uploadRes = await fetchAPI<{ data: { files: { publicUrl?: string }[] } }>('/api/files', { method: 'POST', body: formData })
      const fileUrl = uploadRes?.data?.files?.[0]?.publicUrl
      if (!fileUrl) { showToast('File upload failed.', 'error'); return }
      await fetchAPI('/api/manuscripts', {
        method: 'POST',
        body: JSON.stringify({ chapterId: selectedChapterId, fileUrl, notes: submitManuscriptNotes })
      })
      showToast('Manuscript sent to Editor (new version created)!')
      setIsSubmitManuscriptOpen(false)
      setSubmitManuscriptFile(null)
      setSubmitManuscriptNotes('')
      refreshData()
    } catch (err: any) {
      const msg = err?.message || ''
      showToast(msg || 'Failed to send (some tasks might not be approved).', 'error')
    } finally {
      setSubmitManuscriptUploading(false)
    }
  }
  // 2. Tạo Task & Giao việc cho Assistant
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()

    if (newTaskPageStart > newTaskPageEnd) {
      showToast('Start page cannot be greater than end page!', 'error')
      return
    }
    if (!newTaskDesc.trim()) {
      showToast('Please enter task description!', 'error')
      return
    }
    if (!newTaskAssistantId) {
      showToast('Please select an assistant to assign the task!', 'error')
      return
    }

const payload = {
        chapterId: selectedChapterId,
        assistantId: newTaskAssistantId,
        pageStart: newTaskPageStart,
        pageEnd: newTaskPageEnd,
        taskType: newTaskType.trim(),
        ratePerPage: newTaskRate,
        description: newTaskDesc,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null
      }

      return fetchAPI('/api/page-tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
    }).then(async (taskRes: any) => {
      const created = (taskRes as any)?.data || taskRes
      const newTaskId = created?.pageTaskId || created?.id
      const realFiles = newTaskAttachments.filter((f: any) => f instanceof File)
      if (newTaskId && realFiles.length > 0) {
        const formData = new FormData()
        formData.append('category', 'TaskReference')
        realFiles.forEach((f: File) => formData.append('files', f))
        const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', { method: 'POST', body: formData })
        const fileAssetIds = uploadRes.data.files.map(f => f.fileAssetId)
        if (fileAssetIds.length > 0) {
          await fetchAPI(`/api/page-tasks/${newTaskId}/reference-files`, { method: 'POST', body: JSON.stringify({ fileAssetIds }) })
        }
      }
      showToast(`Task created and assigned successfully!`)
      setNewTaskAttachments([])
      setNewTaskRate(0)
      setIsTaskModalOpen(false)
      setNewTaskDesc('')
      setNewTaskType('Line Art')
      setNewTaskPageStart(1)
      setNewTaskPageEnd(3)
      setNewTaskDueDate('')
      setNewTaskAttachments([])

      refreshData()
    }).catch((err: any) => {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('overlap') || msg.includes('409')) {
        showToast('This page range has been assigned to another task. Please choose a different range.', 'error')
      } else {
        showToast(msg || 'Failed to assign task.', 'error')
      }
    })
  }

  // 3. Duyệt Task của Assistant (Approve)
  const handleApproveTask = (task: Task) => {
    if (!task.submissionId) {
      showToast('No submission found to approve.', 'error')
      return
    }
    fetchAPI(`/api/page-tasks/submissions/${task.submissionId}/approve`, {
      method: 'POST'
    }).then(() => {
      showToast(`Approved the work of ${task.assistantName}!`)
      setIsReviewModalOpen(false)
      setActiveTaskToReview(null)
      setReviewFeedback('')
      refreshData()
    }).catch((err: any) => {
      showToast(err.message || 'Failed to approve submission.', 'error')
    })
  }

  // 4. Từ chối Task của Assistant (Reject)
  const handleRejectTask = (task: Task) => {
    if (!task.submissionId) {
      showToast('No submission found to reject.', 'error')
      return
    }
    const pinNotes = imagePins
      .filter(p => p.note.trim())
      .map((p, i) => `${i + 1}. (Page ${p.page + 1}) ${p.note.trim()}`)
      .join(' | ')
    const fullFeedback = [reviewFeedback.trim(), pinNotes ? `[Feedback on Image] ${pinNotes}` : '']
      .filter(Boolean).join(' — ')
    if (!fullFeedback.trim()) {
      showToast('Please provide feedback or image comments!', 'error')
      return
    }
    fetchAPI(`/api/page-tasks/submissions/${task.submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ feedback: fullFeedback })
    }).then(async () => {
      // Luu tung pin vao BE (annotation tren submission) de assistant xem lai truc quan
      const pinsToSave = imagePins.filter(p => p.note.trim())
      for (const p of pinsToSave) {
        try {
          await fetchAPI(`/api/submissions/${task.submissionId}/annotations`, {
            method: 'POST',
            body: JSON.stringify({
              pageNo: p.page + 1,
              positionX: Math.min(1, Math.max(0, p.x / 100)),
              positionY: Math.min(1, Math.max(0, p.y / 100)),
              content: p.note.trim(),
            })
          })
        } catch (e) {
          console.warn('Khong luu duoc pin:', e)
        }
      }
      showToast(`Rejected and sent feedback requesting revisions!`, 'error')
      setIsReviewModalOpen(false)
      setActiveTaskToReview(null)
      setReviewFeedback('')
      setImagePins([])
      setZipPages([])
      setCurrentPage(0)
      refreshData()
    }).catch((err: any) => {
      showToast(err.message || 'Failed to reject submission.', 'error')
    })
  }
  const handleStartTask = (taskId: string) => {
    showToast('Work started! Status updated to In-Progress.', 'success')
    try {
      const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
      if (!started.includes(taskId)) {
        started.push(taskId)
        localStorage.setItem('started_tasks', JSON.stringify(started))
      }
    } catch { }
    refreshData()
  }


  // 2. Submit Work
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTaskToSubmit) return
    if (submitFiles.length === 0) {
      showToast('Please select a file to submit.', 'error')
      return
    }
    try {
      setSubmitWorkUploading(true)
      // Luon gop thanh 1 zip (ke ca 1 file) -> dinh dang submission nhat quan -> luon so sanh duoc
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      submitFiles.forEach((f) => zip.file(f.name, f))
      const blob = await zip.generateAsync({ type: 'blob' })
      const fileToUpload = new File([blob], `bai_nop_${Date.now()}.zip`, { type: 'application/zip' })

      const formData = new FormData()
      formData.append('category', 'TaskSubmission')
      formData.append('files', fileToUpload)

      const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', {
        method: 'POST',
        body: formData
      })
      const fileAssetId = uploadRes.data.files[0].fileAssetId

      await fetchAPI(`/api/page-tasks/${activeTaskToSubmit.id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          submittedFileAssetId: fileAssetId,
          note: submitComment || 'Work completed, sent for Mangaka review.'
        })
      })
      showToast('Work submitted successfully! Awaiting Mangaka approval.')
      setIsSubmitWorkModalOpen(false)
      setActiveTaskToSubmit(null)
      setSubmitFiles([])
      setSubmitComment('')
      refreshData()
    } catch (err: any) {
      showToast(err.message || 'Failed to submit work.', 'error')
    } finally {
      setSubmitWorkUploading(false)
    }
  }
  // Helper styles for badges
  const getChapterStatusClass = (status: ChapterStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30'
      case 'Ready for Editor': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30'
      case 'Published': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30'
    }
  }

  const getChapterStatusLabel = (status: ChapterStatus) => {
    switch (status) {
      case 'Draft': return 'Draft'
      case 'In Progress': return 'In Progress'
      case 'Ready for Editor': return 'Ready for Editor'
      case 'Published': return 'Published'
    }
  }

  const getTaskStatusClass = (status: TaskStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-500'
      case 'In-Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400'
      case 'Submitted': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/10 dark:text-indigo-400'
      case 'Approved': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400'
      case 'Rejected': return 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'
    }
  }

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'Pending': return 'Awaiting Task'
      case 'In-Progress': return 'In Progress'
      case 'Submitted': return 'Submitted'
      case 'Approved': return 'Approved'
      case 'Rejected': return 'Revision Required'
    }
  }

  const getTaskStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Awaiting Start</span>
      case 'In-Progress':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Play className="w-3.5 h-3.5 animate-pulse" /> In Progress</span>
      case 'Submitted':
        return <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowRight className="w-3.5 h-3.5" /> Submitted</span>
      case 'Approved':
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>
      case 'Rejected':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><X className="w-3.5 h-3.5" /> Revision Required</span>
      default:
        return <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>
    }
  }

  // Tính phần trăm tiến độ của chapter hiện tại
  // Task "outdated" = quá hạn mà chưa Approved/Submitted → coi như bỏ, không tính vào tiến độ
  const isOutdatedTask = (t: Task) =>
    !!t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Approved' && t.status !== 'Submitted'
  const countableTasks = chapterTasks.filter(t => !isOutdatedTask(t))
  const salaryByAssistant = getSalaryByAssistant(chapterTasks)
  const totalTasksOfChapter = countableTasks.length
  const approvedTasksOfChapter = countableTasks.filter(t => t.status === 'Approved').length
  const progressPercent = totalTasksOfChapter > 0
    ? Math.round((approvedTasksOfChapter / totalTasksOfChapter) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
          : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400'
          }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-2xl p-6 sm:p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <ClipboardList className="w-3.5 h-3.5" /> Workflow Board
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Chapters & Tasks Management
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === 'Mangaka'
                ? 'Create chapters, assign duties to your assistants, and review submissions.'
                : role === 'Assistant'
                  ? 'Check your assigned drawing tasks, update work status, and submit drawings.'
                  : 'Oversee and review chapter development and assistant tasks.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MANGAKA VIEW INTERFACE                                                 */}
      {/* ========================================================================= */}
      {role === 'Mangaka' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Series Selection Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Select Serializing Series</label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value)
                    setSelectedChapterId('')
                  }}
                  className="bg-transparent text-foreground font-bold text-base focus:outline-none pr-6 cursor-pointer mt-0.5"
                >
                  {mangakaSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setNewChapterSeriesId(selectedSeriesId)
                setNewChapterNo('')
                setNewChapterTitle('')
                setNewChapterPages(24)
                setNewChapterPubDate('')
                setNewChapterSynopsis('')
                setNewChapterNotes('')
                setNewChapterStoryboardFiles([])
                setNewChapterManuscriptFiles([])
                setErrors({})
                setIsChapterModalOpen(true)
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Chapter
            </button>
            <button
              type="button"
              onClick={openEditChapter}
              className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-secondary/80 transition-all cursor-pointer"
            >
              <FileEdit className="w-4 h-4" /> Edit Chapter
            </button>
          </div>

          {/* Main Grid: Left Chapters List, Right Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Chapters List Column */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Chapter List
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {chapters.length} Total
                </span>
              </div>

              <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
                {chapters.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">No chapters created yet</p>
                    <button
                      onClick={() => {
                        setNewChapterSeriesId(selectedSeriesId)
                        setNewChapterNo('')
                        setNewChapterTitle('')
                        setNewChapterPages(24)
                        setNewChapterPubDate('')
                        setNewChapterSynopsis('')
                        setNewChapterNotes('')
                        setNewChapterStoryboardFiles([])
                        setNewChapterManuscriptFiles([])
                        setErrors({})
                        setIsChapterModalOpen(true)
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Create Chapter 1
                    </button>
                  </div>
                ) : (
                  chapters.map((chap) => {
                    const isSelected = chap.id === selectedChapterId
                    return (
                      <div
                        key={chap.id}
                        onClick={() => {
                          setSelectedChapterId(chap.id)
                          refreshData()
                        }}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/30'
                          }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            Ch.{chap.number}: {chap.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Deadline: {chap.deadline}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${getChapterStatusClass(chap.status)}`}>
                          {chap.status}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Selected Chapter Workspace Detail */}
            <div className="lg:col-span-2 space-y-6">
              {selectedChapter ? (
                <>
                  {/* Chapter Status Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-foreground">
                          Chapter {selectedChapter.number}: {selectedChapter.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Expected Pub Date: {selectedChapter.publicationDate} | Required Pages: {selectedChapter.totalPages} pages
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${getChapterStatusClass(selectedChapter.status)}`}>
                          {selectedChapter.status}
                        </span>
                      </div>
                    </div>

                    {/* Deadline Warning banner */}
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-500 rounded-xl text-xs">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Chapter Deadline:</strong> {selectedChapter.deadline} (Submission target to Editorial Board).
                      </span>
                    </div>

                    {selectedChapter.referenceFiles && selectedChapter.referenceFiles.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground">📎 Reference Documents</p>
                        {selectedChapter.referenceFiles.map((f: any) => (
                          <a key={f.fileAssetId} href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">
                            📄 {f.originalFileName}
                          </a>
                        ))}
                      </div>
                    )}
                    {/* Progress tracking */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Task progress (Approved by Mangaka)</span>
                        <span className="text-primary font-bold">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic text-right">
                        {approvedTasksOfChapter} of {totalTasksOfChapter} tasks completed and approved
                      </p>
                    </div>

                    {/* Change chapter status logic */}
                    <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
                      <span className="text-xs text-muted-foreground font-semibold">Manage Chapter Status:</span>
                      <div className="flex items-center gap-2">

                       {progressPercent >= 100 && selectedChapter.status !== 'Submitted' && selectedChapter.status !== 'Ready for Editor' && selectedChapter.status !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => setIsSubmitManuscriptOpen(true)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Submit Manuscript
                          </button>
                        )}
                        {false && selectedChapter?.status === 'Published' && (
                          <button
                            onClick={() => {
                              chapterService.updateChapter(selectedChapterId, { status: 'Published' }).then(() => {
                                refreshData()
                                showToast('Chapter successfully Published!')
                              })
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark as Published
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Tasks Assigned to Assistants
                      </h3>
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>

                    <div className="divide-y divide-border">
                      {chapterTasks.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-xs text-muted-foreground">No tasks assigned yet for this chapter</p>
                          <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Assign your first drawing task
                          </button>
                        </div>
                      ) : (
                        chapterTasks.map((task) => (
                          <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {task.type} (Pages {task.pages})
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTaskStatusClass(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-foreground leading-snug">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="w-3.5 h-3.5" />
                                <span>Assigned to: <strong>{task.assistantName}</strong></span>
                              </div>
                              {task.feedback && (
                                <p className="text-xs text-amber-600 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg mt-2 font-medium">
                                  <strong>Feedback:</strong> {task.feedback}
                                </p>
                              )}
                            </div>

                            {/* Actions on Task (For Mangaka) */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {task.status !== 'Submitted' && task.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => openEditTask(task)}
                                  className="inline-flex items-center gap-1.5 border border-border hover:bg-muted text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {task.status === 'Submitted' && (
                                <button
                                  onClick={async () => {
                                    setActiveTaskToReview(task)
                                    setIsReviewModalOpen(true)
                                    if (task.submittedFileAssetId) {
                                      try {
                                        const res = await fetchAPI<{ data: { publicUrl?: string } }>(`/api/files/${task.submittedFileAssetId}`)
                                        const url = res?.data?.publicUrl
                                        if (url) setActiveTaskToReview(prev => prev ? { ...prev, submittedWorkUrl: url } : prev)
                                      } catch (e) { /* ignore */ }
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Review Submission
                                </button>
                              )}
                              {task.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" /> Task Finished
                                </span>
                              )}
                              {task.status === 'Pending' && (
                                <span className="text-xs text-muted-foreground bg-muted p-2 rounded-xl italic">
                                  Awaiting assistant accept
                                </span>
                              )}
                              {task.status === 'In-Progress' && (
                                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl font-semibold">
                                  Assistant is working
                                </span>
                              )}
                              {task.status === 'Rejected' && (
                                <span className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 p-2 rounded-xl font-semibold">
                                  Needs revision
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {salaryByAssistant.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-bold mb-3 text-foreground">Salary Payable to Assistants</h4>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b border-border">
                                <th className="py-1.5 font-bold">Assistant</th>
                                <th className="py-1.5 font-bold text-center">Tasks Count</th>
                                <th className="py-1.5 font-bold text-center">Pages</th>
                                <th className="py-1.5 font-bold text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salaryByAssistant.map((s) => (
                                <tr key={s.assistantName} className="border-b border-border/50">
                                  <td className="py-1.5 font-semibold">{s.assistantName}</td>
                                  <td className="py-1.5 text-center">{s.taskCount}</td>
                                  <td className="py-1.5 text-center">{s.totalPages}</td>
                                  <td className="py-1.5 text-right font-bold text-green-600">{formatVND(s.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-3">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <h3 className="font-bold text-lg text-foreground">Select a chapter</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Select a chapter from the list or create a new one to start assigning work to assistants.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ASSISTANT VIEW INTERFACE                                               */}
      {/* ========================================================================= */}
      {role === 'Assistant' && (() => {
        const pendingTasks = assistantTasks.filter(t => t.status === 'Pending')
        const inProgressTasks = assistantTasks.filter(t => t.status === 'In-Progress' || t.status === 'Rejected')
        const completedTasks = assistantTasks.filter(t => t.status === 'Submitted' || t.status === 'Approved')
        const stats = {
          total: assistantTasks.length,
          pending: pendingTasks.length,
          working: inProgressTasks.length,
          completed: completedTasks.length,
        }
        const activeAssistant = assistants.find(a => a.id === selectedAssistantId)

        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Assistant Switcher Bar (For Demo Testing Purpose) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Select Active Assistant Profile (Testing)</label>
                  <select
                    value={selectedAssistantId}
                    onChange={(e) => setSelectedAssistantId(e.target.value)}
                    className="bg-transparent text-foreground font-bold text-base pr-6 cursor-pointer focus:outline-none mt-0.5"
                  >
                    {assistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Top Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-2xl p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" /> Assistant Workspace
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    Assistant Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    Manage and execute drawing tasks assigned by the author. Start working, submit drawings and view feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Profile Info */}
            {activeAssistant && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/15 text-primary w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                    {activeAssistant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-foreground">{activeAssistant.name}</h2>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Chuyên môn: {activeAssistant.specialty}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-muted-foreground font-semibold">Active Tasks</p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">{activeAssistant.activeTasks} active tasks</p>
                </div>
              </div>
            )}

            {/* Stats Counter Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Đã nộp / Hoàn thành', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Tasks được giao', value: stats.total, icon: ClipboardList, color: 'text-foreground', bg: 'bg-primary/10' },
                { label: 'Chờ bắt đầu', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Đang thực hiện', value: stats.working, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:border-primary/10 transition-colors">
                  <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Active & Pending Tasks */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    My Active Tasks ({stats.pending + stats.working})
                  </h2>
                </div>

                <div className="space-y-4">
                  {assistantTasks.filter(t => t.status !== 'Approved' && t.status !== 'Submitted').length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                      <h3 className="font-bold text-sm text-foreground">No active tasks</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        All assigned tasks have been completed. Please check for new script assignments from the author.
                      </p>
                    </div>
                  ) : (
                    assistantTasks.filter(t => t.status !== 'Approved' && t.status !== 'Submitted').map((task) => {
                      const isWorking = task.status === 'In-Progress' || task.status === 'Rejected'

                      return (
                        <div
                          key={task.id}
                          className={`bg-card border rounded-2xl p-5 transition-all space-y-4 ${task.status === 'Rejected'
                            ? 'border-red-500/30 bg-gradient-to-br from-card to-red-500/5'
                            : 'border-border hover:border-primary/20'
                            }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-foreground">
                                  {task.type} (Page {task.pages})
                                </h3>
                              </div>
                              <p className="text-xs text-muted-foreground font-semibold mt-1">
                                {getChapterInfo(task.chapterId)}
                              </p>
                            </div>

                            {getTaskStatusBadge(task.status)}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/40">
                            {task.description}
                          </p>
                          {task.referenceFiles && task.referenceFiles.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">📎 Reference Material</p>
                              {task.referenceFiles.map((f: any) => (
                                <a key={f.fileAssetId} href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">
                                  📄 {f.originalFileName}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Rejections & Feedback Box */}
                          {task.status === 'Rejected' && (task.feedback || task.submittedWorkUrl) && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 space-y-3">
                              {task.feedback && (
                                <div className="space-y-1">
                                  <p className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Revision Request Feedback
                                  </p>
                                  <p className="italic">"{task.feedback}"</p>
                                </div>
                              )}
                              <SubmissionFeedbackView submissionId={task.submissionId} imageUrl={task.submittedWorkUrl} />
                            </div>
                          )}

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/60" /> Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Ngay lập tức'}
                            </span>

                            <div>
                              {!isWorking ? (
                                <button
                                  onClick={() => handleStartTask(task.id)}
                                  className="flex items-center gap-1 px-4.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5" /> Bắt đầu vẽ
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {task.submissionId && (
                                    <button
                                      onClick={() => {
                                        setActiveTaskToView(task)
                                        setIsViewDetailModalOpen(true)
                                      }}
                                      className="flex items-center gap-1 px-3 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View Submission & Feedback
                                    </button>
                                  )}
                                  <span className="text-xs font-bold text-muted-foreground">
                                    Submission {(task.submissionCount || 0)}/{MAX_SUBMISSIONS}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setActiveTaskToSubmit(task)
                                      setIsSubmitWorkModalOpen(true)
                                    }}
                                    disabled={(task.submissionCount || 0) >= MAX_SUBMISSIONS}
                                    className="flex items-center gap-1 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    {(task.submissionCount || 0) >= MAX_SUBMISSIONS ? 'No more attempts' : 'Submit Work'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Task Archives / Finished Work */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Submitted & Completed ({stats.completed})
                </h2>

                <div className="space-y-4">
                  {completedTasks.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
                      <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                      <p className="text-xs text-muted-foreground">No completed tasks yet</p>
                    </div>
                  ) : (
                    completedTasks.map((task) => (
                      <div key={task.id} className="bg-card border border-border/60 rounded-2xl p-4.5 space-y-3.5 hover:border-primary/10 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-xs text-foreground">{task.type} (Page {task.pages})</h4>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{getChapterInfo(task.chapterId)}</p>
                          </div>
                          {getTaskStatusBadge(task.status)}
                        </div>

                        {/* Submitted mockup file preview */}
                        {task.submittedWorkUrl && (
                          <div className="relative h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={task.submittedWorkUrl}
                              alt="Submitted Work"
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                              <button
                                onClick={() => {
                                  setActiveTaskToView(task)
                                  setIsViewDetailModalOpen(true)
                                }}
                                className="p-1.5 bg-card rounded-lg text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Details & Feedback
                              </button>
                              <a
                                href={task.submittedWorkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-card rounded-lg text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" /> Original File
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Feedback summary */}
                        {task.status === 'Approved' && task.feedback && (
                          <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-2.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <span className="font-bold">Author Feedback: </span>
                            <span className="italic">"{task.feedback}"</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end text-[9px] text-muted-foreground font-semibold pt-1">
                          <span>Updated: {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ========================================================================= */}
      {/* 3. EDITOR VIEW / GENERAL VIEW                                            */}
      {/* ========================================================================= */}
      {(role === 'TantouEditor' || role === 'EditorialBoard') && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Chapter & Publication Overview (Editor Supervision Mode)
            </h3>
            <p className="text-xs text-muted-foreground">
              You are logged in as {role}. Below is the current progress of active series and timelines for each chapter.
            </p>
            <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
              {allChapters.map(c => {
                const tasksList = allTasks.filter(t => t.chapterId === c.id)
                const appPages = tasksList.filter(t => t.status === 'Approved').length
                const totPages = c.totalPages
                const progress = Math.round((appPages / (tasksList.length || 1)) * 100)

                return (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Chapter {c.number}: {c.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${getChapterStatusClass(c.status)}`}>
                          {getChapterStatusLabel(c.status)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Deadline: {c.deadline} | Expected Pub Date: {c.publicationDate}</p>
                    </div>
                    <div className="space-y-1 text-right sm:w-48 shrink-0">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Assigned tasks:</span>
                        <span className="text-primary">{tasksList.length} Tasks ({progress}% completed)</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {/* Edit Chapter Modal */}
      {isEditChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-primary" /> Edit Chapter
              </h3>
              <button
                type="button"
                onClick={() => setIsEditChapterOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Chapter Title</label>
              <input
                type="text"
                value={editChapterTitle}
                onChange={(e) => setEditChapterTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Enter new title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Total Pages</label>
              <input
                type="number"
               value={editChapterPages === 0 ? '' : editChapterPages}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setEditChapterPages(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Publication Date</label>
              <input
                type="date"
                value={editChapterPubDate}
                onChange={(e) => setEditChapterPubDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Submission Deadline</label>
              <input
                type="date"
                value={editChapterDeadline}
                onChange={(e) => setEditChapterDeadline(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditChapterOpen(false)}
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditChapter}
                className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* A. Create Chapter Modal (Mangaka) */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-4">
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" /> Register New Chapter (P3)
                </h3>
              </div>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Process Guidelines */}
            <div className="p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-cyan-500">Mangaka workflow for starting a new chapter:</p>
                  <p>① Declare basic chapter info (select series, chapter number, title, release date) → deadline calculated automatically</p>
                  <p>② Attach script/storyboard for Editor's early review (Optional)</p>
                  <p>③ Submit required rough draft (rough/ink) → Mangaka delegates detail tasks to Assistant</p>
                  <p>④ Add special notes for the Editor (double-spread, SFX, lettering...) (Optional)</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-6">

              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-4 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <BookOpen className="w-4 h-4 text-primary" />
                  1. Basic Information
                </h4>

                {/* Series */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Series <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.seriesId ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                      }`}
                    value={newChapterSeriesId}
                    onChange={(e) => {
                      setNewChapterSeriesId(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.seriesId
                        return copy
                      })
                    }}
                  >
                    <option value="">Select your series...</option>
                    {mangakaSeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {errors.seriesId && <p className="text-xs text-red-500 mt-1">{errors.seriesId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Chapter No */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" /> Chapter No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      min={1}
                      className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.chapterNo ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                        }`}
                      value={newChapterNo}
                      onChange={(e) => {
                        setNewChapterNo(e.target.value)
                        setErrors(prev => {
                          const copy = { ...prev }
                          delete copy.chapterNo
                          return copy
                        })
                      }}
                    />
                    {errors.chapterNo && <p className="text-xs text-red-500 mt-1">{errors.chapterNo}</p>}
                  </div>

                  {/* Total Pages */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Total Pages <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      min={1}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={newChapterPages}
                      onChange={(e) => setNewChapterPages(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Chapter Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The Awakening of the Dragon God"
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.title ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                      }`}
                    value={newChapterTitle}
                    onChange={(e) => {
                      setNewChapterTitle(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.title
                        return copy
                      })
                    }}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                {/* Publication Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Expected Pub Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.publicationDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                      }`}
                    value={newChapterPubDate}
                    onChange={(e) => {
                      setNewChapterPubDate(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.publicationDate
                        return copy
                      })
                    }}
                  />
                  {errors.publicationDate && <p className="text-xs text-red-500 mt-1">{errors.publicationDate}</p>}

                  {newChapterPubDate && !errors.publicationDate && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-700 dark:text-amber-400">
                        Manuscript deadline to Editor:{' '}
                        <strong>
                          {(() => {
                            const d = new Date(newChapterPubDate)
                            d.setDate(d.getDate() - 14)
                            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          })()}
                        </strong>{' '}
                        (14 days before publication date)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Tóm tắt nội dung */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  2. Chapter Synopsis
                </h4>
                <p className="text-xs text-muted-foreground">
                  Brief description of the main storyline. The Editor uses this section for approval and editorial alignment.
                </p>
                <textarea
                  placeholder="e.g. Ryuu unleashes the dragon god's power to confront the dark council..."
                  className="w-full h-24 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  value={newChapterSynopsis}
                  onChange={(e) => setNewChapterSynopsis(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{newChapterSynopsis.length} characters</p>
              </div>

              {/* Section 3: Storyboard */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <ScrollText className="w-4 h-4 text-violet-500" />
                  3. Script / Storyboard <span className="text-xs font-normal text-muted-foreground ml-1">(Tùy chọn)</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Panel layout draft (storyboard/nemu) helps the Editor and Assistant understand the chapter structure.
                </p>
                <div className="p-5 border-2 border-dashed border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5 rounded-2xl text-center transition-colors">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 text-violet-400 opacity-60" />
                  <p className="text-xs text-muted-foreground">Drag & drop or</p>
                  <label className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewChapterStoryboardFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, JPG, PNG · Max 20MB/file</p>
                </div>
                {newChapterStoryboardFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {newChapterStoryboardFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-base">📄</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <button
                            type="button"
                            onClick={() => removeFile('storyboardFiles', idx)}
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Rough/Sequential Art Manuscript (Bắt buộc) */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  4. Rough/Sequential Art Manuscript <span className="text-red-500">* Bắt buộc</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Attach rough sketches (pencil) or line art (ink) to start assigning drawing tasks.
                </p>
                <div className={`p-5 border-2 border-dashed rounded-2xl text-center transition-colors ${errors.manuscriptFiles
                  ? 'border-red-500 bg-red-500/5'
                  : 'border-primary/20 hover:border-primary/40 bg-primary/5'
                  }`}>
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${errors.manuscriptFiles ? 'text-red-400' : 'text-primary'} opacity-65`} />
                  <p className="text-xs text-muted-foreground">Drag & drop manuscript here or</p>
                  <label className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewChapterManuscriptFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">ZIP, PDF, JPG, PNG, TIF · Max 50MB/file</p>
                </div>
                {errors.manuscriptFiles && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-semibold mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.manuscriptFiles}
                  </p>
                )}
                {newChapterManuscriptFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {newChapterManuscriptFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{file.type === 'zip' ? '🗜️' : '🖼️'}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <button
                            type="button"
                            onClick={() => removeFile('manuscriptFiles', idx)}
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Notes cho Editor */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  5. Special Notes for Editor <span className="text-xs font-normal text-muted-foreground ml-1">(Tùy chọn)</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Các yêu cầu dàn trang đặc biệt: Page đôi (double-spread), font thoại, thứ tự đọc đặc biệt, v.v.
                </p>
                <textarea
                  placeholder="VD: Page 12-13 dùng double-spread cảnh chiến đấu lớn, tránh cắt giữa khi đóng gáy..."
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  value={newChapterNotes}
                  onChange={(e) => setNewChapterNotes(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-md shadow-primary/10 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Register Chapter to System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Create / Assign Task Modal (Mangaka) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Assign Drawing Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Task Type with Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Task Type</label>
                <input
                  type="text"
                  placeholder="Enter task type (e.g. Line Art, Coloring...)"
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-semibold"
                />

                {/* Suggestions List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Suggested task types (Click to select):</span>
                  <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-1 bg-muted/20 border border-border/50 rounded-xl">
                    {TASK_TYPE_SUGGESTIONS.map((suggestion) => {
                      const isSelected = newTaskType.toLowerCase() === suggestion.name.toLowerCase();
                      return (
                        <button
                          key={suggestion.name}
                          type="button"
                          onClick={() => {
                            setNewTaskType(suggestion.name);
                            const pagesText = `${newTaskPageStart}-${newTaskPageEnd}`;
                            setNewTaskDesc(suggestion.template.replace('{pages}', pagesText));
                          }}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 cursor-pointer ${isSelected
                            ? 'bg-primary/10 border-primary text-foreground'
                            : 'bg-muted/40 border-border/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{suggestion.name}</span>
                            {isSelected && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">Selected</span>}
                          </div>
                          <span className="text-[10px] opacity-80 leading-relaxed">{suggestion.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pages Range: Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Start Page</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedChapter?.totalPages || 100}
                    value={newTaskPageStart === 0 ? '' : newTaskPageStart}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNewTaskPageStart(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value)))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">End Page</label>
                  <input
                    type="number"
                    min={newTaskPageStart}
                    max={selectedChapter?.totalPages || 100}
                    value={newTaskPageEnd === 0 ? '' : newTaskPageEnd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNewTaskPageEnd(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Due Date & Select Assistant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Select Assistant</label>
                  <select
                    value={newTaskAssistantId}
                    onChange={(e) => setNewTaskAssistantId(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  >
                    {assistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.specialty}) — Active tasks count: {a.activeTasks}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
                  <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Unit Price / Page (VND)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="VD: 50000"
                  value={newTaskRate === 0 ? '' : newTaskRate}
                  onChange={(e) => setNewTaskRate(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
              {/* Instructions / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Description & Detailed Guidelines</label>
                <textarea
                  placeholder="Detailed description: Draw ancient temple background, light source from the right, anxious character expression..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  required
                />
              </div>

              {/* Attach Reference Files input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Attached Reference Files
                </label>
                <div className="p-3 border-2 border-dashed border-primary/20 hover:border-primary/45 bg-primary/5 rounded-xl text-center transition-colors">
                  <p className="text-xs text-muted-foreground">Attach drawing instruction files</p>
                  <label className="mt-1.5 inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Browse Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewTaskAttachments(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
                </div>
                {newTaskAttachments.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                    {newTaskAttachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/70 rounded-xl border border-border text-xs">
                        <span className="truncate max-w-[280px] font-medium text-foreground">📄 {file.name} ({file.size})</span>
                        <button
                          type="button"
                          onClick={() => removeTaskAttachment(idx)}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Review Assistant Submission Modal (Mangaka) */}
      {isEditTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsEditTaskOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Edit Task</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Start Page</label>
               <input type="number" value={editTaskPageStart === 0 ? '' : editTaskPageStart} onFocus={(e) => e.target.select()} onChange={(e) => setEditTaskPageStart(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">End Page</label>
               <input type="number" value={editTaskPageEnd === 0 ? '' : editTaskPageEnd} onFocus={(e) => e.target.select()} onChange={(e) => setEditTaskPageEnd(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Due Date</label>
              <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Unit Price / Page (VND)</label>
              <input type="number" min={0} value={editTaskRate === 0 ? '' : editTaskRate} onChange={(e) => setEditTaskRate(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Assign to (change assistant)</label>
              <select
                value={editTaskAssistantId}
                onChange={(e) => setEditTaskAssistantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
              >
                <option value="">-- Select Assistant --</option>
                {assistants.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">Change assistant to reassign this task to someone else.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEditTaskOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted">Cancel</button>
              <button type="button" onClick={handleSaveEditTask} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
      {pinOverlayOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col" onClick={() => setPinOverlayOpen(false)}>
          <div className="flex items-center justify-between p-3 text-white shrink-0">
            <span className="text-sm font-bold">
              Click on image to pin comments
              {zipPages.length > 1 && ` — Page ${currentPage + 1}/${zipPages.length}`}
              {` — ${imagePins.filter(p => p.page === currentPage).length} points`}
            </span>
            <button onClick={() => setPinOverlayOpen(false)} className="text-white text-xl px-3">✕</button>
          </div>

          {zipPages.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-2 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 bg-white/20 rounded-lg disabled:opacity-30">‹ Prev</button>
              <span className="text-sm">Page {currentPage + 1}/{zipPages.length}</span>
              <button onClick={() => setCurrentPage(p => Math.min(zipPages.length - 1, p + 1))} disabled={currentPage === zipPages.length - 1} className="px-3 py-1 bg-white/20 rounded-lg disabled:opacity-30">Next ›</button>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div
              className="flex-1 relative flex items-center justify-center overflow-auto cursor-crosshair"
              onClick={(e) => {
                const img = (e.currentTarget.querySelector('img') as HTMLImageElement)
                if (!img) return
                const rect = img.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                if (x < 0 || x > 100 || y < 0 || y > 100) return
                setImagePins(prev => [...prev, { x, y, note: '', page: currentPage }])
              }}
            >
              {zipLoading ? (
                <p className="text-white text-sm">Extracting ZIP file...</p>
              ) : zipPages[currentPage] ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={zipPages[currentPage].dataUrl} alt="submission" className="max-h-[80vh] max-w-full object-contain pointer-events-none" />
                  {imagePins.map((pin, idx) => pin.page === currentPage && (
                    <div key={idx} className="absolute w-7 h-7 -ml-3.5 -mt-3.5 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
                      {idx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white text-sm">No images to display.</p>
              )}
            </div>

            <div className="w-80 bg-background p-4 overflow-y-auto shrink-0 space-y-2">
              <h3 className="text-sm font-extrabold mb-2">Comments ({imagePins.length})</h3>
              {imagePins.length === 0 && <p className="text-xs text-muted-foreground">Click on the image to add a feedback point.</p>}
              {imagePins.map((pin, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-1">{idx + 1}</span>
                  <div className="flex-1">
                    {zipPages.length > 1 && <span className="text-[10px] text-muted-foreground">Page {pin.page + 1}</span>}
                    <textarea
                      value={pin.note}
                      onChange={(e) => setImagePins(prev => prev.map((p, i) => i === idx ? { ...p, note: e.target.value } : p))}
                      placeholder="Comments cho points này..."
                      className="w-full text-xs px-2 py-1.5 border border-border rounded-lg bg-background resize-none"
                      rows={2}
                    />
                  </div>
                  <button onClick={() => setImagePins(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 shrink-0 mt-1">✕</button>
                </div>
              ))}
              <button onClick={() => setPinOverlayOpen(false)} className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">Done</button>
            </div>
          </div>
        </div>
      )}
      {isSubmitManuscriptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsSubmitManuscriptOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Submit Manuscript</h3>
            <p className="text-xs text-muted-foreground">Each submission will create a new version.</p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Manuscript File</label>
              <label className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                <span className="shrink-0 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">Select file</span>
                <span className="text-muted-foreground truncate">
                  {submitManuscriptFile ? submitManuscriptFile.name : 'No file selected'}
                </span>
                <input
                  type="file"
                  onChange={(e) => setSubmitManuscriptFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Notes</label>
              <textarea value={submitManuscriptNotes} onChange={(e) => setSubmitManuscriptNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsSubmitManuscriptOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted">Cancel</button>
              <button type="button" disabled={submitManuscriptUploading} onClick={handleSubmitManuscript} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {submitManuscriptUploading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isReviewModalOpen && activeTaskToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Review Assistant Submission
              </h3>
              <button
                onClick={() => {
                  setIsReviewModalOpen(false)
                  setActiveTaskToReview(null)
                  setReviewFeedback('')
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Side: Image Preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground">Preview submitted work</label>
                <div
                  className="relative border border-border rounded-xl overflow-hidden bg-muted min-h-[400px] max-h-[600px] flex items-center justify-center group shadow-inner cursor-crosshair"
                  onClick={() => {
                    if (activeTaskToReview.submittedWorkUrl && /\.zip(\?|$)/i.test(activeTaskToReview.submittedWorkUrl)) {
                      openPinOverlay()
                    }
                  }}
                >
                  {!activeTaskToReview.submittedWorkUrl ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                      <ImageIcon className="w-12 h-12" />
                      <span className="text-xs">No submissions yet</span>
                    </div>
                  ) : /\.zip(\?|$)/i.test(activeTaskToReview.submittedWorkUrl) ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground pointer-events-none">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl">ZIP</div>
                      <span className="text-sm font-bold text-foreground">Multi-page compressed file</span>
                      <span className="text-xs">Click here to view & comment page-by-page</span>
                    </div>
                  ) : (
                    <ImageCommentLayer
                      imageUrl={activeTaskToReview.submittedWorkUrl}
                      pageNo={getTaskPageNo(activeTaskToReview)}
                      annotations={taskAnnotations}
                      onAddAnnotation={handleAddTaskAnnotation}
                    />
                  )}
                  {imagePins.map((pin, idx) => (
                    <div
                      key={idx}
                      className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

            {activeTaskToReview.submittedWorkUrl && (
                  <button
                    onClick={openPinOverlay}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                  >
                    Open lightbox for detailed feedback
                  </button>
                )}

                {imagePins.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">Feedback on Image ({imagePins.length})</label>
                    {imagePins.map((pin, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                        <input
                          value={pin.note}
                          onChange={(e) => setImagePins(prev => prev.map((p, i) => i === idx ? { ...p, note: e.target.value } : p))}
                          placeholder="Enter feedback for this point..."
                          className="flex-1 text-xs px-2 py-1.5 border border-border rounded-lg bg-background"
                        />
                        <button onClick={() => setImagePins(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTaskToReview.prevSubmittedWorkUrl && (
                  <div className="space-y-2">
                   <button
                      onClick={handleCompareSubmissions}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Compare with previous submission
                    </button>
                    {subCompareLoading && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        Comparing images...
                      </div>
                    )}
                    {subCompareError && (
                      <div className="text-xs text-red-600 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                        {subCompareError}
                      </div>
                    )}
                    {subCompareResult && (
                      <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">Change percentage compared to previous</span>
                          <span className={`text-sm font-extrabold ${subCompareResult.percent > 20 ? 'text-red-600' : subCompareResult.percent > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {subCompareResult.percent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${subCompareResult.percent > 20 ? 'bg-red-500' : subCompareResult.percent > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(subCompareResult.percent, 100)}%` }}
                          />
                        </div>
                        {subCompareResult.diff && (
                          <div className="space-y-1">
                            <img src={subCompareResult.diff} alt="Vùng thay đổi" className="w-full border border-border rounded-lg" />
                            <p className="text-[10px] text-muted-foreground text-center">🔴 Red highlighted areas show differences from the previous submission</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submitted Files List */}

                {/* Submitted Files List */}
                {activeTaskToReview.submittedFiles && activeTaskToReview.submittedFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Submitted Files ({activeTaskToReview.submittedFiles.length})</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {activeTaskToReview.submittedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                          <span className="font-medium text-emerald-800 dark:text-emerald-400 truncate max-w-[200px]">🖼️ {file.name}</span>
                          <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTaskToReview.submittedWorkUrl ? (
                  <a href={activeTaskToReview.submittedWorkUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline bg-muted/40 p-2.5 rounded-xl border border-border">
                    📎 Open submission file in new tab
                  </a>
                ) : (
                  <div className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border">
                    No attached files submitted
                  </div>
                )}
              </div>

              {/* Right Side: Task Details & Actions */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Manga: {getMangaTitleForTask(activeTaskToReview)}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                      {activeTaskToReview.type} (Page {activeTaskToReview.pages})
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {activeTaskToReview.description}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Submitted by: <strong>{activeTaskToReview.assistantName}</strong>
                  </p>

                  <div className="p-3 bg-muted/50 rounded-xl text-xs leading-relaxed text-foreground border border-border">
                    <p className="font-bold text-muted-foreground mb-1 text-[10px] uppercase">Notes của Assistant:</p>
                    <p className="italic whitespace-pre-line">{activeTaskToReview.submitDescription || 'Work completed, sent for Mangaka review.'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Feedback Comments (Required if Rejecting)</label>
                  <textarea
                    placeholder="Enter feedback comments... Các points tốt cần giữ, chi tiết cụ thể cần chỉnh sửa..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2.5 justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => handleRejectTask(activeTaskToReview)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleApproveTask(activeTaskToReview)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Approve & Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. Submit Task Deliverable Modal (Assistant) */}
      {isSubmitWorkModalOpen && activeTaskToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => {
            setIsSubmitWorkModalOpen(false)
            setActiveTaskToSubmit(null)
            setSubmitFiles([])
            setSubmitComment('')
          }} />

          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" /> Submit Work completed
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Submit sản phẩm và ghi chú bản vẽ cho tác giả. Họ sẽ xét duyệt để phê duyệt hoặc yêu cầu bạn điều chỉnh thêm.
            </p>

            <form onSubmit={handleSubmitWork} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Submission Description</label>
                <textarea
                  required
                  placeholder="e.g. Finished background and screentone. Added debris details on page 5."
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-24 resize-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Submission Files</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const picked = e.target.files ? Array.from(e.target.files) : []
                    setSubmitFiles(prev => [...prev, ...picked])
                    e.target.value = ''
                  }}
                  className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
                {submitFiles.length > 0 && (
                  <div className="space-y-1 mt-1">
                    <p className="text-[10px] text-muted-foreground">Selected {submitFiles.length} file(s):</p>
                    {submitFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-muted/40 rounded-lg px-2 py-1">
                        <span className="truncate text-foreground">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setSubmitFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 font-bold ml-2 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitWorkModalOpen(false)
                    setActiveTaskToSubmit(null)
                    setSubmitFiles([])
                    setSubmitComment('')
                  }}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitWorkUploading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitWorkUploading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. View Task Details Modal (Read-only for Assistant/General) */}
      {isViewDetailModalOpen && activeTaskToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-4xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Task Details & Revision Comments
              </h3>
              <button
                onClick={() => {
                  setIsViewDetailModalOpen(false)
                  setActiveTaskToView(null)
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Image Preview with Comments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">Submitted Work & Notes</label>
                  {activeTaskToView.submittedWorkUrl && (
                    <a
                      href={activeTaskToView.submittedWorkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Download Original File
                    </a>
                  )}
                </div>

                {!activeTaskToView.submittedWorkUrl ? (
                  <div className="flex flex-col items-center justify-center border border-border rounded-xl bg-muted min-h-[300px] text-muted-foreground/50">
                    <Layers className="w-12 h-12 mb-2" />
                    <span className="text-xs">No submissions uploaded yet</span>
                  </div>
                ) : zipLoading ? (
                  <div className="flex flex-col items-center justify-center border border-border rounded-xl bg-muted min-h-[300px] text-muted-foreground">
                    <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-xs">Extracting zip file...</span>
                  </div>
                ) : zipPages.length > 0 ? (
                  <div className="space-y-3">
                    {zipPages.length > 1 && (
                      <div className="flex items-center justify-between bg-muted/40 border border-border p-2 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="px-2.5 py-1 bg-card hover:bg-muted border border-border rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ‹ Prev
                        </button>
                        <span className="text-xs font-bold text-foreground">Page {currentPage + 1}/{zipPages.length}: {zipPages[currentPage].name}</span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.min(zipPages.length - 1, p + 1))}
                          disabled={currentPage === zipPages.length - 1}
                          className="px-2.5 py-1 bg-card hover:bg-muted border border-border rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <ImageCommentLayer
                        imageUrl={zipPages[currentPage].dataUrl}
                        pageNo={getTaskPageNo(activeTaskToView, currentPage)}
                        annotations={taskAnnotations}
                        readOnly={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border border-border rounded-xl bg-muted min-h-[300px] text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-xs text-center px-4">Cannot preview image file. Please click "Download Original File" to inspect directly.</span>
                  </div>
                )}
              </div>

              {/* Right Column: Task Details and Rejection Feedback */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Manga/Chapter Info */}
                  <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chapter Info</p>
                    <p className="font-bold text-foreground text-sm">{getChapterInfo(activeTaskToView.chapterId)}</p>
                    <p className="text-xs text-muted-foreground font-semibold">Task: {activeTaskToView.type} (Page {activeTaskToView.pages})</p>
                  </div>

                  {/* Task details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">Due Date</p>
                      <p className="font-semibold text-amber-600 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1.5 rounded-lg inline-block text-xs">
                        {activeTaskToView.dueDate ? new Date(activeTaskToView.dueDate).toLocaleDateString() : 'Unlimited'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">Status</p>
                      <div className="inline-block">
                        {getTaskStatusBadge(activeTaskToView.status)}
                      </div>
                    </div>
                  </div>

                  {/* Description from Mangaka */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground">Author Guidelines & Requirements</p>
                    <div className="p-3 bg-muted/30 border border-border rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-line">
                      {activeTaskToView.description}
                    </div>
                  </div>

                  {/* Reference Files */}
                  {activeTaskToView.referenceFiles && activeTaskToView.referenceFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground">Attached Guidelines</p>
                      <div className="space-y-1">
                        {activeTaskToView.referenceFiles.map((f) => (
                          <a
                            key={f.fileAssetId}
                            href={f.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline p-2 bg-muted/20 border border-border/40 rounded-xl"
                          >
                            <span className="truncate flex-1">{f.originalFileName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejections & Feedback Box */}
                  {activeTaskToView.status === 'Rejected' && activeTaskToView.feedback && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-600 dark:text-red-400 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Revision Requests from Author
                      </p>
                      <p className="italic bg-card/40 p-2.5 rounded-lg border border-red-500/10">"{activeTaskToView.feedback}"</p>
                    </div>
                  )}

                  {/* Assistant Submission notes */}
                  {activeTaskToView.submitDescription && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">Your submission notes</p>
                      <div className="p-3 bg-muted/20 border border-border rounded-xl text-foreground text-xs italic leading-relaxed">
                        "{activeTaskToView.submitDescription}"
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewDetailModalOpen(false)
                      setActiveTaskToView(null)
                    }}
                    className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
