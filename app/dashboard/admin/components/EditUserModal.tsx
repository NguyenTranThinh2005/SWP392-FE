'use client'

import { useState, useEffect } from 'react'
import { Edit3, User2, Link, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { type User } from '@/types/user'
import { userService, type UserAssignmentResponse } from '@/services/userService'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  editors: User[]
  assistants: User[]
  getEditorName: (editorId?: string) => string
  getAssistantName: (assistantId?: string) => string
  onSuccess: () => void
}

type Tab = 'info' | 'editor' | 'assistant'

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  editors,
  assistants,
  getEditorName,
  getAssistantName,
  onSuccess
}: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')

  // ── Account Info state ────────────────────────────────────────
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  // ── Assign Editor state ───────────────────────────────────────
  const [selectedEditorId, setSelectedEditorId] = useState('')
  const [activeEditorAssignmentId, setActiveEditorAssignmentId] = useState('')
  const [editorHistory, setEditorHistory] = useState<UserAssignmentResponse[]>([])
  const [loadingEditorHistory, setLoadingEditorHistory] = useState(false)
  const [reassigningEditor, setReassigningEditor] = useState(false)

  // ── Assign Assistant state ────────────────────────────────────
  const [selectedAssistantId, setSelectedAssistantId] = useState('')
  const [activeAssistantAssignmentId, setActiveAssistantAssignmentId] = useState('')
  const [assistantHistory, setAssistantHistory] = useState<UserAssignmentResponse[]>([])
  const [loadingAssistantHistory, setLoadingAssistantHistory] = useState(false)
  const [reassigningAssistant, setReassigningAssistant] = useState(false)

  const isMangaka = user?.role === 'Mangaka'

  // ── Reset on open ─────────────────────────────────────────────
  useEffect(() => {
    if (user && isOpen) {
      setActiveTab('info')
      setName(user.name)
      setUsername(user.username || '')
      setEmail(user.email)
      setPassword('')
      setConfirmPassword('')
    }
  }, [user, isOpen])

  // ── Load Editor history when tab opens ───────────────────────
  useEffect(() => {
    if (activeTab === 'editor' && user && isMangaka) {
      setLoadingEditorHistory(true)
      setEditorHistory([])
      setActiveEditorAssignmentId('')
      userService.getMyAssignment(user.id)
        .then(all => {
          // Editor assignments: ToUserId = MangakaId
          const filtered = all
            .filter(item => item.toUserId === user.id)
            .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
          const active = filtered.find(item => !item.unassignedAt)
          setEditorHistory(filtered)
          setActiveEditorAssignmentId(active?.assignmentId || '')
          setSelectedEditorId(active?.fromUserId || user.editorId || '')
        })
        .catch((err: any) => toast.error(err.message || 'Failed to load editor history.'))
        .finally(() => setLoadingEditorHistory(false))
    }
  }, [activeTab, user, isMangaka])

  // ── Load Assistant history when tab opens ────────────────────
  useEffect(() => {
    if (activeTab === 'assistant' && user && isMangaka) {
      setLoadingAssistantHistory(true)
      setAssistantHistory([])
      setActiveAssistantAssignmentId('')
      userService.getMyAssignment(user.id)
        .then(all => {
          // Assistant assignments: FromUserId = MangakaId
          const filtered = all
            .filter(item => item.fromUserId === user.id)
            .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
          const active = filtered.find(item => !item.unassignedAt)
          setAssistantHistory(filtered)
          setActiveAssistantAssignmentId(active?.assignmentId || '')
          setSelectedAssistantId(active?.toUserId || user.assistantId || '')
        })
        .catch((err: any) => toast.error(err.message || 'Failed to load assistant history.'))
        .finally(() => setLoadingAssistantHistory(false))
    }
  }, [activeTab, user, isMangaka])

  // ── Handlers ─────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!name.trim() || !username.trim() || !email.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (password && password !== confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    if (password && password.length < 8) {
      toast.error('New password must be at least 8 characters long.')
      return
    }
    setUpdating(true)
    try {
      await userService.updateUser(user.id, {
        displayName: name.trim(),
        userName: username.trim(),
        email: email.trim(),
        newPassword: password ? password : undefined
      })
      toast.success(`Successfully updated account "${name}"!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account.')
    } finally {
      setUpdating(false)
    }
  }

  const handleAssignEditor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!selectedEditorId) { toast.error('Please select a Tantou Editor.'); return }
    if (!activeEditorAssignmentId) { toast.error('No active editor assignment found to change.'); return }
    setReassigningEditor(true)
    try {
      await userService.assignEditorToMangaka(user.id, selectedEditorId, activeEditorAssignmentId)
      toast.success('Editor assigned successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign editor.')
    } finally {
      setReassigningEditor(false)
    }
  }

  const handleAssignAssistant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!selectedAssistantId) { toast.error('Please select an Assistant.'); return }
    setReassigningAssistant(true)
    try {
      await userService.assignAssistantToMangaka(user.id, selectedAssistantId, activeAssistantAssignmentId)
      toast.success('Assistant assigned successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign assistant.')
    } finally {
      setReassigningAssistant(false)
    }
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (!user) return null

  const tabs: { id: Tab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'info', label: 'Account Info', icon: <User2 className="w-3.5 h-3.5" /> },
    { id: 'editor', label: 'Assign Editor', icon: <Link className="w-3.5 h-3.5" />, hidden: !isMangaka },
    { id: 'assistant', label: 'Assign Assistant', icon: <Bot className="w-3.5 h-3.5" />, hidden: !isMangaka },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Edit User — {user.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-0.5 px-6 pt-4 border-b border-border">
          {tabs.filter(t => !t.hidden).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">

          {/* ── Tab: Account Info ──────────────────────────── */}
          {activeTab === 'info' && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Username <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank if you do not want to change password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button type="button" onClick={onClose} variant="outline"
                  className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer" disabled={updating}>
                  Cancel
                </Button>
                <Button type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
                  disabled={updating}>
                  {updating ? 'Updating...' : 'Update Account'}
                </Button>
              </div>
            </form>
          )}

          {/* ── Tab: Assign Editor ────────────────────────── */}
          {activeTab === 'editor' && isMangaka && (
            <form onSubmit={handleAssignEditor} className="space-y-4">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground">Mangaka</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{user.name} ({user.email})</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Tantou Editor
                </label>
                <select
                  value={selectedEditorId}
                  onChange={(e) => setSelectedEditorId(e.target.value)}
                  disabled={reassigningEditor || loadingEditorHistory}
                  className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
                >
                  <option value="" disabled>-- Select Tantou Editor --</option>
                  {editors.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.name} ({ed.username})</option>
                  ))}
                </select>
              </div>

              <AssignmentHistoryPanel
                title="Editor Assignment History"
                loading={loadingEditorHistory}
                history={editorHistory}
                activeAssignmentId={activeEditorAssignmentId}
                renderName={(item) => item.fromUserName || getEditorName(item.fromUserId)}
                formatDateTime={formatDateTime}
              />

              <Button type="submit"
                disabled={reassigningEditor || loadingEditorHistory || !selectedEditorId || !activeEditorAssignmentId}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl cursor-pointer">
                {reassigningEditor ? 'Changing Editor...' : 'Confirm Editor Change'}
              </Button>
            </form>
          )}

          {/* ── Tab: Assign Assistant ─────────────────────── */}
          {activeTab === 'assistant' && isMangaka && (
            <form onSubmit={handleAssignAssistant} className="space-y-4">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground">Mangaka</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{user.name} ({user.email})</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Assistant
                </label>
                <select
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                  disabled={reassigningAssistant || loadingAssistantHistory}
                  className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
                >
                  <option value="" disabled>-- Select Assistant --</option>
                  {assistants.map(ast => (
                    <option key={ast.id} value={ast.id}>{ast.name} ({ast.username})</option>
                  ))}
                </select>
              </div>

              <AssignmentHistoryPanel
                title="Assistant Assignment History"
                loading={loadingAssistantHistory}
                history={assistantHistory}
                activeAssignmentId={activeAssistantAssignmentId}
                renderName={(item) => item.toUserName || getAssistantName(item.toUserId)}
                formatDateTime={formatDateTime}
              />

              <Button type="submit"
                disabled={reassigningAssistant || loadingAssistantHistory || !selectedAssistantId}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl cursor-pointer">
                {reassigningAssistant ? 'Changing Assistant...' : 'Confirm Assistant Assignment'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Reusable history panel ────────────────────────────────────────
function AssignmentHistoryPanel({
  title, loading, history, activeAssignmentId, renderName, formatDateTime
}: {
  title: string
  loading: boolean
  history: UserAssignmentResponse[]
  activeAssignmentId: string
  renderName: (item: UserAssignmentResponse) => string
  formatDateTime: (v?: string | null) => string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        {activeAssignmentId && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">Active</Badge>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No assignment data available.</p>
      ) : (
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
          {history.map(item => {
            const isActive = !item.unassignedAt
            return (
              <div key={item.assignmentId}
                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-foreground truncate">{renderName(item)}</p>
                  <Badge className={isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold'
                    : 'bg-muted text-muted-foreground border border-border text-[10px] font-bold'}>
                    {isActive ? 'Assigned' : 'Ended'}
                  </Badge>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <span>Assigned: {formatDateTime(item.assignedAt)}</span>
                  <span>Ended: {formatDateTime(item.unassignedAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
