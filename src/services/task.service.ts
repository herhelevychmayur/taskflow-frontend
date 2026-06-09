import { apiFetch } from '../api';
import type {
  TaskCreateRequest,
  TaskResponse,
  TaskStatus,
  TaskPriority,
  TaskUpdateRequest,
  TaskStatusUpdateRequest,
  TaskAssignRequest,
} from '../types';

export const TaskService = {
  createTask: async (projectId: string, data: TaskCreateRequest): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProjectTasks: async (
    projectId: string,
    params?: { status?: TaskStatus; priority?: TaskPriority; assigneeId?: string }
  ): Promise<TaskResponse[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.assigneeId) query.append('assigneeId', params.assigneeId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiFetch(`/projects/${projectId}/tasks${queryString}`, { method: 'GET' });
  },

  getTask: async (projectId: string, taskId: string): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'GET' });
  },

  updateTask: async (projectId: string, taskId: string, data: TaskUpdateRequest): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateTaskStatus: async (projectId: string, taskId: string, data: TaskStatusUpdateRequest): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  assignTask: async (projectId: string, taskId: string, data: TaskAssignRequest): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/assignee`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  unassignTask: async (projectId: string, taskId: string): Promise<TaskResponse> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}/assignee`, { method: 'DELETE' });
  },

  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    return apiFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
  },
};
