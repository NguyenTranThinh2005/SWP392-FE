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

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setUsername(user.username || '')
      setEmail(user.email)
      setPassword('')
      setConfirmPassword('')
    }
  }, [user])

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

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Edit Account Information
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleEditSubmit} className="space-y-4 pt-3">
          {/* Full Name */}
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

          {/* Username */}
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

          {/* Email */}
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

          {/* New Password */}
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

          {/* Confirm New Password */}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
