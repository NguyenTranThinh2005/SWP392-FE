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
        {filteredSeries.map((series, idx) => {
          const displayCode = `S${String(idx + 1).padStart(2, '0')}`

          return (
            <div
              key={series.id}
              className="bg-card border border-border hover:border-primary/20 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
            >
              <div>
                {/* Top Accent Row */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${series.status === 'Active' || series.status === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : series.status === 'Under Review' || series.status === 'UnderReview'
                        ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                        : series.status === 'BoardVoting' || series.status === 'Board Voting'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : series.status === 'Rejected'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                      }`}
                  >
                    {series.status === 'UnderReview' ? 'Under Review' : series.status === 'BoardVoting' ? 'Board Voting' : (series.status || 'Active')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold">
                    {displayCode}
                  </span>
                </div>

                {/* Title & Info */}
                <h3 className="font-extrabold text-base text-foreground mt-3 group-hover:text-primary transition-colors">
                  {series.title}
                </h3>

                {/* Genre pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {series.genre?.slice(0, 3).map((g: string) => (
                    <span
                      key={g}
                      className="bg-muted text-muted-foreground text-[9px] font-bold px-2 py-0.5 rounded"
                    >
                      {g}
                    </span>
                  ))}
                  {series.type && (
                    <span className="bg-primary/5 text-primary text-[9px] font-bold px-2 py-0.5 rounded border border-primary/10">
                      {series.type}
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                <p className="text-xs text-muted-foreground leading-relaxed mt-3.5 line-clamp-3">
                  {series.description || 'No description provided.'}
                </p>
              </div>

              {/* Bottom Metadata row */}
              <div className="pt-3 border-t border-border/40 flex items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-foreground truncate flex items-center">
                    <PencilLine className="w-3.5 h-3.5 mr-1 text-primary shrink-0" /> {series.author || 'Unknown Mangaka'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
