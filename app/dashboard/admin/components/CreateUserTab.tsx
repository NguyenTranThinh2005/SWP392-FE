'use client'

import { useState, useMemo, useEffect } from 'react'
import { UserPlus, User as UserIcon, Mail, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { authService } from '@/services/authService'
import { type RoleResponse } from '@/services/systemService'
import { type User } from '@/types/user'

interface CreateUserTabProps {
  rolesList: RoleResponse[]
  editors: User[]
  onSuccess: () => void
}

export default function CreateUserTab({ rolesList, editors, onSuccess }: CreateUserTabProps) {
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRoleId, setFormRoleId] = useState('')
  const [formEditorId, setFormEditorId] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirmPassword, setFormConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Initialize formRoleId to default (mangaka or first item)
  useEffect(() => {
    if (rolesList.length > 0 && !formRoleId) {
      const defaultRole = rolesList.find(r => r.roleName.toLowerCase() === 'mangaka') || rolesList[0]
      setFormRoleId(defaultRole.roleId)
    }
  }, [rolesList, formRoleId])

  const selectedFormRoleName = useMemo(() => {
    return rolesList.find(r => r.roleId === formRoleId)?.roleName || ''
  }, [rolesList, formRoleId])

  const isMangakaSelected = selectedFormRoleName.toLowerCase() === 'mangaka'

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim() || !formUsername.trim() || !formEmail.trim() || !formPassword) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (formPassword !== formConfirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (formPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)
    try {
      const selectedRoleObj = rolesList.find(r => r.roleId === formRoleId)
      if (!selectedRoleObj) {
        toast.error('Please select a valid system role.')
        return
      }
      const selectedRoleName = selectedRoleObj.roleName
      const isMangaka = selectedRoleName.toLowerCase() === 'mangaka'

      await authService.register({
        userName: formUsername.trim(),
        email: formEmail.trim(),
        displayName: formName.trim(),
        password: formPassword,
        roleId: formRoleId,
        assignedFromUserId: isMangaka && formEditorId.trim() ? formEditorId.trim() : undefined
      })

      toast.success(`Account "${formName}" created successfully!`)

      // Reset Form
      setFormName('')
      setFormUsername('')
      setFormEmail('')
      const defaultRole = rolesList.find(r => r.roleName.toLowerCase() === 'mangaka') || rolesList[0]
      setFormRoleId(defaultRole?.roleId || '')
      setFormEditorId('')
      setFormPassword('')
      setFormConfirmPassword('')

      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 bg-card border border-border rounded-xl shadow-lg animate-in fade-in duration-200">
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
        <UserPlus className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Create New User Account</h2>
      </div>

      <form onSubmit={handleCreateAccount} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" /> Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Example: Takeshi Obata"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" /> Username <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Example: obata_mangaka"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            placeholder="Example: obata@mangaflow.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              System Role <span className="text-destructive">*</span>
            </label>
            <select
              value={formRoleId}
              onChange={(e) => {
                setFormRoleId(e.target.value)
                setFormEditorId('')
              }}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
            >
              <option value="" disabled>-- Select Role --</option>
              {rolesList.map(r => (
                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
              ))}
            </select>
          </div>

          {/* Conditionally Render Editor Assignment Dropdown (if role === Mangaka) */}
          {isMangakaSelected && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-primary" /> Select Responsible Tantou Editor <span className="text-destructive">*</span>
              </label>
              <select
                value={formEditorId}
                onChange={(e) => setFormEditorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
                required
              >
                <option value="">-- Select Tantou Editor --</option>
                {editors.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.name} ({ed.username})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground focus:border-primary/50"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formConfirmPassword}
              onChange={(e) => setFormConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground focus:border-primary/50"
              required
            />
          </div>
        </div>

        {/* Create Button */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl mt-4 cursor-pointer transition-all"
        >
          {submitting ? 'Creating...' : 'Create New Account'}
        </Button>
      </form>
    </Card>
  )
}
