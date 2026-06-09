import { apiFetch } from '../api';
import type {
  ProjectCreateRequest,
  ProjectResponse,
  ProjectMemberResponse,
  ProjectRole,
  ProjectMemberInviteResponse,
  InviteStatus,
  ProjectStatsResponse,
} from '../types';

export const ProjectService = {
  createProject: async (data: ProjectCreateRequest): Promise<ProjectResponse> => {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProject: async (projectId: string, data: ProjectCreateRequest): Promise<ProjectResponse> => {
    return apiFetch(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getProjects: async (): Promise<ProjectResponse[]> => {
    return apiFetch('/projects', { method: 'GET' });
  },

  getProject: async (projectId: string): Promise<ProjectResponse> => {
    return apiFetch(`/projects/${projectId}`, { method: 'GET' });
  },

  archiveProject: async (projectId: string, isArchived: boolean): Promise<void> => {
    return apiFetch(`/projects/${projectId}/archive?isArchived=${isArchived}`, { method: 'PATCH' });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    return apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
  },

  getMembers: async (projectId: string): Promise<ProjectMemberResponse[]> => {
    return apiFetch(`/projects/${projectId}/members`, { method: 'GET' });
  },

  getMemberRole: async (projectId: string): Promise<ProjectMemberResponse> => {
    return apiFetch(`/projects/${projectId}/role`, { method: 'GET' });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    return apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
  },

  updateMemberRole: async (projectId: string, userId: string, role: ProjectRole): Promise<ProjectMemberResponse> => {
    return apiFetch(`/projects/${projectId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(role),
    });
  },

  inviteMember: async (projectId: string, inviteeId: string): Promise<ProjectMemberInviteResponse> => {
    return apiFetch(`/projects/${projectId}/invites/${inviteeId}`, { method: 'POST' });
  },

  respondToInvite: async (inviteId: string, status: InviteStatus): Promise<ProjectMemberInviteResponse> => {
    return apiFetch(`/projects/invites/${inviteId}`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  },

  getInvitesByUser: async (): Promise<ProjectMemberInviteResponse[]> => {
    return apiFetch(`/projects/invites/user`, { method: 'GET' });
  },

  getInvitesByProject: async (projectId: string): Promise<ProjectMemberInviteResponse[]> => {
    return apiFetch(`/projects/${projectId}/invites`, { method: 'GET' });
  },

  getProjectStats: async (projectId: string): Promise<ProjectStatsResponse> => {
    return apiFetch(`/projects/${projectId}/stats`, { method: 'GET' });
  },
};
