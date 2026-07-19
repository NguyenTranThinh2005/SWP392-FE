import { z } from 'zod'

// Proposal Validation Requirements
export const seriesProposalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be ≤ 100 characters'),
  genre: z.string().min(1, 'Genre is required'),
  publicationType: z.enum(['Weekly', 'Monthly', 'One-Shot'], {
    message: 'Publication type is required',
  }),
  // Synopsis must be 100–2000 characters
  synopsis: z
    .string()
    .min(100, 'Synopsis must be ≥ 100 characters')
    .max(2000, 'Synopsis must be ≤ 2000 characters'),
  sampleFileUrl: z.string(),
  coverImagePublicUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  sourceZipFileAssetId: z.string().optional().nullable(),
})

export type SeriesProposalInput = z.infer<typeof seriesProposalSchema>

// Chapter task deadline validation rules
export const chapterTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter is required'),
  pageStart: z.number().min(1, 'Start page must be at least 1'),
  pageEnd: z.number().min(1, 'End page must be at least 1'),
  assignedToId: z.string().min(1, 'Please assign to an assistant'),
  deadline: z.string().refine((date) => new Date(date) > new Date(), 'Deadline must be in the future'),
})

export type ChapterTaskInput = z.infer<typeof chapterTaskSchema>

export const manuscriptSchema = z.object({
  seriesId: z.string().min(1, 'Series is required'),
  fileUrl: z.string().url('Invalid file URL'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type ManuscriptInput = z.infer<typeof manuscriptSchema>

// VoteRecord Validation constraints (readerCount >= voteCount >= 0)
export const voteEntrySchema = z
  .object({
    seriesId: z.string().min(1, 'Series is required'),
    chapterId: z.string().min(1, 'Chapter is required'),
    readerCount: z.number().min(0, 'Reader count cannot be negative'),
    voteCount: z.number().min(0, 'Vote count cannot be negative'),
  })
  .refine((data) => data.voteCount <= data.readerCount, {
    message: 'Vote count cannot exceed reader count',
    path: ['voteCount'],
  })

export type VoteEntryInput = z.infer<typeof voteEntrySchema>

// Mandatory fields for page tasks
export const pageTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter is required'),
  pageNumber: z.number().min(1, 'Page number must be at least 1'),
  status: z.enum(['Pending', 'In-Progress', 'Submitted', 'Approved', 'Rejected']),
  assignedToId: z.string().optional(),
  rejectionReason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
})


export type PageTaskInput = z.infer<typeof pageTaskSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
