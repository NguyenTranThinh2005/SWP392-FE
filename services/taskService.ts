import { fetchAPI } from "./api";

export interface TaskItem {
  id: string;
  chapterId: string;
  type: string;
  pages: string;
  description: string;
  assistantName: string;
  status: 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected';
}

export const taskService = {
  getMangakaTasks: async (): Promise<any> => {
    return fetchAPI<any>("/api/page-tasks/mangaka", { suppressGlobalError: true } as any);
  },
  
  getAssistantTasks: async (): Promise<any> => {
    return fetchAPI<any>("/api/page-tasks/assistant", { suppressGlobalError: true } as any);
  },
  
  assignTask: async (data: any): Promise<any> => {
    const payload = {
      chapterId: data.chapterId,
      assistantId: data.assistantId === 'Unassigned' ? '00000000-0000-0000-0000-000000000000' : data.assistantId,
      pageStart: Number(data.pageStart || 1),
      pageEnd: Number(data.pageEnd || 3),
      taskType: data.type || data.taskType,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
    };
    return fetchAPI<any>("/api/page-tasks", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  
  submitWork: async (pageTaskId: string, data: any): Promise<any> => {
    const payload = {
      submittedFileAssetId: data.submittedFileAssetId || '88888888-8888-8888-8888-888888888888',
      note: data.note || data.submitDescription || 'Nộp trang vẽ'
    };
    return fetchAPI<any>(`/api/page-tasks/${pageTaskId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  
  updateSubmission: async (submissionId: string, status: string, rejectReason?: string): Promise<any> => {
    if (status === 'Approved') {
      return fetchAPI<any>(`/api/page-tasks/submissions/${submissionId}/approve`, {
        method: 'POST'
      });
    } else {
      const payload = {
        rejectReason: rejectReason || 'Cần vẽ lại chi tiết hơn.'
      };
      return fetchAPI<any>(`/api/page-tasks/submissions/${submissionId}/reject`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  }
};

