'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Info,
  Edit3,
  UserX
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import { type User } from '@/types/user'
import { userService } from '@/services/userService'
import { type RoleResponse } from '@/services/systemService'
import ViewUserModal from './ViewUserModal'
import EditUserModal from './EditUserModal'

interface UserListTabProps {
  usersList: User[]
  role: string
  rolesList: RoleResponse[]
  editors: User[]
  assistants: User[]
  getEditorName: (editorId?: string) => string
  getAssistantName: (assistantId?: string) => string
  onRefreshUsers: () => void
}

export default function UserListTab({
  usersList,
  role,
  rolesList,
  editors,
  assistants,
  getEditorName,
  getAssistantName,
  onRefreshUsers
}: UserListTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal States
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList
      .filter(u => {
        const matchSearch =
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchRole = roleFilter === 'all' || u.role === roleFilter
        const matchStatus = statusFilter === 'all' || u.status === statusFilter

        return matchSearch && matchRole && matchStatus
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
  }, [usersList, searchTerm, roleFilter, statusFilter])

  // Tính năng khóa tài khoản: Chuyển đổi trạng thái tài khoản người dùng thành Inactive (gọi DELETE /api/users/{id})
  const handleToggleStatus = async (userId: string, currentStatus: 'Active' | 'Inactive') => {
    if (currentStatus === 'Active') {
      try {
        await userService.deleteUser(userId)
        toast.success('Account locked successfully!')
        onRefreshUsers()
      } catch (err: any) {
        toast.error(err.message || 'Failed to lock account.')
      }
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search and Filters Card */}
      <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter by Role */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Mangaka">Mangaka</option>
            <option value="TantouEditor">Tantou Editor</option>
            <option value="EditorialBoard">Editorial Board</option>
            <option value="EditorInChief">Editor in Chief</option>
            <option value="Assistant">Assistant</option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
          </select>
        </div>
      </Card>

      {/* Main User Table Card */}
      <Card className="border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow>
                <TableHead className="w-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Avatar</TableHead>
                <TableHead className="w-44 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">User / ID</TableHead>
                <TableHead className="w-28 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Username</TableHead>
                <TableHead className="w-40 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Email</TableHead>
                <TableHead className="w-24 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Role</TableHead>
                <TableHead className="w-24 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Created</TableHead>
                {role === 'Admin' && (
                  <>
                    <TableHead className="w-28 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Resp. Editor</TableHead>
                    <TableHead className="w-28 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Asst.</TableHead>
                  </>
                )}
                <TableHead className="w-20 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                <TableHead className="w-28 shrink-0 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'Admin' ? 10 : 8} className="p-12 text-center text-muted-foreground space-y-2">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs">No accounts found matching the filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  let roleBadgeClass = 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  if (user.role === 'Admin') roleBadgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  else if (user.role === 'Mangaka') roleBadgeClass = 'bg-primary/10 text-primary border-primary/20'
                  else if (user.role === 'TantouEditor') roleBadgeClass = 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                  else if (user.role === 'EditorialBoard') roleBadgeClass = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                  else if (user.role === 'EditorInChief') roleBadgeClass = 'bg-red-500/10 text-red-600 border-red-500/20'

                  return (
                    <TableRow key={user.id} className="border-b border-border hover:bg-muted/15 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex justify-center">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                          ) : (
                            <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-border">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-foreground py-2.5 max-w-[160px]">
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">{user.id}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-[100px] truncate">{user.username}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[150px] truncate">{user.email}</TableCell>

                      <TableCell>
                        <Badge className={`${roleBadgeClass} font-bold text-[10px] px-2.5 py-0.5 rounded-full border`}>
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }) : '—'}
                      </TableCell>

                      {role === 'Admin' && (
                        <>
                          <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[110px] truncate">
                            {user.role === 'Mangaka'
                              ? (user.assignedEditorName || getEditorName(user.editorId) || <span className="text-muted-foreground/40">Unassigned</span>)
                              : <span className="text-muted-foreground/30">—</span>}
                          </TableCell>

                          <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[110px] truncate">
                            {user.role === 'Mangaka'
                              ? (user.assignedAssistantName || getAssistantName(user.assistantId) || <span className="text-muted-foreground/40">Unassigned</span>)
                              : <span className="text-muted-foreground/30">—</span>}
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-center">
                        {user.status === 'Active' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Locked
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center shrink-0">
                        {user.role === 'Admin' ? (
                          <span className="text-[10px] text-muted-foreground italic">Admin</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => setViewingUser(user)}
                              variant="outline"
                              size="icon"
                              className="w-7 h-7 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              title="View Details"
                            >
                              <Info className="w-3 h-3" />
                            </Button>

                            <Button
                              onClick={() => setEditingUser(user)}
                              variant="outline"
                              size="icon"
                              className="w-7 h-7 rounded-lg border border-border hover:bg-primary/10 hover:text-primary cursor-pointer"
                              title="Edit Account"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>

                            {user.status === 'Active' ? (
                              <Button
                                onClick={() => handleToggleStatus(user.id, user.status || 'Active')}
                                variant="outline"
                                size="icon"
                                className="w-7 h-7 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-500/80 hover:text-rose-600 cursor-pointer"
                                title="Lock Account"
                              >
                                <UserX className="w-3 h-3" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-rose-600/85 font-semibold px-1">Locked</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Sub modals */}
      <ViewUserModal
        isOpen={viewingUser !== null}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        getEditorName={getEditorName}
        getAssistantName={getAssistantName}
      />

      <EditUserModal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        editors={editors}
        assistants={assistants}
        getEditorName={getEditorName}
        getAssistantName={getAssistantName}
        onSuccess={onRefreshUsers}
      />
    </div>
  )
}
