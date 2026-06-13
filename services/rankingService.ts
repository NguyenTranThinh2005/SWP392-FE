import { fetchAPI } from "./api";

export interface RankingItem {
  id: string;
  seriesTitle: string;
  genre: string;
  votes: number;
  readers: number;
  score: number;
  status: string;
  rank: number;
  period?: string;
}

export const rankingService = {
  getRankingSnapshots: async (period?: string): Promise<any> => {
    const url = period ? `/api/rankings?period=${encodeURIComponent(period)}` : "/api/rankings";
    return fetchAPI<any>(url, { suppressGlobalError: true } as any);
  },

  createVoteRecord: async (data: any): Promise<any> => {
    const payload = {
      seriesId: data.seriesId,
      voteCount: Number(data.voteCount || 0),
      readerCount: Number(data.readerCount || 0),
      period: data.period
    };
    return fetchAPI<any>("/api/vote-records", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  confirmVoteRecord: async (id: string): Promise<any> => {
    return fetchAPI<any>(`/api/vote-records/${id}/confirm`, {
      method: 'PUT'
    });
  }
};

