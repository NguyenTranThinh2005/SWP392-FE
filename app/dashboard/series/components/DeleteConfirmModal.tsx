'use client'

import { Trash2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-base">Delete Draft?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This draft proposal will be permanently removed. This action
              cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
