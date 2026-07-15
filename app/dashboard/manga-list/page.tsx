'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, BookOpen, Star } from 'lucide-react'
import { proposalService } from '@/services/proposalService'
import type { Proposal } from '@/types/proposal'
const { getProposals } = proposalService

interface Manga {
  id: string
  title: string
  author: string
  genre: string[]
  type: string
  status: 'Active' | 'Proposed' | 'Deferred' | 'Rejected'
  description: string
  coverColor: string
  rating: number
  coverImageUrl?: string
}

export default function MangaListPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [mangaList, setMangaList] = useState<Manga[]>([])

  useEffect(() => {
    getProposals().then((proposals) => {
      const list: Manga[] = proposals.map((p) => {
        const authorName = p.author || 'Unknown Author'

        const statusMap: Record<Proposal['status'], Manga['status']> = {
          Approved: 'Active',
          'Pending Review': 'Proposed',
          'Under Review': 'Proposed',
          'Board Voting': 'Proposed',
          Draft: 'Proposed',
          Rejected: 'Rejected',
          Active: 'Active',
        }

        const colors = [
          'from-red-500 to-rose-700',
          'from-emerald-500 to-teal-700',
          'from-orange-500 to-red-600',
          'from-sky-400 to-indigo-600',
          'from-blue-600 to-cyan-700',
          'from-pink-500 to-purple-600',
        ]
        const colorIdx = Math.abs(p.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length
        const coverColor = colors[colorIdx]

        return {
          id: p.id,
          title: p.title,
          author: authorName,
          genre: p.genre ? p.genre.split(', ') : [],
          type: p.publicationType,
          status: statusMap[p.status] || 'Proposed',
          description: p.synopsis,
          coverColor,
          rating: 4.5 + (p.title.length % 5) * 0.1,
          coverImageUrl: p.coverImagePublicUrl,
        }
      })
      setMangaList(list)
    })
  }, [])

  // Filter logic
  const filteredManga = mangaList.filter((manga) => {
    const matchesSearch =
      manga.title.toLowerCase().includes(search.toLowerCase()) ||
      manga.author.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || manga.type === filterType
    return matchesSearch && matchesType
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

        {/* Filter Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-foreground font-semibold focus:outline-none text-xs"
          >
            <option value="All">All</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="One-shot">One-shot</option>
          </select>
        </div>
      </div>

      {/* Manga Grid */}
      {filteredManga.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredManga.map((manga) => (
            <div
              key={manga.id}
              className="bg-card border border-border overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all flex flex-row group"
            >
              {/* Left Cover */}
              <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-slate-900 aspect-[3/4]">
                {manga.coverImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={manga.coverImageUrl}
                    alt={manga.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${manga.coverColor} opacity-90`} />
                )}
                {/* Type Badge on cover */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/5">
                    {manga.type}
                  </span>
                </div>
              </div>

              {/* Right Content */}
              <div className="p-4 flex-1 flex flex-col justify-between min-w-0 space-y-2">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors cursor-pointer" title={manga.title}>
                      {manga.title}
                    </h3>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 ${manga.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
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

                {/* Genres & Rating */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {manga.genre.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="bg-muted text-muted-foreground text-[8px] font-semibold px-1.5 py-0.5 rounded truncate"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 text-amber-500 font-bold">
                    <Star className="w-3 h-3" />
                    <span className="text-foreground">{manga.rating}</span>
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
    </div>
  )
}
