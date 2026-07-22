'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  PencilLine
} from 'lucide-react'

interface EditorSeriesTabProps {
  supervisedSeries: any[]
}

export default function EditorSeriesTab({ supervisedSeries }: EditorSeriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All Genres')
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedStatus, setSelectedStatus] = useState('All')

  const filteredSeries = supervisedSeries.filter((s) => {
    // Apply Search query
    if (
      searchQuery &&
      !s.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    // Apply Genre filter
    if (
      selectedGenre !== 'All Genres' &&
      (!s.genre || !s.genre.includes(selectedGenre))
    ) {
      return false
    }
    // Apply Type filter
    if (selectedType !== 'All Types' && s.type !== selectedType) {
      return false
    }
    // Apply Status filter
    if (
      selectedStatus !== 'All' &&
      s.status?.replace(' ', '').toLowerCase() !==
      selectedStatus.replace(' ', '').toLowerCase()
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-foreground">Series</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {filteredSeries.length} series found
        </p>
      </div>

      {/* Search and Filters row */}
      <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-lg text-xs focus:outline-none focus:border-primary/40 text-foreground"
            />
          </div>

          {/* Genre filter */}
          <div className="relative">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-semibold"
            >
              <option>All Genres</option>
              <option>Shōnen</option>
              <option>Shōjo</option>
              <option>Seinen</option>
              <option>Fantasy</option>
              <option>Slice of Life</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-semibold"
            >
              <option>All Types</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Bi-Weekly</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Status filters horizontal list */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {[
            'All',
            'Proposed',
            'Under Review',
            'Approved',
            'Active',
            'On-Hold',
            'Cancelled',
          ].map((status) => {
            const isActive = selectedStatus === status
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all cursor-pointer ${isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid display of series cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredSeries.map((series) => {
          return (
            <div
              key={series.id}
              className="bg-card border border-border hover:border-primary/25 flex flex-row hover:shadow-lg transition-all group overflow-hidden"
            >
              {/* Left Cover */}
              <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-slate-900 aspect-[3/4]">
                {series.coverImagePublicUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={series.coverImagePublicUrl}
                    alt={series.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${series.coverColor || 'from-blue-600 to-cyan-700'} opacity-90`} />
                )}
                {/* Badges on cover */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {series.type && (
                    <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/5">
                      {series.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Content */}
              <div className="p-4 flex-1 flex flex-col justify-between min-w-0 space-y-2">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors cursor-pointer" title={series.title}>
                      {series.title}
                    </h3>
                    <span
                      className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${series.status === 'Active' || series.status === 'Approved'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : series.status === 'Under Review' || series.status === 'UnderReview'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
                          : series.status === 'BoardVoting' || series.status === 'Board Voting'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                            : series.status === 'Rejected'
                              ? 'bg-red-500/10 border-red-500/20 text-red-600'
                              : 'bg-muted text-muted-foreground border-border'
                        }`}
                    >
                      {series.status === 'UnderReview' ? 'Under Review' : series.status === 'BoardVoting' ? 'Board Voting' : (series.status || 'Active')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">by {series.author || 'Unknown Mangaka'}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
                    {series.description || 'No description provided.'}
                  </p>
                </div>

                {/* Genres footer */}
                <div className="pt-2 border-t border-border/40 text-[10px]">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {series.genre?.slice(0, 2).map((g: string) => (
                      <span
                        key={g}
                        className="bg-muted text-muted-foreground text-[8px] font-semibold px-1.5 py-0.5 rounded truncate"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
