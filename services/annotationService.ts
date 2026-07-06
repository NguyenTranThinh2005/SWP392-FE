import { fetchAPI } from './api'

export interface SubmissionAnnotation {
  annotationId?: string
  pageNo: number
  positionX: number  // 0-1
  positionY: number  // 0-1
  content: string
}

export const annotationService = {
  // Tao 1 pin tren submission
  async createAnnotation(submissionId: string, pin: SubmissionAnnotation) {
    return fetchAPI(`/api/submissions/${submissionId}/annotations`, {
      method: 'POST',
      body: JSON.stringify({
        pageNo: pin.pageNo,
        positionX: pin.positionX,
        positionY: pin.positionY,
        content: pin.content,
      })
    })
  },

  // Lay tat ca pin cua 1 submission
  async getAnnotations(submissionId: string): Promise<SubmissionAnnotation[]> {
    try {
      const res = await fetchAPI<any>(`/api/submissions/${submissionId}/annotations`)
      const list = res?.data ?? res
      return Array.isArray(list) ? list : []
    } catch (err) {
      console.warn('Khong tai duoc annotations:', err)
      return []
    }
  }
}