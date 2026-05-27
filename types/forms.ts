import { Series, PublicationType } from './series'

export interface SeriesProposalFormData {
  title: string
  genre: string
  publicationType: PublicationType
  description: string
  coverImageUrl?: string
}

export interface ChapterTaskFormData {
  chapterId: string
  pageStart: number
  pageEnd: number
  assignedToId: string
  deadline: string
}

export interface ManuscriptFormData {
  seriesId: string
  fileUrl: string
  notes?: string
}

export interface VoteEntryFormData {
  seriesId: string
  chapterId: string
  readerCount: number
  voteCount: number
}

export interface PageTaskData {
  chapterId: string
  pageNumber: number
  status: 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected'
  assignedToId?: string
  rejectionReason?: string
}
