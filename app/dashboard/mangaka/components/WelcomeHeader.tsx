'use client'

import { AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'

interface AssignedEditor {
  name: string
  email: string
}

interface WelcomeHeaderProps {
  mangakaName: string
  assignedEditor: AssignedEditor | null
  isBlocked: boolean
}

export default function WelcomeHeader({
  mangakaName,
  assignedEditor,
  isBlocked,
}: WelcomeHeaderProps) {
  return (
    <div className="relative overflow-hidden border border-border/40 rounded-2xl p-7 bg-card">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back, {mangakaName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your series proposals and track their review status.
          </p>
          {assignedEditor && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl text-xs font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Assigned Editor:{' '}
                <strong className="text-foreground">{assignedEditor.name}</strong>{' '}
                {assignedEditor.email ? `(${assignedEditor.email})` : ''}
              </span>
            </div>
          )}
        </div>

        {isBlocked ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-600 shrink-0">
            <AlertTriangle className="w-4 h-4" />
            Pending proposal under review — new submissions temporarily locked
          </div>
        ) : (
          <Link
            href="/dashboard/series/new"
            className="inline-flex items-center gap-2 shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </Link>
        )}
      </div>
    </div>
  )
}
