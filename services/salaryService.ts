import { fetchAPI } from './api'

export interface SalaryRecord {
  salaryRecordId: string
  assistantId: string
  assistantName?: string
  pageTaskId: string
  taskType?: string
  pageStart: number
  pageEnd: number
  pages: number
  rateAtApproval: number
  amount: number
  approvedAt: string
}

export const salaryService = {
  // Lay lich su luong. Assistant tu dong chi thay cua minh (BE phan quyen)
  async getSalaryRecords(assistantId?: string): Promise<SalaryRecord[]> {
    const query = assistantId ? `?assistantId=${assistantId}` : ''
    try {
      const res = await fetchAPI<any>(`/api/salary-records${query}`)
      const list = res?.data ?? res
      return Array.isArray(list) ? list : []
    } catch (err) {
      console.warn('Khong tai duoc lich su luong:', err)
      return []
    }
  }
}