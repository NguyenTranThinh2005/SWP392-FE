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
    return fetchAPI<any>("/api/page-tasks/mangaka");
  },
  
  getAssistantTasks: async (): Promise<any> => {
    return fetchAPI<any>("/api/page-tasks/assistant");
  },
  
  assignTask: async (data: any): Promise<any> => {
    const payload = {
      chapterId: data.chapterId,
      manuscriptId: data.manuscriptId || '77777777-7777-7777-7777-777777777777',
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
      pageTaskId,
      versionNo: Number(data.versionNo || 1),
      submittedFileAssetId: data.submittedFileAssetId || '88888888-8888-8888-8888-888888888888',
      note: data.note || data.submitDescription || 'Nộp trang vẽ'
    };
    return fetchAPI<any>("/api/submissions", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  
  updateSubmission: async (submissionId: string, status: string, rejectReason?: string): Promise<any> => {
    const payload = {
      status,
      rejectReason: rejectReason || null
    };
    return fetchAPI<any>(`/api/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
};

