'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface PeriodTabsProps {
  periods: string[]
  selectedPeriod: string
  onSelectPeriod: (period: string) => void
  onAddPeriod?: (newPeriod: string) => void
  isAuthorized?: boolean
}

export default function PeriodTabs({
  periods,
  selectedPeriod,
  onSelectPeriod,
  onAddPeriod,
  isAuthorized = true,
}: PeriodTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedQ, setSelectedQ] = useState<string>('Q3')

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleAddQuarter = (e: React.FormEvent) => {
    e.preventDefault()
    const newPeriod = `${selectedYear}-${selectedQ}`
    if (periods.includes(newPeriod)) {
      toast.info(`Period "${newPeriod}" already exists!`)
      onSelectPeriod(newPeriod)
      setIsAddDialogOpen(false)
      return
    }

    if (onAddPeriod) {
      onAddPeriod(newPeriod)
    }
    onSelectPeriod(newPeriod)
    toast.success(`Created period "${newPeriod}" successfully!`)
    setIsAddDialogOpen(false)
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-full">
      {/* Scroll Left Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleScroll('left')}
        className="h-9 w-9 shrink-0 rounded-lg border-border hover:bg-accent text-foreground cursor-pointer transition-all shadow-sm"
        title="Scroll Left"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Tabs Carousel Container */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {periods.map(p => {
            const isActive = selectedPeriod === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onSelectPeriod(p)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scroll Right Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleScroll('right')}
        className="h-9 w-9 shrink-0 rounded-lg border-border hover:bg-accent text-foreground cursor-pointer transition-all shadow-sm"
        title="Scroll Right"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Add New Quarter Button */}
      {isAuthorized && onAddPeriod && (
        <Button
          type="button"
          onClick={() => setIsAddDialogOpen(true)}
          className="h-9 px-3.5 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Quarter</span>
        </Button>
      )}

      {/* Create Quarter Modal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border border-border rounded-xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Create New Ranking Period
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddQuarter} className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/65 border border-border rounded-lg text-sm font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Array.from({ length: 6 }, (_, i) => 2024 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quarter</label>
                <select
                  value={selectedQ}
                  onChange={(e) => setSelectedQ(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/65 border border-border rounded-lg text-sm font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-muted/40 border border-border/80 rounded-lg text-center">
              <span className="text-xs text-muted-foreground">New Period Preview: </span>
              <strong className="text-sm font-bold text-primary ml-1">{selectedYear}-{selectedQ}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="text-xs font-semibold px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2"
              >
                Create Period
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
