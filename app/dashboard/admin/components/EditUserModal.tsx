'use client'

import { useState, useEffect } from 'react'
import { Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { type User } from '@/types/user'
import { userService } from '@/services/userService'
import { type RoleResponse } from '@/services/systemService'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  rolesList: RoleResponse[]
  onSuccess: () => void
}

export default function EditUserModal({ isOpen, onClose, user, rolesList, onSuccess }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setUsername(user.username || '')
      setEmail(user.email)
      const matchedRole = rolesList.find(r => r.roleName.toLowerCase() === user.role.toLowerCase())
      setRoleId(matchedRole?.roleId || '')
      setPassword('')
      setConfirmPassword('')
    }
  }, [user, rolesList])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim() || !username.trim() || !email.trim() || !roleId) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    if (password && password !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }

    if (password && password.length < 8) {
      toast.error('Mật khẩu mới phải có độ dài ít nhất 8 ký tự.')
      return
    }

    setUpdating(true)
    try {
      await userService.updateUser(user.id, {
        displayName: name.trim(),
        userName: username.trim(),
        email: email.trim(),
        roleId: roleId,
        newPassword: password ? password : undefined
      })

      toast.success(`Cập nhật tài khoản "${name}" thành công!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Cập nhật tài khoản thất bại.')
    } finally {
      setUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Chỉnh sửa thông tin tài khoản
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleEditSubmit} className="space-y-4 pt-3">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Họ và tên <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập họ và tên..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tên tài khoản (Username) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên tài khoản..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground font-mono"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Địa chỉ Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
              required
            />
          </div>

          {/* System Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Vai trò hệ thống <span className="text-destructive">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
              required
            >
              <option value="">-- Chọn vai trò --</option>
              {rolesList.map(role => (
                <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
              ))}
            </select>
          </div>

          {/* New Password */}
          <div className="space-y-1.5 border-t border-border/50 pt-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Mật khẩu mới (Tùy chọn)
            </label>
            <input
              type="password"
              placeholder="Để trống nếu không muốn đổi mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
            />
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              disabled={updating}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
              disabled={updating}
            >
              {updating ? 'Đang cập nhật...' : 'Cập nhật tài khoản'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
