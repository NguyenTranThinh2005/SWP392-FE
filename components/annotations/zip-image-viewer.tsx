'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  Grid,
  Rows,
  Maximize2,
  X,
  FileImage
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractImagesFromZip } from '@/lib/imageCompare'

export interface ZipImageFile {
  name: string
  dataUrl: string
}

export interface ZipImageViewerProps {
  /** Target file URL (can be a .zip archive or a direct image URL) */
  fileUrl?: string | null
  /** Display layout mode: 'slider' (single page viewer with navigation) or 'grid' (thumbnail list) */
  initialMode?: 'slider' | 'grid'
  /** Optional callback fired when images are extracted from the file */
  onImagesLoaded?: (images: ZipImageFile[]) => void
  /** Optional callback fired when current page changes in slider mode */
  onPageChange?: (pageIndex: number, page: ZipImageFile) => void
  /** Custom max height class for image container (default: 'max-h-[500px]') */
  maxHeightClass?: string
  /** Additional container wrapper class */
  className?: string
  /** Optional overlay children (e.g. pin comments, annotation markers) */
  children?: (currentPage: ZipImageFile | null, pageIndex: number) => React.ReactNode
}

/**
 * ponytail: Reusable Zip & Image Extractor Viewer Component.
 * Automatically detects whether fileUrl is a .zip archive or direct image,
 * extracts pages using JSZip, and provides responsive slider/grid viewing modes.
 */
export function ZipImageViewer({
  fileUrl,
  initialMode = 'slider',
  onImagesLoaded,
  onPageChange,
  maxHeightClass = 'max-h-[500px]',
  className = '',
  children
}: ZipImageViewerProps) {
  const [pages, setPages] = useState<ZipImageFile[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [mode, setMode] = useState<'slider' | 'grid'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ponytail: extract images when fileUrl changes
  useEffect(() => {
    if (!fileUrl) {
      setPages([])
      setError(null)
      return
    }

    const isZip = /\.zip(\?|$)/i.test(fileUrl)
    setIsLoading(true)
    setError(null)

    if (isZip) {
      extractImagesFromZip(fileUrl)
        .then((extracted) => {
          if (extracted.length === 0) {
            setError('No readable images (.jpg, .png, .webp) found inside this ZIP archive.')
            setPages([])
          } else {
            setPages(extracted)
            setCurrentPageIndex(0)
            onImagesLoaded?.(extracted)
          }
        })
        .catch((err) => {
          console.error('[ZipImageViewer] Extraction error:', err)
          setError('Failed to extract ZIP file. File might be corrupted or unreadable.')
          setPages([])
        })
        .finally(() => setIsLoading(false))
    } else {
      // Direct image URL
      const singleImage = [{ name: 'Page 1', dataUrl: fileUrl }]
      setPages(singleImage)
      setCurrentPageIndex(0)
      setIsLoading(false)
      onImagesLoaded?.(singleImage)
    }
  }, [fileUrl])

  const handleSelectPage = (index: number) => {
    if (index < 0 || index >= pages.length) return
    setCurrentPageIndex(index)
    onPageChange?.(index, pages[index])
  }

  if (!fileUrl) {
    return (
      <div className={`p-6 text-center border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground ${className}`}>
        <FileArchive className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-xs font-semibold">No file provided to view.</p>
      </div>
    )
  }

  const isZip = /\.zip(\?|$)/i.test(fileUrl)
  const currentPage = pages[currentPageIndex] || null

  return (
    <div className={`space-y-3 bg-card border border-border rounded-2xl p-4 shadow-sm ${className}`}>
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            {isZip ? <FileArchive className="w-3.5 h-3.5" /> : <FileImage className="w-3.5 h-3.5" />}
            {isZip ? 'ZIP Archive' : 'Image File'}
          </Badge>
          {pages.length > 0 && (
            <span className="text-xs font-extrabold text-foreground">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Extracted
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          {pages.length > 1 && (
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  mode === 'slider' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Single Page View"
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode('grid')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  mode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid Overview"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Download Original File */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-muted px-2.5 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download Original
          </a>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center space-y-3 bg-muted/10 rounded-xl border border-border/40">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Extracting pages from ZIP archive...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold space-y-1">
          <p className="font-bold">{error}</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[11px] block"
          >
            Click here to download original file directly.
          </a>
        </div>
      )}

      {/* Content View */}
      {!isLoading && !error && pages.length > 0 && (
        <>
          {mode === 'slider' && (
            <div className="space-y-3">
              {/* Active Image Canvas Container */}
              <div className="relative flex items-center justify-center bg-black/90 rounded-xl overflow-hidden min-h-[280px] group border border-border/40">
                {currentPage && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPage.dataUrl}
                      alt={currentPage.name}
                      className={`w-auto object-contain select-none transition-all ${maxHeightClass}`}
                    />

                    {/* Custom Annotation Overlay / Children */}
                    {children && children(currentPage, currentPageIndex)}

                    {/* Fullscreen Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                      title="Fullscreen Preview"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Left/Right Floating Navigation */}
                {pages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectPage(currentPageIndex - 1)}
                      disabled={currentPageIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPage(currentPageIndex + 1)}
                      disabled={currentPageIndex === pages.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Slider Bottom Navigation & Thumbnails */}
              {pages.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-foreground">
                      Page {currentPageIndex + 1} of {pages.length}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                      {currentPage?.name}
                    </span>
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                    {pages.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPage(idx)}
                        className={`relative shrink-0 w-14 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === currentPageIndex
                            ? 'border-primary ring-2 ring-primary/20 scale-105'
                            : 'border-border opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-black text-center py-0.5">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid Mode */}
          {mode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[550px] overflow-y-auto pr-1">
              {pages.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    handleSelectPage(idx)
                    setMode('slider')
                  }}
                  className={`group relative border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    idx === currentPageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-black/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.dataUrl}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2 bg-card border-t border-border flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">Page {idx + 1}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Fullscreen Overlay Modal */}
      {isFullscreen && currentPage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in duration-200 backdrop-blur-md">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <div>
              <p className="font-extrabold text-sm">
                Page {currentPageIndex + 1} / {pages.length}
              </p>
              <p className="text-xs text-neutral-400 font-mono">{currentPage.name}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Fullscreen Main Image */}
          <div className="relative flex-1 flex items-center justify-center p-2 min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPage.dataUrl}
              alt={currentPage.name}
              className="max-w-full max-h-full object-contain"
            />

            {pages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectPage(currentPageIndex - 1)}
                  disabled={currentPageIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPage(currentPageIndex + 1)}
                  disabled={currentPageIndex === pages.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ZipImageViewer
