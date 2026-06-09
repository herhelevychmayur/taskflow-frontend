import { apiFetch } from '../api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const AuthService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
