'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  Users,
  UserPlus,
  Shield,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'

// Import components
import UserListTab from './components/UserListTab'
import CreateUserTab from './components/CreateUserTab'
import SystemManagementTab from './components/SystemManagementTab'

// Import utilities & types
import { type User } from '@/types/user'
import { userService } from '@/services/userService'
import { systemService, type RoleResponse, type GenreResponse } from '@/services/systemService'

export default function AdminPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // Core State variables
  const [usersList, setUsersList] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'system'>('list')
  const [rolesList, setRolesList] = useState<RoleResponse[]>([])
  const [genresList, setGenresList] = useState<GenreResponse[]>([])
  const [systemLoading, setSystemLoading] = useState(false)

  // Fetch Roles and Genres from Backend
  const refreshRolesAndGenres = useCallback(async () => {
    setSystemLoading(true)
    try {
      const [rData, gData] = await Promise.all([
        systemService.getRoles(),
        systemService.getGenres()
      ])
      setRolesList(rData)
      setGenresList(gData)
    } catch (err: any) {
      console.error("Failed to fetch roles or genres from backend", err)
      toast.error("Không thể tải danh sách vai trò hoặc thể loại từ hệ thống.")
      setRolesList([])
      setGenresList([])
    } finally {
      setSystemLoading(false)
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers()
      if (response && response.data) {
        const mappedUsers: User[] = response.data.map((u) => {
          const id = u.userId || "default"
          const role = u.roleName as any
          const status = u.deletedAt === null ? 'Active' : 'Inactive'

          const localUser: User = {
            id: u.userId,
            username: u.userName,
            name: u.displayName,
            email: u.email,
            role,
            status,
            avatarUrl: (u as any).avatarUrl || undefined,
            editorId: u.assignedEditorId || undefined,
            createdAt: u.createdAt
          }

          return localUser
        })

        setUsersList(mappedUsers)
      }
    } catch (err) {
      console.error("Failed to fetch users from backend", err)
      toast.error("Không thể kết nối API để lấy danh sách người dùng.")
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'system') {
      refreshRolesAndGenres()
    }
  }, [activeTab, refreshRolesAndGenres])

  useEffect(() => {
    setMounted(true)
    refreshUsers()
    refreshRolesAndGenres()
  }, [refreshUsers, refreshRolesAndGenres])

  // Get available Editors for dropdown
  const editors = useMemo(() => {
    return usersList.filter(u => u.role === 'TantouEditor' && u.status === 'Active')
  }, [usersList])

  // Look up editor name helper
  const getEditorName = useCallback((editorId?: string) => {
    if (!editorId) return 'Chưa gán'
    const ed = usersList.find(u => u.id === editorId)
    return ed ? ed.name : 'Không xác định'
  }, [usersList])

  if (!mounted) return null

  // Security Gate: Ensure user role is Admin to access
  if (role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-xl max-w-md mx-auto text-center space-y-5 shadow-lg my-12">
        <div className="w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Shield className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chỉ tài khoản hoạt động với vai trò <strong>Admin</strong> mới được phép truy cập trang này.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            {role === 'Admin' ? 'Quản trị Tài khoản' : 'Danh sách Thành viên'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === 'Admin'
              ? 'Thiết lập tài khoản nội bộ và phân quyền vai trò cho hệ thống'
              : 'Xem danh sách tác giả, trợ lý vẽ và biên tập viên phụ trách trong hệ thống'}
          </p>
        </div>

        {/* Tab Buttons (Only for Admin) */}
        {role === 'Admin' && (
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl shrink-0 w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <Users className="w-3.5 h-3.5" /> Danh sách Tài khoản
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Tạo Tài khoản mới
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'system'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <Layers className="w-3.5 h-3.5" /> Quản lý Hệ thống
            </button>
          </div>
        )}
      </div>

      {activeTab === 'list' && (
        <UserListTab
          usersList={usersList}
          role={role}
          rolesList={rolesList}
          editors={editors}
          getEditorName={getEditorName}
          onRefreshUsers={refreshUsers}
        />
      )}

      {activeTab === 'create' && (
        <CreateUserTab
          rolesList={rolesList}
          editors={editors}
          onSuccess={() => {
            refreshUsers()
            setActiveTab('list')
          }}
        />
      )}

      {activeTab === 'system' && (
        <SystemManagementTab
          genresList={genresList}
          systemLoading={systemLoading}
          onRefresh={refreshRolesAndGenres}
        />
      )}
    </div>
  )
}
