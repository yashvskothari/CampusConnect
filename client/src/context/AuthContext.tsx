import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../services';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: string; bio?: string; skills?: string[] }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const activeToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (activeToken) {
        try {
          const { data } = await authApi.me();
          setUser(data);
          sessionStorage.setItem('user', JSON.stringify(data));
          sessionStorage.setItem('token', activeToken);
        } catch {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    // Tab-isolated storage
    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  const signup = async (signupData: { name: string; email: string; password: string; role: string; bio?: string; skills?: string[] }) => {
    const { data } = await authApi.signup(signupData);
    setUser(data.user);
    setToken(data.token);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear tab-specific session so other tabs stay intact
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    sessionStorage.setItem('user', JSON.stringify(updated));
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
