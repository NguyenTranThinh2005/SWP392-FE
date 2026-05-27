'use client'

import { useState } from 'react'
import { SeriesProposalForm, ChapterTaskForm, ManuscriptForm, VoteEntryForm } from '@/components/forms'
import type { SeriesProposalInput, ChapterTaskInput, ManuscriptInput, VoteEntryInput } from '@/lib/validation'

const mockChapters = [
  { id: 'ch-1', title: 'Chapter 1: The Beginning' },
  { id: 'ch-2', title: 'Chapter 2: The Journey' },
]

const mockAssistants = [
  { id: 'asst-1', name: 'John Doe' },
  { id: 'asst-2', name: 'Jane Smith' },
  { id: 'asst-3', name: 'Mike Johnson' },
]

const mockSeries = [
  { id: 'series-1', title: 'My Great Manga' },
  { id: 'series-2', title: 'Another Series' },
]

const mockChaptersWithSeries = [
  { id: 'ch-1', title: 'Chapter 1', seriesId: 'series-1' },
  { id: 'ch-2', title: 'Chapter 2', seriesId: 'series-1' },
  { id: 'ch-3', title: 'Chapter 1', seriesId: 'series-2' },
]

export default function FormsDemoPage() {
  const [activeTab, setActiveTab] = useState<'series' | 'chapter' | 'manuscript' | 'vote'>('series')
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setLog((prev) => [new Date().toLocaleTimeString() + ' - ' + message, ...prev.slice(0, 9)])
  }

  const handleSeriesSubmit = async (data: SeriesProposalInput) => {
    addLog(`Series proposal submitted: ${data.title}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleChapterTaskSubmit = async (data: ChapterTaskInput) => {
    addLog(`Chapter task assigned - Pages ${data.pageStart}-${data.pageEnd}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleManuscriptSubmit = async (data: ManuscriptInput) => {
    addLog(`Manuscript submitted for series`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleVoteSubmit = async (data: VoteEntryInput) => {
    addLog(`Vote data entered - Score: ${((data.voteCount / data.readerCount) * 100).toFixed(2)}%`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">Form Validation Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              {(['series', 'chapter', 'manuscript', 'vote'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab === 'series' && 'Series Proposal'}
                  {tab === 'chapter' && 'Chapter Task'}
                  {tab === 'manuscript' && 'Manuscript'}
                  {tab === 'vote' && 'Vote Entry'}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="bg-white p-8 rounded-lg shadow">
              {activeTab === 'series' && <SeriesProposalForm onSubmit={handleSeriesSubmit} />}
              {activeTab === 'chapter' && (
                <ChapterTaskForm chapters={mockChapters} assistants={mockAssistants} onSubmit={handleChapterTaskSubmit} />
              )}
              {activeTab === 'manuscript' && (
                <ManuscriptForm
                  seriesId="series-1"
                  seriesTitle="My Great Manga"
                  onSubmit={handleManuscriptSubmit}
                />
              )}
              {activeTab === 'vote' && (
                <VoteEntryForm
                  series={mockSeries}
                  chapters={mockChaptersWithSeries}
                  onSubmit={handleVoteSubmit}
                />
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-6 rounded-lg shadow h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-4">Activity Log</h2>
            <div className="space-y-2 text-sm max-h-[600px] overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-gray-400">No submissions yet. Try submitting a form!</p>
              ) : (
                log.map((entry, idx) => (
                  <div key={idx} className="p-2 bg-gray-100 rounded text-gray-700 font-mono text-xs break-words">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
