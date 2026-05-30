'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seriesProposalSchema, type SeriesProposalInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle, BookOpen, FileText } from 'lucide-react'

interface SeriesProposalFormProps {
  onSubmit: (data: SeriesProposalInput, action: 'draft' | 'submit') => Promise<void>
  isLoading?: boolean
  /** If provided, block both buttons and show warning (BR-19) */
  hasActivePendingProposal?: boolean
  defaultValues?: Partial<SeriesProposalInput>
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

const SYNOPSIS_MIN = 200
const SYNOPSIS_MAX = 2000

export function SeriesProposalForm({
  onSubmit,
  isLoading,
  hasActivePendingProposal = false,
  defaultValues,
}: SeriesProposalFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'draft' | 'submit'>('submit')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    defaultValues?.genre ? defaultValues.genre.split(', ').filter(Boolean) : []
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SeriesProposalInput>({
    resolver: zodResolver(seriesProposalSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      genre: defaultValues?.genre ?? '',
      publicationType: defaultValues?.publicationType ?? 'Weekly',
      synopsis: defaultValues?.synopsis ?? '',
      samplePages: defaultValues?.samplePages ?? 5,
      coverImageUrl: defaultValues?.coverImageUrl ?? '',
    },
  })

  const synopsisValue = watch('synopsis') ?? ''
  const titleValue = watch('title') ?? ''

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
      await onSubmit(data, action)
      reset()
      setSelectedGenres([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    }
  }

  // Synopsis progress colour
  const synopsisLen = synopsisValue.length
  const synopsisReady = synopsisLen >= SYNOPSIS_MIN
  const synopsisProgressPercent = Math.min((synopsisLen / SYNOPSIS_MAX) * 100, 100)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* BR-19 block banner */}
      {hasActivePendingProposal && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">Active proposal already exists</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              You already have a proposal in <span className="font-semibold">Pending Review</span> or{' '}
              <span className="font-semibold">Under Review</span>. You cannot submit or save another
              until the current one is resolved. (BR-19)
            </p>
          </div>
        </div>
      )}

      {/* API / network error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title Field */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">
              Title <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {titleValue.length}/100
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="Enter series title..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading || hasActivePendingProposal}
          />
          {errors.title && (
            <span className="text-destructive text-xs font-semibold">{errors.title.message}</span>
          )}
        </div>

        {/* Genre Field (Custom Multi-select Popover) */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label className="text-sm font-semibold text-foreground/80">
            Genre <span className="text-destructive">*</span>
          </label>

          {/* Hidden input to register genre with react-hook-form */}
          <input type="hidden" {...register('genre')} />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-background border rounded-xl text-sm transition-all focus:outline-none ${isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-muted/50'
              } ${hasActivePendingProposal || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasActivePendingProposal}
          >
            <span className="truncate text-foreground/90">
              {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select genres…'}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute left-0 right-0 md:left-auto md:w-[560px] z-50 mt-1 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
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
              {selectedGenres.length > 0 && (
                <div className="border-t border-border pt-2 flex flex-wrap gap-1.5">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      onClick={() => handleGenreToggle(g)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {g} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {errors.genre && (
            <span className="text-destructive text-xs font-semibold block">{errors.genre.message}</span>
          )}
        </div>

        {/* Publication Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80">
            Publication Type <span className="text-destructive">*</span>
          </label>
          <select
            {...register('publicationType')}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            disabled={isLoading || hasActivePendingProposal}
          >
            <option value="Weekly">Weekly</option>
            <option value="Bi-Weekly">Bi-Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="One-Shot">One-Shot</option>
          </select>
          {errors.publicationType && (
            <span className="text-destructive text-xs font-semibold">{errors.publicationType.message}</span>
          )}
        </div>
      </div>

      {/* Synopsis — BR-15: 200–2000 chars */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">
            Synopsis <span className="text-destructive">*</span>
          </label>
          <span className={`text-[11px] font-mono font-semibold ${synopsisReady ? 'text-emerald-600' : 'text-amber-500'}`}>
            {synopsisLen}/{SYNOPSIS_MAX}
            {!synopsisReady && ` (min ${SYNOPSIS_MIN})`}
          </span>
        </div>
        <textarea
          {...register('synopsis')}
          placeholder="Describe your series story arc, main characters, themes, and target audience…"
          rows={6}
          className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-none"
          disabled={isLoading || hasActivePendingProposal}
        />
        {/* Synopsis progress bar */}
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${synopsisReady ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${synopsisProgressPercent}%` }}
          />
        </div>
        {errors.synopsis && (
          <span className="text-destructive text-xs font-semibold">{errors.synopsis.message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sample Pages — BR-15: ≥ 5 */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Sample Pages <span className="text-destructive">*</span>
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(min 5)</span>
          </label>
          <input
            {...register('samplePages', { valueAsNumber: true })}
            type="number"
            min={5}
            defaultValue={5}
            className="w-32 px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            disabled={isLoading || hasActivePendingProposal}
          />
          {errors.samplePages && (
            <span className="text-destructive text-xs font-semibold">{errors.samplePages.message}</span>
          )}
        </div>

        {/* Cover Image URL (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Cover Image URL
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(optional)</span>
          </label>
          <input
            {...register('coverImageUrl')}
            placeholder="https://example.com/cover.jpg"
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading || hasActivePendingProposal}
          />
          {errors.coverImageUrl && (
            <span className="text-destructive text-xs font-semibold">{errors.coverImageUrl.message}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Save Draft — no validation, no BR-19 block for draft intent display */}
        <Button
          type="submit"
          variant="outline"
          onClick={() => setAction('draft')}
          disabled={isLoading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-semibold rounded-xl border-border"
        >
          {isLoading && action === 'draft' ? 'Saving…' : 'Save as Draft'}
        </Button>

        {/* Submit for Review */}
        <Button
          type="submit"
          onClick={() => setAction('submit')}
          disabled={isLoading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-bold rounded-xl shadow-sm"
        >
          {isLoading && action === 'submit' ? 'Submitting…' : 'Submit for Review'}
        </Button>
      </div>
    </form>
  )
}
