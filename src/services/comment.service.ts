import { apiFetch } from '../api';
import type {
  CommentCreateRequest,
  CommentResponse,
  CommentUpdateRequest,
} from '../types';

export const CommentService = {
  createComment: async (projectId: string, taskId: string, data: CommentCreateRequest): Promise<CommentResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTaskComments: async (projectId: string, taskId: string): Promise<CommentResponse[]> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, { method: 'GET' });
  },

  updateComment: async (
    projectId: string,
    taskId: string,
    commentId: string,
    data: CommentUpdateRequest
  ): Promise<CommentResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteComment: async (projectId: string, taskId: string, commentId: string): Promise<void> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' });
  },
};
