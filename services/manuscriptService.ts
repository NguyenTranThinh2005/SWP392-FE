import { fetchAPI } from "./api";

export interface ManuscriptVersion {
  version: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED';
  submittedAt: string;
  reviewedAt?: string;
  revisionNumber?: number;
  feedback?: string;
}

export interface ManuscriptItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  latestVersion: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED';
  progress: number;
  history?: ManuscriptVersion[];
  pages?: string[];
}

export interface Annotation {
  id: string;
  manuscriptId: string;
  versionName: string;
  text: string;
  createdAt: string;
}

export interface CreateAnnotationPayload {
  pageNo: number;
  positionX: number;
  positionY: number;
  content: string;
}

const mapBackendManuscriptStatus = (status: string): 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED' => {
  if (!status) return 'SUBMITTED';
  const clean = status.trim().toUpperCase();
  if (clean === 'APPROVED') return 'APPROVED';
  if (clean === 'REJECTED' || clean === 'REVISION REQUIRED' || clean === 'REVISIONREQUIRED') return 'REVISION REQUIRED';
  return 'SUBMITTED';
};

export const manuscriptService = {
  /**
   * Lấy danh sách tất cả các bản thảo từ Backend C# API
   */
  getManuscripts: async (): Promise<ManuscriptItem[]> => {
    const response = await fetchAPI<{ data: any[] } | any[]>('/api/manuscripts', { suppressGlobalError: true } as any);
    const dataList = (response as any).data || response;
    
    if (!Array.isArray(dataList)) return [];
    
    return dataList.map(m => {
      const historyList: ManuscriptVersion[] = (m.history || []).map((h: any) => ({
        version: h.versionLabel || `v${h.versionNo}`,
        status: mapBackendManuscriptStatus(h.status),
        submittedAt: h.submittedAt || new Date().toISOString(),
        reviewedAt: h.reviewedAt || undefined,
        feedback: h.revisionNotes || h.feedback || undefined,
        revisionNumber: h.revisionCount || undefined
      }));

      if (historyList.length === 0) {
        historyList.push({
          version: m.versionLabel || `v${m.versionNo || 1}`,
          status: mapBackendManuscriptStatus(m.status),
          submittedAt: m.submittedAt || new Date().toISOString(),
        });
      }

      return {
        id: m.manuscriptId || m.id,
        seriesId: m.seriesId || '',
        seriesTitle: m.seriesTitle || '',
        chapterNumber: m.chapterNo || m.chapterNumber || 1,
        chapterTitle: m.chapterTitle || '',
        latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
        status: mapBackendManuscriptStatus(m.status),
        progress: m.progress || 100,
        history: historyList,
        pages: m.pages || ['Page 1', 'Page 2', 'Page 3', 'Page 4']
      };
    });
  },

  /**
   * Lấy thông tin chi tiết một bản thảo theo ID
   */
  getManuscriptById: async (id: string): Promise<ManuscriptItem> => {
    const res = await fetchAPI<{ data: any } | any>(`/api/manuscripts/${id}`, { suppressGlobalError: true } as any);
    const m = res.data || res;
    
    const historyList: ManuscriptVersion[] = (m.history || []).map((h: any) => ({
      version: h.versionLabel || `v${h.versionNo}`,
      status: mapBackendManuscriptStatus(h.status),
      submittedAt: h.submittedAt || new Date().toISOString(),
      reviewedAt: h.reviewedAt || undefined,
      feedback: h.revisionNotes || h.feedback || undefined,
      revisionNumber: h.revisionCount || undefined
    }));

    if (historyList.length === 0) {
      historyList.push({
        version: m.versionLabel || `v${m.versionNo || 1}`,
        status: mapBackendManuscriptStatus(m.status),
        submittedAt: m.submittedAt || new Date().toISOString(),
      });
    }

    return {
      id: m.manuscriptId || m.id,
      seriesId: m.seriesId || '',
      seriesTitle: m.seriesTitle || '',
      chapterNumber: m.chapterNo || m.chapterNumber || 1,
      chapterTitle: m.chapterTitle || '',
      latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
      status: mapBackendManuscriptStatus(m.status),
      progress: m.progress || 100,
      history: historyList,
      pages: m.pages || ['Page 1', 'Page 2', 'Page 3', 'Page 4']
    };
  },

  /**
   * Mangaka nộp bản thảo thô hoàn thiện (POST /api/manuscripts)
   * Yêu cầu kiểm tra: 100% PageTask của chương phải ở trạng thái Approved (BR-04)
   */
  submitManuscript: async (data: { chapterId: string; fileUrl: string; notes?: string; seriesId?: string }) => {
    const payload = {
      seriesId: data.seriesId || '',
      chapterId: data.chapterId,
      fileUrl: data.fileUrl,
      notes: data.notes || "Bản thảo mới nộp"
    };
    return fetchAPI<any>("/api/manuscripts", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Nộp bản thảo mới theo đường dẫn chương (POST /api/chapters/{chapterId}/manuscripts)
   */
  submitManuscriptToChapter: async (chapterId: string, data: { fileUrl: string; notes?: string }) => {
    const payload = {
      fileUrl: data.fileUrl,
      notes: data.notes || "Bản thảo mới nộp"
    };
    return fetchAPI<any>(`/api/chapters/${chapterId}/manuscripts`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Bắt đầu đánh giá bản thảo (POST /api/manuscripts/{manuscriptId}/start-review)
   * @deprecated Endpoint không có trong API_CONTRACT.md. Xem updateStatus hoặc cập nhật qua PUT /api/manuscripts/{id}.
   */
  startReview: async (manuscriptId: string) => {
    return fetchAPI<any>(`/api/manuscripts/${manuscriptId}/start-review`, {
      method: 'POST'
    });
  },

  /**
   * Phê duyệt bản thảo (POST /api/manuscripts/{manuscriptId}/approve)
   * @deprecated Endpoint không có trong API_CONTRACT.md. Xem updateStatus hoặc cập nhật qua PUT /api/manuscripts/{id}.
   */
  approveManuscript: async (manuscriptId: string, feedback?: string) => {
    return fetchAPI<any>(`/api/manuscripts/${manuscriptId}/approve`, {
      method: 'POST',
      body: feedback ? JSON.stringify({ feedback }) : undefined
    });
  },

  /**
   * Yêu cầu sửa đổi bản thảo (POST /api/manuscripts/{manuscriptId}/request-revision)
   * @deprecated Endpoint không có trong API_CONTRACT.md. Xem updateStatus hoặc cập nhật qua PUT /api/manuscripts/{id}.
   */
  requestRevision: async (manuscriptId: string, feedback: string) => {
    return fetchAPI<any>(`/api/manuscripts/${manuscriptId}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ feedback })
    });
  },

  /**
   * Cập nhật trạng thái bản thảo (PUT /api/manuscripts/{id})
   * Được sử dụng để đồng bộ hóa trạng thái phê duyệt/sửa đổi
   */
  updateStatus: async (id: string, status: 'Approved' | 'Rejected', feedbackText: string) => {
    const payload = {
      status,
      feedback: feedbackText
    };
    return fetchAPI<any>(`/api/manuscripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Lấy danh sách ghi chú (annotations) của một bản thảo (GET /api/manuscripts/{manuscriptId}/annotations)
   */
  getAnnotations: async (manuscriptId: string): Promise<Annotation[]> => {
    const response = await fetchAPI<{ annotations: any[] } | any>(`/api/manuscripts/${manuscriptId}/annotations`, { suppressGlobalError: true } as any);
    const rawAnns = response.annotations || (Array.isArray(response) ? response : []);
    
    if (!Array.isArray(rawAnns)) return [];
    
    return rawAnns.map(a => ({
      id: a.annotationId || a.id,
      manuscriptId: a.manuscriptId || manuscriptId,
      versionName: `v${a.versionNo || 1}`,
      text: a.content || a.text,
      createdAt: a.createdAt || new Date().toISOString()
    }));
  },

  /**
   * Thêm ghi chú sửa đổi mới (POST /api/manuscripts/{manuscriptId}/annotations)
   */
  addAnnotation: async (manuscriptId: string, payload: CreateAnnotationPayload): Promise<any> => {
    return fetchAPI<any>(`/api/manuscripts/${manuscriptId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

