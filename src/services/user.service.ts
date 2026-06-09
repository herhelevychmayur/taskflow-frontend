import { apiFetch } from '../api';
import type { User } from '../types';

export const UserService = {
  getAllUsers: async (): Promise<User[]> => {
    return apiFetch('/users', { method: 'GET' });
  },

  getUserById: async (id: string): Promise<User> => {
    return apiFetch(`/users/${id}`, { method: 'GET' });
  },
};
