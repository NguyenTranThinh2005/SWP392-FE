/**
 * TypeScript Data Transfer Objects (DTOs) for MangaHub.
 * These interfaces map precisely to the C# Backend DTO classes
 * in MangaManagementSystem.Business.DTOs.
 */

// Generic Base Response
export interface BaseResponse<T> {
  data?: T;
  message?: string;
}

// ==========================================
// 1. Auth & User DTOs
// ==========================================

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  displayName: string;
  password?: string;
  roleId: string;
  assignedFromUserId?: string; // Optional assigned Editor ID for Mangaka
}

export interface RegisterInput {
  name: string;
  username: string;
  role: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  userName: string;
  displayName: string;
  roleName: string;
  tokenExpiry: string;
}

export interface UserResponse {
  userId: string;
  userName: string;
  displayName: string;
  email: string;
  roleName: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  createdAt: string;
  deletedAt?: string | null;
}

// ==========================================
// 2. Series & Proposal DTOs
// ==========================================

export interface CreateSeriesRequest {
  title: string;
  synopsis: string;
  publicationType: string;
  genreIds: string[];
  sourceZipFileAssetId?: string | null;
  samplePageFileAssetIds?: string[];
}

export interface UpdateSeriesRequest {
  title?: string;
  synopsis?: string;
  publicationType?: string;
  genreIds?: string[];
}

export interface ProposalPageResponse {
  proposalPageId: string;
  seriesId: string;
  pageNo: number;
  previewFileAssetId: string;
  createdAt: string;
  url?: string; // Resolved public URL
}

export interface FileAssetResponse {
  fileAssetId: string;
  bucketName: string;
  objectPath: string;
  originalFileName: string;
  storedFileName: string;
  extension: string;
  fileSizeBytes: number;
  mimeType: string;
  publicUrl?: string;
}

export interface SeriesResponse {
  seriesId: string;
  title: string;
  synopsis: string;
  publicationType: string;
  status: string;
  coverImageUrl?: string | null;
  mangakaId: string;
  mangakaName?: string;
  assignedEditorId?: string | null;
  assignedEditorName?: string | null;
  rejectReason?: string | null;
  sourceZipFileAssetId?: string | null;
  sourceZipFile?: FileAssetResponse | null;
  sourceZipPublicUrl?: string | null;
  proposalPages?: ProposalPageResponse[];
  createdAt: string;
}

export interface GenreResponse {
  genreId: string;
  title: string;
  description?: string;
}

export interface RoleResponse {
  roleId: string;
  roleName: string;
  description?: string;
}

// ==========================================
// 3. Chapters & Tasks DTOs
// ==========================================

export interface CreateChapterRequest {
  seriesId: string;
  number: number;
  title: string;
  totalPages: number;
  publicationDate: string;
  synopsis?: string;
  notes?: string;
}

export interface ChapterResponse {
  chapterId: string;
  seriesId: string;
  number: number;
  title: string;
  status: 'Draft' | 'In Progress' | 'Ready for Editor' | 'Published';
  totalPages: number;
  publicationDate: string;
  deadline: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  chapterId: string;
  manuscriptId?: string; // Guid
  assistantId: string; // Guid
  pageStart: number;
  pageEnd: number;
  taskType: string;
  description: string;
  dueDate?: string | null; // ISO string
}

export interface PageTaskResponse {
  pageTaskId: string;
  chapterId: string;
  manuscriptId: string;
  assistantId: string;
  assistantName?: string;
  pageStart: number;
  pageEnd: number;
  taskType: string;
  description: string;
  status: 'Unassigned' | 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected';
  dueDate?: string | null;
  assignedAt?: string | null;
  createdAt: string;
}

export interface SubmitTaskRequest {
  pageTaskId: string;
  versionNo: number;
  submittedFileAssetId: string;
  note?: string;
}

// ==========================================
// 4. Board Decisions & Votes DTOs
// ==========================================

export interface BoardDecisionResponse {
  boardDecisionId: string;
  seriesId: string;
  status: 'Open' | 'Approved' | 'Rejected' | 'Expired';
  deadline: string;
  createdAt: string;
}

export interface BoardVoteRequest {
  voteValue: boolean;
  comment: string;
}

export interface BoardVoteResponse {
  boardVoteId: string;
  boardDecisionId: string;
  userId: string;
  userName?: string;
  voteValue: boolean;
  comment: string;
  votedAt: string;
}
