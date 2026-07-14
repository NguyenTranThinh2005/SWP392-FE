'use client'

interface PeriodTabsProps {
  periods: string[]
  selectedPeriod: string
  onSelectPeriod: (period: string) => void
}

export default function PeriodTabs({
  periods,
  selectedPeriod,
  onSelectPeriod,
}: PeriodTabsProps) {
  return (
    <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-lg w-fit">
      {periods.map(p => {
        const isActive = selectedPeriod === p
        return (
          <button
            key={p}
            onClick={() => onSelectPeriod(p)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
