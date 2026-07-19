'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import {
  type Task,
  type TaskStatus,
  type Assistant
} from '@/lib/chapters-store'
import { fetchAPI } from '@/services/api'
import { userService } from '@/services/userService'
import { chapterService, type Chapter } from '@/services/chapterService'
import { seriesService } from '@/services/seriesService'

export default function AssistantDashboardPage() {
  const { role } = useRole()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Simulation states
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [allSeries, setAllSeries] = useState<any[]>([])

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

    const status = String(sorted[0]?.status).trim().toUpperCase()
    return sorted.find(s => status === '0' || status === 'SUBMITTED') || sorted[0]
  }

  const mapBackendTaskStatus = (status: any, submissions?: any[]): TaskStatus => {
    const statusStr = String(status).trim().toUpperCase();
    const latestSubmission = getLatestSubmission(submissions);
    const latestSubStatus = String(latestSubmission?.status).trim().toUpperCase();

    if (statusStr === '3' || statusStr === 'APPROVED') return 'Approved';
    if (statusStr === '2' || statusStr === 'COMPLETED') return 'Submitted';
    if (statusStr === '1' || statusStr === 'INPROGRESS' || statusStr === 'IN-PROGRESS') {
      if (latestSubStatus === '2' || latestSubStatus === 'REJECTED') return 'Rejected';
      return 'In-Progress';
    }
    return 'Pending';
  }

  const fetchTasks = async (): Promise<Task[]> => {
    try {
      const response = await fetchAPI<{ data: any[] }>('/api/page-tasks/assistant')
      const data = response.data || response || []

      if (Array.isArray(data)) {
        return data.map((t: any) => {
          const latestSub = getLatestSubmission(t.submissions);
          let uiStatus = mapBackendTaskStatus(t.status, t.submissions)
          const taskId = t.pageTaskId || t.id
          if (uiStatus === 'Pending' && typeof window !== 'undefined') {
            try {
              const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
              if (started.includes(taskId)) {
                uiStatus = 'In-Progress'
              }
            } catch { }
          }

          return {
            id: taskId,
            chapterId: t.chapterId,
            type: t.taskType,
            pages: `${t.pageStart}-${t.pageEnd}`,
            description: t.description || '',
            assistantId: t.assistantId || 'Unassigned',
            assistantName: t.assistantName || 'Assistant',
            status: uiStatus,
            dueDate: t.dueDate || undefined,
            pageStart: t.pageStart,
            pageEnd: t.pageEnd,
          }
        })
      }
    } catch (error) {
      console.warn("fetchTasks failed:", error)
    }
    return []
  }

  const loadData = useCallback(() => {
    if (typeof window !== 'undefined' && !selectedAssistantId) {
      const userInfo = localStorage.getItem('user-info')
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo)
          const myId = parsed?.id || parsed?.userId
          if (myId) setSelectedAssistantId(myId)
        } catch { }
      }
    }
    userService.getUsers().then((res) => {
      const list = (res.data || []).filter(u => u.roleName?.toLowerCase() === 'assistant')
      const mapped = list.map(u => ({
        id: u.userId,
        name: u.displayName || u.userName,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        specialty: 'Assistant',
        activeTasks: 0
      }))
      setAssistants(mapped)

      if (typeof window !== 'undefined') {
        const userInfo = localStorage.getItem('user-info')
        if (userInfo) {
          try {
            const parsed = JSON.parse(userInfo)
            if (parsed.role?.toLowerCase() === 'assistant') {
              setSelectedAssistantId(parsed.id)
              return
            }
          } catch { }
        }
      }
      if (mapped.length > 0 && !selectedAssistantId) {
        setSelectedAssistantId(mapped[0].id)
      }
    }).catch(() => { })

    chapterService.listChapters().then((chaps) => setAllChapters(chaps)).catch(() => { })
    seriesService.listSeries().then((list) => setAllSeries(list)).catch(() => { })

    if (selectedAssistantId) {
      fetchTasks().then((res) => {
        setTasks(res)
      }).catch(() => { })
    }
  }, [selectedAssistantId])

  useEffect(() => {
    loadData()
    setMounted(true)
  }, [loadData])

  if (!mounted) return null



  const activeAssistant = assistants.find(a => a.id === selectedAssistantId)

  const getChapterInfo = (chapterId: string) => {
    const chapter = allChapters.find(c => c.id === chapterId)
    if (!chapter) return `Ref: ${chapterId}`
    const series = allSeries.find(s => s.id === chapter.seriesId)
    const seriesTitle = series ? series.title : 'Manga'
    return `${seriesTitle} - Ch. ${chapter.number || (chapter as any).chapterNo || 1}: ${chapter.title}`
  }

  const pendingTasks = tasks.filter(t => t.status === 'Pending')
  const inProgressTasks = tasks.filter(t => t.status === 'In-Progress' || t.status === 'Rejected')
  const completedTasks = tasks.filter(t => t.status === 'Submitted' || t.status === 'Approved')
  const activeTasks = [...pendingTasks, ...inProgressTasks]

  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    working: inProgressTasks.length,
    completed: completedTasks.length,
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
      case 'In-Progress':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Play className="w-3 h-3 animate-pulse" /> In-Progress</span>
      case 'Rejected':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Revision Required</span>
      default:
        return <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Assistant Dashboard
            </h1>
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
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">Specialty: {activeAssistant.specialty}</p>
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
          { label: 'Submitted / Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Assigned Tasks', value: stats.total, icon: ClipboardList, color: 'text-foreground', bg: 'bg-primary/10' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'In-Progress', value: stats.working, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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

      {/* Active Tasks Overview */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Active Tasks ({activeTasks.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Tasks that require your attention.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/chapters')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Go to Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-border">
          {activeTasks.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
              <h3 className="font-bold text-sm text-foreground">You have no active tasks</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                All tasks have been submitted or approved. Take a break or contact the Mangaka to get new scripts!
              </p>
            </div>
          ) : (
            activeTasks.map((task) => (
              <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{task.type} (Pages {task.pages})</span>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{getChapterInfo(task.chapterId)}</p>
                  <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">"{task.description}"</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/chapters')}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                  title="Go to task details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
