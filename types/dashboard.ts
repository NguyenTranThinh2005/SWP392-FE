export interface DashboardSummary {
  totalSeries: number
  pendingReviews: number
  overdueChapters: number
  earningsEstimate?: number
}

export interface RoleDashboard {
  role: string
  summary: DashboardSummary
  items: unknown[]
}
