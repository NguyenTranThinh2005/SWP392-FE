'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seriesProposalSchema, type SeriesProposalInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface SeriesProposalFormProps {
  onSubmit: (data: SeriesProposalInput) => Promise<void>
  isLoading?: boolean
}

const ALL_GENRES = [
  'Action', 'Adventure', 'Avant Garde', 'Boys Love',
  'Comedy', 'Demons', 'Drama', 'Ecchi',
  'Fantasy', 'Girls Love', 'Gourmet', 'Harem',
  'Horror', 'Isekai', 'Iyashikei', 'Josei',
  'Kids', 'Magic', 'Mahou Shoujo', 'Martial Arts',
  'Mecha', 'Military', 'Music', 'Mystery',
  'Parody', 'Psychological', 'Reverse Harem', 'Romance',
  'School', 'Sci-Fi', 'Seinen', 'Shoujo',
  'Shounen', 'Slice of Life', 'Space', 'Sports',
  'Super Power', 'Supernatural', 'Suspense', 'Thriller',
  'Vampire'
]

export function SeriesProposalForm({ onSubmit, isLoading }: SeriesProposalFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [mustHaveAll, setMustHaveAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SeriesProposalInput>({
    resolver: zodResolver(seriesProposalSchema),
    defaultValues: {
      title: '',
      genre: '',
      publicationType: 'Weekly',
      description: '',
      coverImageUrl: '',
    }
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenreToggle = (g: string) => {
    let nextGenres: string[]
    if (selectedGenres.includes(g)) {
      nextGenres = selectedGenres.filter((item) => item !== g)
    } else {
      nextGenres = [...selectedGenres, g]
    }
    setSelectedGenres(nextGenres)
    setValue('genre', nextGenres.join(', '), { shouldValidate: true })
  }

  const handleFormSubmit = async (data: SeriesProposalInput) => {
    try {
      setError(null)
      // Append tag option if necessary or proceed
      const finalData = { ...data }
      await onSubmit(finalData)
      reset()
      setSelectedGenres([])
      setMustHaveAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit proposal')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 max-w-2xl bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Create Series Proposal</h2>
        <p className="text-xs text-muted-foreground mt-1">Submit a new serialized manga pitch for review</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Title Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground/80">Title</label>
        <input 
          {...register('title')} 
          placeholder="Enter series title" 
          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          disabled={isLoading}
        />
        {errors.title && <span className="text-destructive text-xs font-semibold">{errors.title.message}</span>}
      </div>

      {/* Genre Field (Custom Popover) */}
      <div className="space-y-1.5 relative" ref={dropdownRef}>
        <label className="text-sm font-semibold text-foreground/80">Genre</label>
        
        {/* Hidden input to register genre with react-hook-form */}
        <input type="hidden" {...register('genre')} />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-card border rounded-xl text-sm transition-all focus:outline-none ${
            isOpen 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'border-border hover:bg-muted/50'
          }`}
          disabled={isLoading}
        >
          <span className="truncate text-foreground/90">
            {selectedGenres.length > 0
              ? selectedGenres.join(', ')
              : 'Select genres'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute left-0 right-0 md:left-auto md:w-[600px] z-50 mt-1 bg-card border border-border rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Grid of checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
              {ALL_GENRES.map((g) => {
                const isChecked = selectedGenres.includes(g)
                return (
                  <label
                    key={g}
                    className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer transition-colors text-xs select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleGenreToggle(g)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 bg-background"
                    />
                    <span className={isChecked ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                      {g}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Separator line & Must Have All */}
            <div className="border-t border-border pt-2">
              <label className="flex items-center gap-2 text-emerald-600 hover:text-emerald-500 cursor-pointer select-none text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={mustHaveAll}
                  onChange={(e) => setMustHaveAll(e.target.checked)}
                  className="rounded border-emerald-500/30 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 bg-background"
                />
                Must have all the selected genres
              </label>
            </div>
          </div>
        )}

        {errors.genre && <span className="text-destructive text-xs font-semibold block">{errors.genre.message}</span>}
      </div>

      {/* Publication Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground/80">Publication Type</label>
        <select 
          {...register('publicationType')} 
          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          disabled={isLoading}
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="One-shot">One-shot</option>
        </select>
        {errors.publicationType && <span className="text-destructive text-xs font-semibold">{errors.publicationType.message}</span>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground/80">Description</label>
        <textarea
          {...register('description')}
          placeholder="Describe your manga series story arc, target audience..."
          rows={4}
          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60 resize-y"
          disabled={isLoading}
        />
        {errors.description && <span className="text-destructive text-xs font-semibold">{errors.description.message}</span>}
      </div>

      {/* Cover Image URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground/80">Cover Image URL (optional)</label>
        <input
          {...register('coverImageUrl')}
          placeholder="https://example.com/cover.jpg"
          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          disabled={isLoading}
        />
        {errors.coverImageUrl && <span className="text-destructive text-xs font-semibold">{errors.coverImageUrl.message}</span>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full py-2.5 font-bold shadow-sm rounded-xl">
        {isLoading ? 'Submitting...' : 'Submit Proposal'}
      </Button>
    </form>
  )
}
