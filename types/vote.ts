export interface VoteRecord {
  id: string
  seriesId: string
  chapterId: string
  readerCount: number
  voteCount: number
  confirmed: boolean
  calculatedScore?: number
}
