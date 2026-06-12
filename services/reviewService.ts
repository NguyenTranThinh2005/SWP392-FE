import { fetchAPI } from "./api";

export interface ProposalReview {
  id: string;
  seriesTitle: string;
  mangakaName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export const reviewService = {
  listReviews: async (): Promise<any> => {
    // Fetches board decisions for proposal review
    return fetchAPI<any>("/api/board-decisions");
  },
  
  submitReview: async (id: string, decision: 'APPROVED' | 'REJECTED', feedback: string): Promise<any> => {
    return fetchAPI<any>(`/api/board-decisions/${id}/special-decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision: decision === 'APPROVED' ? 'Approved' : 'Rejected',
        reason: feedback
      })
    });
  }
};

