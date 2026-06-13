import { type Role } from './roles'
import { fetchAPI } from '@/services/api'
import { userService } from '@/services/userService'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: Role
  status: 'Active' | 'Inactive'
  avatarUrl: string
  editorId?: string
}

const STORAGE_USERS_KEY = 'mangaflow_users'

export const SEED_USERS: User[] = []

export function loadUsers(): User[] {
  if (typeof window === 'undefined') return SEED_USERS
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS))
      return SEED_USERS
    }
    return JSON.parse(raw) as User[]
  } catch {
    return SEED_USERS
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
}

export function getUsers(): User[] {
  return loadUsers()
}

export function getUserById(id: string): User | undefined {
  return loadUsers().find(u => u.id === id)
}

export function getUsersByRole(role: Role): User[] {
  return loadUsers().filter(u => u.role === role)
}

export function createUser(data: Omit<User, 'id' | 'status' | 'avatarUrl'>): User {
  const users = loadUsers()

  const nextNum = users.length + 12
  const nextId = `U${String(nextNum).padStart(2, '0')}`
  const avatarUrl = `https://xsgames.co/randomusers/assets/avatars/${nextNum % 2 === 0 ? 'male' : 'female'}/${nextNum % 50}.jpg`

  const newUser: User = {
    ...data,
    id: nextId,
    status: 'Active',
    avatarUrl
  }

  users.push(newUser)
  saveUsers(users)

  if (typeof window !== 'undefined') {
    fetchAPI<{ data: any[] }>('/api/roles', { suppressGlobalError: true } as any).then(res => {
      const roles = res.data || []
      const matchedRole = roles.find(r => r.roleName?.toLowerCase() === data.role?.toLowerCase()) || roles[0]
      
      if (matchedRole) {
        const payload = {
          userName: data.username,
          email: data.email,
          displayName: data.name,
          password: "Password123@",
          roleId: matchedRole.roleId
        }
        
        fetchAPI<any>('/api/auth/register', {
          method: 'POST',
          suppressGlobalError: true,
          body: JSON.stringify(payload)
        } as any).then((resRegister: any) => {
          const registered = resRegister.data || resRegister
          if (registered) {
            const currentUsers = loadUsers()
            const foundIdx = currentUsers.findIndex(u => u.id === newUser.id)
            if (foundIdx !== -1) {
              currentUsers[foundIdx].id = registered.id || registered.userId
              saveUsers(currentUsers)
            }
          }
        }).catch(err => {
          console.warn("Failed to register user on backend:", err)
        })
      }
    }).catch(err => {
      console.warn("Failed to fetch roles for user creation:", err)
    })
  }

  return newUser
}

export function updateUserStatus(id: string, status: 'Active' | 'Inactive'): boolean {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return false

  users[idx].status = status
  saveUsers(users)

  if (typeof window !== 'undefined' && status === 'Inactive') {
    userService.deleteUser(id).then(res => {
      console.log("Soft-deleted user on backend successfully", res)
    }).catch(err => {
      console.warn("Failed to soft-delete user on backend:", err)
    })
  }

  return true
}

export function assignEditorToMangaka(mangakaId: string, editorId: string): boolean {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === mangakaId)
  if (idx === -1) return false

  if (users[idx].role !== 'Mangaka') {
    throw new Error('Chỉ có thể gán Editor cho tài khoản có vai trò Mangaka.')
  }

  if (editorId) {
    const editor = users.find(u => u.id === editorId)
    if (!editor || editor.role !== 'TantouEditor') {
      throw new Error('Tài khoản editor được gán không hợp lệ hoặc không phải là TantouEditor.')
    }
  }

  users[idx].editorId = editorId || undefined
  saveUsers(users)
  return true
}

const mapBackendUser = (u: any): User => {
  return {
    id: u.userId || u.id,
    username: u.userName || u.username,
    name: u.displayName || u.name || u.userName || u.username,
    email: u.email,
    role: (u.roleName || u.role) as Role,
    status: u.isActive || u.status === 'Active' ? 'Active' : 'Inactive',
    avatarUrl: u.avatarUrl || `https://xsgames.co/randomusers/assets/avatars/${(u.roleName || u.role)?.toLowerCase() === 'assistant' ? 'female' : 'male'}/${(u.userId?.charCodeAt(0) || 1) % 50}.jpg`,
    editorId: u.assignedEditorId || u.editorId || undefined
  }
}

export async function syncUsersFromBackend(): Promise<User[]> {
  try {
    const res = await userService.getUsers(true)
    if (res && res.data) {
      const mapped = res.data.map(mapBackendUser)
      saveUsers(mapped)
      return mapped
    }
  } catch (error) {
    console.warn("syncUsersFromBackend failed:", error)
  }
  return getUsers()
}
