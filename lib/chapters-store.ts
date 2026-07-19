export type ChapterStatus = 'Draft' | 'In Progress' | 'Submitted' | 'Ready for Editor' | 'Published'

export type TaskStatus = 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected'

export interface Assistant {
  id: string
  name: string
  avatarUrl: string
  specialty: string
  activeTasks: number
}

export interface Series {
  id: string
  title: string
  mangakaId: string
  coverColor: string
  status?: string // Added to support validation
}

export interface Task {
  id: string
  chapterId: string
  manuscriptId?: string
  type: string // e.g. "Line Art", "Coloring", "Backgrounds", "Toning"
  pages: string // e.g. "1-3", "4-7", "8"
  description: string
  assistantId: string
  assistantName: string
  status: TaskStatus
  submittedWorkUrl?: string // Mock image url submitted by assistant
  ratePerPage?: number // don gia/trang cho task nay (Mangaka nhap)
  prevSubmittedWorkUrl?: string
  feedback?: string // Feedback comments from Mangaka
  assignedAt?: string
  updatedAt?: string
  dueDate?: string // NgÃ y háº¡n chÃ³t ná»™p task Ä‘á»ƒ Mangaka theo dÃµi tiáº¿n Ä‘á»™
  pageStart?: number // Sá»‘ trang báº¯t Ä‘áº§u váº½
  pageEnd?: number // Sá»‘ trang káº¿t thÃºc váº½
  attachments?: { name: string; size: string; type: string }[] // TÃ i liá»‡u hÆ°á»›ng dáº«n Ä‘Ã­nh kÃ¨m tá»« Mangaka
  submittedFiles?: { name: string; size: string; type: string }[] // CÃ¡c file hÃ¬nh áº£nh/sáº£n pháº©m Assistant Ä‘Ã£ ná»™p
  submitDescription?: string // Lá»i nháº¯n hoáº·c mÃ´ táº£ chá»‰nh sá»­a tá»« Assistant khi ná»™p bÃ i
  submissionId?: string // to support backend approve/reject calls
  submittedFileAssetId?: string
  submissionCount?: number
  referenceFiles?: { fileAssetId: string; publicUrl: string; originalFileName: string; mimeType?: string }[]
}

export interface Chapter {
  id: string
  seriesId: string
  number: number
  title: string
  status: ChapterStatus
  totalPages: number
  publicationDate: string
  deadline: string // calculated (pubDate - 14 days)
  createdAt: string
  synopsis?: string // Added to support synopsis info from SubmitChapterPage
  notes?: string // Added to support notes from SubmitChapterPage
  storyboardFiles?: any[] // Added to support storyboard files from SubmitChapterPage
  manuscriptFiles?: any[] // Added to support manuscript files from SubmitChapterPage
  referenceFiles?: { fileAssetId: string; publicUrl: string; originalFileName: string; mimeType?: string }[]
}


export const TASK_TYPE_SUGGESTIONS = [
  {
    name: 'Line Art',
    description: 'Sketch character and background line art.',
    template: 'Detailed line art is required for the main character on page {pages}. Note the thickness of the face and hair outlines.'
  },
  {
    name: 'Coloring',
    description: 'Coloring, shading, and lighting effects.',
    template: 'Perform digital coloring for page {pages}. Use warm golden sunset tones according to the moodboard.'
  },
  {
    name: 'Background Art',
    description: 'Draw detailed backgrounds, environments, and scenery.',
    template: 'Draw the ancient temple background in detail for pages {pages}. Focus on the roof tile patterns.'
  },
  {
    name: 'Screentoning',
    description: 'Apply screentone grids to create depth and texture.',
    template: 'Apply screentones to create shadow depth and light textures on page {pages}.'
  },
  {
    name: 'Clean-up',
    description: 'Clean up rough sketch lines and align panels.',
    template: 'Erase unnecessary rough drafts and standardize frame sizes for page {pages}.'
  }
]

