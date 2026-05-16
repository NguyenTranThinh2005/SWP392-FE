export interface ManuscriptVersion {
  id: string
  seriesId: string
  versionLabel: string
  fileUrl: string
  submittedAt: string
  status: 'Pending' | 'Approved' | 'Revision Required'
  revisionNotes?: string
}
