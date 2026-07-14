'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ImportVoteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formSeriesId: string
  setFormSeriesId: (id: string) => void
  formChapterId: string
  setFormChapterId: (id: string) => void
  formReaderCount: number
  setFormReaderCount: (count: number) => void
  formVoteCount: number
  setFormVoteCount: (count: number) => void
  formPeriod: string
  setFormPeriod: (period: string) => void
  allSeries: any[]
  availableChapters: any[]
  periods: string[]
  onSubmit: (e: React.FormEvent) => void
}

export default function ImportVoteDialog({
  isOpen,
  onOpenChange,
  formSeriesId,
  setFormSeriesId,
  formChapterId,
  setFormChapterId,
  formReaderCount,
  setFormReaderCount,
  formVoteCount,
  setFormVoteCount,
  formPeriod,
  setFormPeriod,
  allSeries,
  availableChapters,
  periods,
  onSubmit,
}: ImportVoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border rounded-xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Import Reader Vote Data
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-3">
          {/* Select Series */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Series</label>
            <select
              value={formSeriesId}
              onChange={(e) => {
                setFormSeriesId(e.target.value)
                setFormChapterId('')
              }}
              className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none text-foreground cursor-pointer"
              required
            >
              <option value="">-- Choose a Series --</option>
              {allSeries.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Select Chapter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Chapter</label>
            <select
              value={formChapterId}
              onChange={(e) => setFormChapterId(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none text-foreground cursor-pointer"
              disabled={!formSeriesId}
              required
            >
              <option value="">-- Choose a Chapter --</option>
              {availableChapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Select Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Period</label>
            <select
              value={formPeriod}
              onChange={(e) => setFormPeriod(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none text-foreground cursor-pointer"
              required
            >
              {periods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Input Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Readers</label>
              <input
                type="number"
                min="0"
                value={formReaderCount}
                onChange={(e) => setFormReaderCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Votes</label>
              <input
                type="number"
                min="0"
                value={formVoteCount}
                onChange={(e) => setFormVoteCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none text-foreground"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg mt-2 cursor-pointer transition-colors">
            Submit Vote Record
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
