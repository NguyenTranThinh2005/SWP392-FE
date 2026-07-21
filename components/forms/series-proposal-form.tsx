'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seriesProposalSchema, type SeriesProposalInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle, BookOpen, FileText, Upload, X } from 'lucide-react'
import { API_BASE_URL } from '@/lib/constants'
import { systemService } from '@/services/systemService'
import { toast } from 'sonner'
import { fetchAPI } from '@/services/api'

const uploadSourceArchiveToBackend = async (file: File): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append('category', '1'); // 1 is ProposalSource
  formData.append('files', file);

  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    let errMsg = "Uploading source ZIP/RAR file failed.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch { }
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);

  if (fileAssetIds.length === 0) {
    throw new Error("Could not find file asset ID for source ZIP/RAR file.");
  }

  return fileAssetIds[0];
};

const uploadCoverImageToBackend = async (file: File): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append('category', '2'); // 2 is ProposalSamplePage (supports image formats)
  formData.append('files', file);

  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    let errMsg = "Uploading cover image failed.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch { }
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);

  if (fileAssetIds.length === 0) {
    throw new Error("Could not find file asset ID for cover image.");
  }

  return fileAssetIds[0];
};

interface SeriesProposalFormProps {
  onSubmit: (data: SeriesProposalInput, action: 'draft' | 'submit') => Promise<void>
  isLoading?: boolean
  /** If provided, block both buttons and show warning */
  hasActivePendingProposal?: boolean
  defaultValues?: Partial<SeriesProposalInput> & { sourceZipPublicUrl?: string | null }
}

const SYNOPSIS_MIN = 100
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
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    defaultValues?.genre ? defaultValues.genre.split(', ').filter(Boolean) : []
  )
  const [sourceZipFile, setSourceZipFile] = useState<File | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(
    defaultValues?.coverImagePublicUrl ?? ''
  )
  const [sampleFiles, setSampleFiles] = useState<File[]>([])
  const [samplePreviewUrls, setSamplePreviewUrls] = useState<string[]>(
    defaultValues?.sampleFileUrl ? defaultValues.sampleFileUrl.split(',').map(s => s.trim()).filter(Boolean) : []
  )
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDownloadSourceZip = async () => {
    if (!sourceZipFileAssetIdValue) return
    setIsDownloadingZip(true)
    try {
      const res = await fetchAPI<{ data: any }>(`/api/files/${sourceZipFileAssetIdValue}`)
      const fileAsset = res.data || res
      const publicUrl = fileAsset.publicUrl || fileAsset.PublicUrl
      if (publicUrl) {
        window.open(publicUrl, '_blank')
      } else {
        toast.error('Download URL not found.')
      }
    } catch (err: any) {
      console.error('Failed to download ZIP file:', err)
      toast.error(err.message || 'Could not download file.')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  useEffect(() => {
    let active = true
    async function loadGenres() {
      try {
        const list = await systemService.getGenres()
        if (active) {
          const activeGenres = list.filter(g => !g.deletedAt).map(g => g.title)
          setGenres(activeGenres)
        }
      } catch (err) {
        console.error('Failed to load genres from API:', err)
      }
    }
    loadGenres()
    return () => {
      active = false
    }
  }, [])

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
      sampleFileUrl: defaultValues?.sampleFileUrl ?? '',
      coverImagePublicUrl: defaultValues?.coverImagePublicUrl ?? '',
      sourceZipFileAssetId: defaultValues?.sourceZipFileAssetId ?? null,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title ?? '',
        genre: defaultValues.genre ?? '',
        publicationType: defaultValues.publicationType ?? 'Weekly',
        synopsis: defaultValues.synopsis ?? '',
        sampleFileUrl: defaultValues.sampleFileUrl ?? '',
        coverImagePublicUrl: defaultValues.coverImagePublicUrl ?? '',
        sourceZipFileAssetId: defaultValues.sourceZipFileAssetId ?? null,
      })
      if (defaultValues.genre) {
        setSelectedGenres(defaultValues.genre.split(', ').filter(Boolean))
      }
      setCoverPreviewUrl(defaultValues.coverImagePublicUrl ?? '')
      if (defaultValues.sampleFileUrl) {
        setSamplePreviewUrls(defaultValues.sampleFileUrl.split(',').map(s => s.trim()).filter(Boolean))
      } else {
        setSamplePreviewUrls([])
      }
      setSampleFiles([])
    }
  }, [defaultValues, reset])

  useEffect(() => {
    return () => {
      if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
      samplePreviewUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [coverPreviewUrl, samplePreviewUrls])

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, JPEG).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Cover image size must not exceed 5MB.')
        return
      }
      setCoverImageFile(file)
      setError(null)
      const localUrl = URL.createObjectURL(file)
      setCoverPreviewUrl(localUrl)
    }
  }

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null)
    if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
    setCoverPreviewUrl('')
    setValue('coverImagePublicUrl', '')
  }

  const handleSampleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    const newPreviewUrls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files (PNG, JPG, JPEG) for sample pages.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Sample page image size must not exceed 5MB.')
        return
      }
      validFiles.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    }

    setError(null)
    setSampleFiles((prev) => [...prev, ...validFiles])
    setSamplePreviewUrls((prev) => [...prev, ...newPreviewUrls])
  }

  const handleRemoveSamplePage = (index: number) => {
    const urlToRemove = samplePreviewUrls[index]
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove)
      let fileIdx = 0
      for (let i = 0; i < index; i++) {
        if (samplePreviewUrls[i].startsWith('blob:')) {
          fileIdx++
        }
      }
      setSampleFiles((prev) => prev.filter((_, idx) => idx !== fileIdx))
    }

    const newUrls = samplePreviewUrls.filter((_, idx) => idx !== index)
    setSamplePreviewUrls(newUrls)
    setValue('sampleFileUrl', newUrls.filter((url) => !url.startsWith('blob:')).join(','))
  }

  const synopsisValue = watch('synopsis') ?? ''
  const titleValue = watch('title') ?? ''
  const sourceZipFileAssetIdValue = watch('sourceZipFileAssetId') ?? null

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
      const finalData = { ...data }

      if (action === 'submit') {
        if (!sourceZipFile && !data.sourceZipFileAssetId) {
          setError('Please upload a manuscript ZIP/RAR file.')
          return
        }
      }

      setIsUploading(true)

      try {
        if (coverImageFile) {
          const coverAssetId = await uploadCoverImageToBackend(coverImageFile)
          const coverUrl = `${API_BASE_URL}/api/files/${coverAssetId}`
          finalData.coverImagePublicUrl = coverUrl
          setValue('coverImagePublicUrl', coverUrl)
        }

        if (sourceZipFile) {
          const zipAssetId = await uploadSourceArchiveToBackend(sourceZipFile)
          finalData.sourceZipFileAssetId = zipAssetId
          setValue('sourceZipFileAssetId', zipAssetId)
        }

        // Upload newly added sample pages (using uploadCoverImageToBackend as category 2 is ProposalSamplePage)
        const uploadedSampleUrls: string[] = []
        for (const file of sampleFiles) {
          const sampleAssetId = await uploadCoverImageToBackend(file)
          const sampleUrl = `${API_BASE_URL}/api/files/${sampleAssetId}`
          uploadedSampleUrls.push(sampleUrl)
        }

        // Combine previously saved remote URLs with newly uploaded ones
        const savedSampleUrls = samplePreviewUrls.filter((url) => !url.startsWith('blob:'))
        const finalSampleUrls = [...savedSampleUrls, ...uploadedSampleUrls]

        finalData.sampleFileUrl = finalSampleUrls.join(',')
        setValue('sampleFileUrl', finalSampleUrls.join(','))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file.')
        return
      } finally {
        setIsUploading(false)
      }

      await onSubmit(finalData, action)
      reset()
      setSourceZipFile(null)
      setCoverImageFile(null)
      setCoverPreviewUrl('')
      setSelectedGenres([])
      setSampleFiles([])
      setSamplePreviewUrls([])
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

      {/* block banner */}
      {hasActivePendingProposal && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">An active proposal is in progress</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              You already have a proposal in <span className="font-semibold">Pending Review</span> or{' '}
              <span className="font-semibold">Under Review</span> status. You cannot submit or save another proposal
              until the current proposal is processed.
            </p>
          </div>
        </div>
      )}

      {/* API / network error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title Field */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">
              Series Title <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {titleValue.length}/100
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="Enter series title..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-background border rounded-lg text-sm transition-all focus:outline-none ${isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-muted/50'
              } ${hasActivePendingProposal || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasActivePendingProposal}
          >
            <span className="truncate text-foreground/90">
              {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select genre…'}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute left-0 right-0 md:left-auto md:w-[560px] z-50 mt-1 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
                {genres.map((g) => {
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
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            disabled={isLoading || hasActivePendingProposal}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="One-Shot">One-Shot</option>
          </select>
          {errors.publicationType && (
            <span className="text-destructive text-xs font-semibold">{errors.publicationType.message}</span>
          )}
        </div>
      </div>

      {/* Synopsis — 200–2000 chars */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">
            Synopsis <span className="text-destructive">*</span>
          </label>
          <span className={`text-[11px] font-mono font-semibold ${synopsisReady ? 'text-emerald-600' : 'text-amber-500'}`}>
            {synopsisLen}/{SYNOPSIS_MAX}
            {!synopsisReady && ` (minimum ${SYNOPSIS_MIN})`}
          </span>
        </div>
        <textarea
          {...register('synopsis')}
          placeholder="Describe plot progression, main characters, themes, and target audience..."
          rows={6}
          className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-none"
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

      {/* Source ZIP File & Cover Image URL Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source ZIP File Input (Required) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Manuscript Document (ZIP/RAR) <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="sourceZipFile"
              accept=".zip,.rar"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setSourceZipFile(file)
              }}
              className="hidden"
              disabled={isLoading || isUploading || hasActivePendingProposal}
            />
            <label
              htmlFor="sourceZipFile"
              className={`px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-muted/50 transition-colors ${isLoading || isUploading || hasActivePendingProposal ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
              Choose ZIP/RAR file
            </label>
            {sourceZipFile ? (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {sourceZipFile.name}
              </span>
            ) : sourceZipFileAssetIdValue ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-semibold">ZIP/RAR file uploaded</span>
                <button
                  type="button"
                  onClick={handleDownloadSourceZip}
                  disabled={isDownloadingZip}
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingZip ? '(Downloading...)' : '(Download saved manuscript)'}
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No file chosen</span>
            )}
          </div>
          <input type="hidden" {...register('sourceZipFileAssetId')} />
          {errors.sourceZipFileAssetId && (
            <span className="text-destructive text-xs font-semibold block">{errors.sourceZipFileAssetId.message}</span>
          )}
        </div>

        {/* Cover Image Upload (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Cover Image
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(Optional)</span>
          </label>
          
          <div className="space-y-3">
            {coverPreviewUrl ? (
              <div className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreviewUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                {!isLoading && !isUploading && !hasActivePendingProposal && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all hover:scale-105"
                    title="Remove cover image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">Upload cover image</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    disabled={isLoading || isUploading || hasActivePendingProposal}
                  />
                </label>
              </div>
            )}
            
            {/* Hidden input to keep React Hook Form synchronized */}
            <input type="hidden" {...register('coverImagePublicUrl')} />
            
            {errors.coverImagePublicUrl && (
              <span className="text-destructive text-xs font-semibold block">{errors.coverImagePublicUrl.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Sample Pages Upload */}
      <div className="space-y-2.5 border-t border-border/60 pt-6">
        <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Sample Pages (Artwork Preview)
          <span className="text-[10px] text-muted-foreground font-normal ml-1">(Optional)</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Upload representative artwork pages to show the Editorial Board. Max 5MB per page.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-3">
          {samplePreviewUrls.map((url, idx) => (
            <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted/20 shadow-sm group animate-in fade-in duration-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Sample page ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                Page {idx + 1}
              </div>
              {!isLoading && !isUploading && !hasActivePendingProposal && (
                <button
                  type="button"
                  onClick={() => handleRemoveSamplePage(idx)}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-destructive/90 hover:bg-destructive text-white rounded-full transition-all hover:scale-110 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove sample page"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {!isLoading && !isUploading && !hasActivePendingProposal && (
            <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-muted/40 transition-colors hover:border-primary group">
              <div className="flex flex-col items-center justify-center p-3 text-center">
                <Upload className="w-6 h-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">Add Pages</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleSampleImagesChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Hidden input to keep React Hook Form synchronized */}
        <input type="hidden" {...register('sampleFileUrl')} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Save Draft */}
        <Button
          type="submit"
          variant="outline"
          onClick={() => {
            setAction('draft')
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-semibold rounded-lg border-border"
        >
          {isLoading || isUploading ? 'Processing…' : 'Save Draft'}
        </Button>

        {/* Submit for Review */}
        <Button
          type="submit"
          onClick={() => {
            setAction('submit')
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-bold rounded-lg shadow-sm"
        >
          {isLoading || isUploading ? 'Processing…' : 'Submit for Approval'}
        </Button>
      </div>
    </form>
  )
}
