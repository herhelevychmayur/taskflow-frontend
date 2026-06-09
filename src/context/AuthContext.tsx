import React, { createContext, useContext, useState, useEffect } from 'react';


interface AuthContextType {
  token: string | null;
  userId: string | null;
  userRole: string | null;
  login: (token: string) => Promise<void> | void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }

    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [token, userId, userRole]);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken); // Ensure apiFetch uses the new token immediately

    try {
      // Decode JWT to get username/id safely
      const payloadBase64 = newToken.split('.')[1];
      if (payloadBase64) {
        // Fix for Base64Url encoding
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);

        // Don't fallback to payload.sub if it's not a UUID, otherwise the backend throws 400 Bad Request
        const idFromToken = payload.userId || payload.id || (payload.sub && payload.sub.includes('-') ? payload.sub : null);

        if (idFromToken) {
          // Fetch from /api/v1/users
          const response = await fetch(`http://localhost:8080/api/v1/users/${idFromToken}`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const user = await response.json();
            if (user && user.id) {
              setUserId(user.id);
              setUserRole(user.role);
            }
          } else {
            console.error('Failed to fetch user by ID:', await response.text());
          }
        } else {
          console.error('User ID not found in JWT payload. Backend forgot to add it to claims?');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user ID after login', err);
    }
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, userRole, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
