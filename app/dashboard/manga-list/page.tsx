'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, BookOpen, X, Layers, Clock, FileText } from 'lucide-react'
import { seriesService } from '@/services/seriesService'
import { chapterService, type Chapter } from '@/services/chapterService'

interface Manga {
  id: string
  title: string
  author: string
  genre: string[]
  type: string
  status: 'Active' | 'Proposed' | 'Deferred' | 'Rejected'
  description: string
  coverColor: string
  coverImageUrl?: string
}

const parseGenres = (genre: any): string[] => {
  if (!genre) return []
  if (Array.isArray(genre)) return genre.filter(Boolean)
  if (typeof genre === 'string') {
    if (genre.includes(',')) {
      return genre.split(',').map((s) => s.trim()).filter(Boolean)
    }
    const splitPascal = genre.match(/[A-Z][a-z0-9]*/g)
    if (splitPascal && splitPascal.length > 1) {
      return splitPascal
    }
    return [genre.trim()]
  }
  return []
}

export default function MangaListPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [mangaList, setMangaList] = useState<Manga[]>([])

  // Modal State
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)

  useEffect(() => {
    seriesService.listSeries().then((seriesList) => {
      const list: Manga[] = seriesList.map((s) => {
        const authorName = s.author || 'Unknown Author'

        const statusMap: Record<string, Manga['status']> = {
          Approved: 'Active',
          Active: 'Active',
          'Pending Review': 'Proposed',
          PendingReview: 'Proposed',
          'Under Review': 'Proposed',
          UnderReview: 'Proposed',
          'Board Voting': 'Proposed',
          BoardVoting: 'Proposed',
          Draft: 'Proposed',
          Rejected: 'Rejected',
          Cancelled: 'Rejected',
        }

        const colors = [
          'from-red-500 to-rose-700',
          'from-emerald-500 to-teal-700',
          'from-orange-500 to-red-600',
          'from-sky-400 to-indigo-600',
          'from-blue-600 to-cyan-700',
          'from-pink-500 to-purple-600',
        ]
        const colorIdx = Math.abs(s.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length
        const coverColor = colors[colorIdx]

        return {
          id: s.id,
          title: s.title,
          author: authorName,
          genre: parseGenres(s.genre),
          type: s.type || 'Weekly',
          status: statusMap[s.status] || 'Proposed',
          description: s.description || 'No description provided.',
          coverColor,
          coverImageUrl: s.coverImagePublicUrl,
        }
      })
      setMangaList(list)
    })
  }, [])

  // Handle open detail modal
  const handleOpenDetail = async (manga: Manga) => {
    setSelectedManga(manga)
    setLoadingChapters(true)
    try {
      const chs = await chapterService.getChaptersBySeries(manga.id)
      setChapters(chs || [])
    } catch {
      setChapters([])
    } finally {
      setLoadingChapters(false)
    }
  }

  // Filter logic
  const filteredManga = mangaList.filter((manga) => {
    const matchesSearch =
      manga.title.toLowerCase().includes(search.toLowerCase()) ||
      manga.author.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || manga.type === filterType
    const matchesStatus = filterStatus === 'All' || manga.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Manga List
          </h1>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Type Filter Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-foreground font-semibold focus:outline-none text-xs cursor-pointer"
          >
            <option value="All" className="bg-card text-foreground">All Types</option>
            <option value="Weekly" className="bg-card text-foreground">Weekly</option>
            <option value="Monthly" className="bg-card text-foreground">Monthly</option>
            <option value="One-shot" className="bg-card text-foreground">One-shot</option>
          </select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-foreground font-semibold focus:outline-none text-xs cursor-pointer"
          >
            <option value="All" className="bg-card text-foreground">All Statuses</option>
            <option value="Active" className="bg-card text-foreground">Active</option>
            <option value="Proposed" className="bg-card text-foreground">Proposed</option>
            <option value="Rejected" className="bg-card text-foreground">Rejected</option>
          </select>
        </div>
      </div>

      {/* Manga Grid */}
      {filteredManga.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredManga.map((manga) => (
            <div
              key={manga.id}
              onClick={() => handleOpenDetail(manga)}
              className="bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-row group cursor-pointer"
            >
              {/* Left Cover */}
              <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-slate-900 aspect-[3/4]">
                {manga.coverImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={manga.coverImageUrl}
                    alt={manga.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${manga.coverColor} opacity-90`} />
                )}
                {/* Type Badge on cover */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/10">
                    {manga.type}
                  </span>
                </div>
              </div>

              {/* Right Content */}
              <div className="p-4 flex-1 flex flex-col justify-between min-w-0 space-y-2">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={manga.title}>
                      {manga.title}
                    </h3>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 ${manga.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : manga.status === 'Rejected'
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                      {manga.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">by {manga.author}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
                    {manga.description}
                  </p>
                </div>

                {/* Genres */}
                <div className="pt-2 border-t border-border/40 text-[10px]">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {manga.genre.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="bg-muted text-muted-foreground text-[8px] font-semibold px-1.5 py-0.5 rounded border border-border/40 truncate"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-lg text-foreground">No manga found</h3>
        </div>
      )}

      {/* Manga Detail Modal */}
      {selectedManga && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedManga(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-extrabold text-base text-foreground">Manga Details</h2>
              </div>
              <button
                onClick={() => setSelectedManga(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Cover Image */}
                <div className="w-40 sm:w-48 shrink-0 mx-auto sm:mx-0">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-border shadow-md relative group">
                    {selectedManga.coverImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedManga.coverImageUrl}
                        alt={selectedManga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${selectedManga.coverColor} flex items-center justify-center p-4 text-white font-black text-center text-lg`}>
                        {selectedManga.title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Info */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                        {selectedManga.title}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedManga.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : selectedManga.status === 'Rejected'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                        {selectedManga.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      Author: <span className="text-foreground">{selectedManga.author}</span>
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 border border-border/60 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Publication</span>
                      <span className="font-extrabold text-foreground">{selectedManga.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Chapters</span>
                      <span className="font-extrabold text-foreground">
                        {loadingChapters ? 'Loading...' : `${chapters.length} Chapters`}
                      </span>
                    </div>
                  </div>

                  {/* Genres */}
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Genres</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedManga.genre.length > 0 ? (
                        selectedManga.genre.map((g) => (
                          <span
                            key={g}
                            className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-border/40"
                          >
                            {g}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Synopsis / Description</span>
                    <p className="text-xs text-foreground leading-relaxed font-medium bg-card border border-border/40 p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {selectedManga.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chapters List Section */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Chapter List ({chapters.length})
                  </h3>
                </div>

                {loadingChapters ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Loading chapters...
                  </div>
                ) : chapters.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between p-3 bg-muted/20 border border-border/60 rounded-xl hover:border-primary/30 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-primary bg-primary/10 px-2 py-1 rounded-md text-[10px]">
                            Ch. {ch.number}
                          </span>
                          <div>
                            <span className="font-extrabold text-foreground block">{ch.title}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span><FileText className="w-3 h-3 inline mr-0.5" /> {ch.totalPages} Pages</span>
                              {ch.publicationDate && (
                                <span><Clock className="w-3 h-3 inline mr-0.5" /> {ch.publicationDate}</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                          {ch.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-muted/20 border border-border/60 rounded-xl text-center text-xs text-muted-foreground font-semibold">
                    No chapters available for this manga.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
