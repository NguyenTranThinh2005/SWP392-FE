export type TaskStatus = 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected' | 'Unassigned' | 'Suspended'

export interface PageTask {
  id: string
  chapterId: string
  pageRange: string
  assistantId?: string
  status: TaskStatus
  rejectionReason?: string
}
