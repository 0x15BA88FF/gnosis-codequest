import React, { createContext, useContext, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { storage } from './storage';
import { API_BASE_URL } from './api';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await storage.getItem('gnosis_token');
        const storedUser = await storage.getItem('gnosis_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load auth from storage:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        console.error('Logout API call failed:', e);
      }
    }

    setToken(null);
    setUser(null);
    await storage.removeItem('gnosis_token');
    await storage.removeItem('gnosis_user');

    router.replace('/');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const freshUser = {
          id: data.userId,
          email: data.email,
          displayName: data.displayName,
        };
        setUser(freshUser);
        await storage.setItem('gnosis_user', JSON.stringify(freshUser));
      } else if (response.status === 401) {
        await handleLogout();
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedFields };
      setUser(newUser);
      storage.setItem('gnosis_user', JSON.stringify(newUser));
    }
  };

  const handleLogin = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await storage.setItem('gnosis_token', newToken);
    await storage.setItem('gnosis_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}