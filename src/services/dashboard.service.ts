import { apiFetch } from '../api';
import type { DashboardStatsResponse, ProjectResponse, User } from '../types';

export const DashboardService = {
  getProjects: async (): Promise<ProjectResponse[]> => {
    return apiFetch('/dashboard/projects', { method: 'GET' });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    return apiFetch(`/dashboard/projects/${projectId}`, { method: 'DELETE' });
  },

  getUsers: async (): Promise<User[]> => {
    return apiFetch('/dashboard/users', { method: 'GET' });
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiFetch(`/dashboard/users/${userId}`, { method: 'DELETE' });
  },

  assignSuperadmin: async (userId: string): Promise<User> => {
    return apiFetch(`/dashboard/users/${userId}/superadmin`, { method: 'PATCH' });
  },

  demoteSuperadmin: async (userId: string): Promise<User> => {
    return apiFetch(`/dashboard/users/${userId}/demote`, { method: 'PATCH' });
  },

  getStats: async (): Promise<DashboardStatsResponse> => {
    return apiFetch('/dashboard/stats', { method: 'GET' });
  },
};
