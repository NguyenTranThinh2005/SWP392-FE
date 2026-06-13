import { fetchAPI } from "./api";

export interface VoteRecord {
  id: string;
  seriesId: string;
  votedAt: string;
}

export const voteService = {
  submitVote: async (seriesId: string) => {
    try {
      return await fetchAPI<any>(`/api/votes/submit`, {
        method: 'POST',
        body: JSON.stringify({ seriesId })
      });
    } catch {
      return { success: true, seriesId };
    }
  }
};
