# Form Validation System Documentation

## Overview
This system provides comprehensive form validation using Zod schemas integrated with React Hook Form. All forms follow best practices for user experience and data validation.

## Available Forms

### 1. SeriesProposalForm
**Purpose**: Allows Mangaka to submit a new manga series proposal

**Required Fields**:
- `title` (3-100 chars) - Series title
- `genre` - Genre selection
- `publicationType` - Weekly, Monthly, or One-shot
- `description` (10-1000 chars) - Series description

**Optional Fields**:
- `coverImageUrl` - Valid image URL

**Validation Rules**:
- Title must be between 3 and 100 characters
- Description must be between 10 and 1000 characters
- Cover image must be a valid URL if provided
- All required fields must have selections

**Usage**:
```tsx
import { SeriesProposalForm } from '@/components/forms'

export default function ProposalPage() {
  const handleSubmit = async (data: SeriesProposalInput) => {
    // Send to API
    await seriesService.submitProposal(data)
  }

  return <SeriesProposalForm onSubmit={handleSubmit} />
}
```

---

### 2. ChapterTaskForm
**Purpose**: Assigns page tasks to assistants for manga chapters

**Required Fields**:
- `chapterId` - Select chapter
- `pageStart` (≥1) - Starting page number
- `pageEnd` (≥1) - Ending page number
- `assignedToId` - Assistant to assign
- `deadline` - Must be in future

**Validation Rules**:
- Pages must be positive numbers
- Page end must be ≥ page start (client-side check available)
- Deadline must be in the future
- Recommended: 14 days before publication date

**Business Logic**:
- Deadline is typically publication_date - 14 days
- Can assign to any active assistant
- Multiple tasks can exist for same chapter (different page ranges)

**Usage**:
```tsx
import { ChapterTaskForm } from '@/components/forms'
import { CHAPTER_DEADLINE_DAYS_BEFORE } from '@/lib/constants'

export default function TaskPage() {
  const handleSubmit = async (data: ChapterTaskInput) => {
    // Validate deadline aligns with chapter publication
    await taskService.assignPageTask(data)
  }

  return (
    <ChapterTaskForm
      chapters={chapters}
      assistants={assistants}
      onSubmit={handleSubmit}
    />
  )
}
```

---

### 3. ManuscriptForm
**Purpose**: Submit completed manuscript to editors for review

**Required Fields**:
- `seriesId` - Reference series (typically pre-filled)
- `fileUrl` - URL to manuscript file (PDF, DOCX, ZIP)

**Optional Fields**:
- `notes` - Additional notes (max 500 chars)

**Validation Rules**:
- File URL must be valid
- Notes must be ≤500 characters
- Pre-condition: 100% of chapter pages must be approved

**Business Constraint**:
- Cannot submit until all PageTasks are in "Approved" status
- Creates new version (v1, v2, v3...) automatically
- Triggers editor notification

**Usage**:
```tsx
import { ManuscriptForm } from '@/components/forms'

export default function ManuscriptPage() {
  const handleSubmit = async (data: ManuscriptInput) => {
    // Backend checks: 100% pages approved
    // Creates new version
    // Notifies editor
    await manuscriptService.submitManuscript(data)
  }

  return (
    <ManuscriptForm
      seriesId={seriesId}
      seriesTitle={seriesTitle}
      onSubmit={handleSubmit}
    />
  )
}
```

---

### 4. VoteEntryForm
**Purpose**: Editor/Board enters reader vote data for ranking calculation

**Required Fields**:
- `seriesId` - Select series
- `chapterId` - Select chapter (filtered by series)
- `readerCount` (≥0) - Total readers
- `voteCount` (≥0) - Total votes

**Validation Rules**:
- Vote count cannot exceed reader count
- Both counts must be non-negative
- Reader count filters available chapters
- Score is calculated: (voteCount ÷ readerCount) × 100%

**Business Logic**:
- Triggers after chapter publication (typically end of month)
- Data must be confirmed for ranking calculation
- If readerCount = 0, score = 0%
- Bottom 20% of series flagged for cancellation review

**Usage**:
```tsx
import { VoteEntryForm } from '@/components/forms'
import { calculateVoteScore } from '@/lib/business-logic'

export default function VoteEntryPage() {
  const handleSubmit = async (data: VoteEntryInput) => {
    const score = calculateVoteScore(data.voteCount, data.readerCount)
    // Confirm data, trigger ranking calculation
    await voteService.submitVoteRecord(data)
  }

  return (
    <VoteEntryForm
      series={series}
      chapters={chapters}
      onSubmit={handleSubmit}
    />
  )
}
```

---

## Validation Schemas

All schemas are defined in `/lib/validation.ts` using Zod:

```typescript
import { z } from 'zod'

export const seriesProposalSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề là bắt buộc')
    .max(100, 'Tiêu đề phải ≤ 100 ký tự'),
  genre: z.string().min(1, 'Thể loại là bắt buộc'),
  publicationType: z.enum(['Weekly', 'Monthly', 'One-Shot'], {
    message: 'Hình thức xuất bản là bắt buộc',
  }),
  synopsis: z
    .string()
    .min(200, 'Tóm tắt cốt truyện phải ≥ 200 ký tự')
    .max(2000, 'Tóm tắt cốt truyện phải ≤ 2000 ký tự'),
  sampleFileUrl: z.string(),
  coverImageUrl: z.string().url('Đường dẫn hình ảnh không hợp lệ').optional().or(z.literal('')),
  sourceZipFileAssetId: z.string().optional().nullable(),
})
```

## Constants & Business Rules

Located in `/lib/constants.ts`:

```typescript
export const CHAPTER_DEADLINE_DAYS_BEFORE = 14
export const VOTING_QUORUM_REQUIRED = 3
export const MAX_REVISION_CYCLES = 3
export const BOTTOM_PERCENTILE_FOR_CANCELLATION = 20
```

## Business Logic Utilities

Helper functions in `/lib/business-logic.ts`:

- `calculateChapterDeadline(publicationDate)` - Returns deadline (pubDate - 14 days)
- `calculateVoteScore(voteCount, readerCount)` - Returns percentage score
- `isChapterOverdue(deadline)` - Returns boolean
- `formatDate(date)` - Returns formatted date string
- `calculateChapterProgress(approvedPages, totalPages)` - Returns percentage
- `isBelowCancellationThreshold(score, allScores)` - Checks if in bottom 20%
- `areAllPagesApproved(pageStatuses)` - Validates submission readiness
- `determineSeriesStatus(approvalsCount, rejectionsCount)` - Returns series status

## Integration with State Management

Forms can integrate with Zustand stores:

```tsx
import { useAuthStore, useSeriesStore } from '@/store'

export function SeriesProposalForm() {
  const { user } = useAuthStore()
  const { addProposal } = useSeriesStore()

  const handleSubmit = async (data: SeriesProposalInput) => {
    const proposal = {
      ...data,
      createdBy: user.id,
    }
    addProposal(proposal)
  }

  // ...
}
```

## Demo Page

A working demo of all forms is available at: `/dashboard/forms-demo`

This page showcases:
- All four forms in a tabbed interface
- Real-time validation feedback
- Activity log of form submissions
- Sample data for dropdowns

## Next Steps (Tuần 2)

- [ ] Create role-based dashboards
- [ ] Implement read-only list views with mock data
- [ ] Add pagination and filtering
- [ ] Create mock API responses (MSW)
- [ ] Setup state management stores
