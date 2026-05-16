export type PublicationType = 'Weekly' | 'Monthly' | 'One-shot'

export type SeriesStatus = 'Proposed' | 'Active' | 'Rejected' | 'Deferred' | 'Cancelled'

export interface Series {
  id: string
  title: string
  genre: string
  publicationType: PublicationType
  description: string
  status: SeriesStatus
  createdBy: string
  assignedEditorId?: string
  votes?: Record<string, 'Approved' | 'Rejected'>
}
