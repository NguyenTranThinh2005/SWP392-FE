'use client'

import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type User } from '@/types/user'

interface ViewUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  getEditorName: (editorId?: string) => string
}

export default function ViewUserModal({ isOpen, onClose, user, getEditorName }: ViewUserModalProps) {
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Chi tiết tài khoản
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-sm">
          <div className="flex justify-center pb-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-md"
              />
            ) : (
              <div className="bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-border shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
            <span className="text-muted-foreground font-semibold">Họ và tên:</span>
            <span className="col-span-2 text-foreground font-bold">{user.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground font-semibold">Tên tài khoản:</span>
            <span className="col-span-2 text-foreground font-mono">{user.username}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground font-semibold">Email:</span>
            <span className="col-span-2 text-foreground break-all">{user.email}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground font-semibold">Vai trò:</span>
            <span className="col-span-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-2.5 py-0.5 rounded-full border">
                {user.role}
              </Badge>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground font-semibold">Ngày tạo:</span>
            <span className="col-span-2 text-foreground">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '—'}
            </span>
          </div>

          {user.role === 'Mangaka' && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground font-semibold">Editor phụ trách:</span>
              <span className="col-span-2 text-foreground font-bold">{getEditorName(user.editorId)}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground font-semibold">Trạng thái:</span>
            <span className="col-span-2">
              {user.status === 'Active' ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  Hoạt động
                </Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  Đã khóa
                </Badge>
              )}
            </span>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={onClose}
              className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
