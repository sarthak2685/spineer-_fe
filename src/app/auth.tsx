import { createContext, useContext, useEffect, useState } from 'react';
import { client, User } from '../api/client';

interface AuthState {
  user: User | null;
  ready: boolean;
  setSession: (user: User, accessToken: string) => void;
  clear: () => Promise<void>;
}

const Ctx = createContext<AuthState>({ user: null, ready: false, setSession: () => undefined, clear: async () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    client.me().then((res) => setUser(res.user)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  return (
    <Ctx.Provider value={{
      user,
      ready,
      setSession: (next, accessToken) => { localStorage.setItem('rs_token', accessToken); setUser(next); },
      clear: async () => { await client.logout().catch(() => undefined); localStorage.removeItem('rs_token'); setUser(null); },
    }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }

export function homeFor(role?: string) {
  if (role === 'SuperAdmin') return '/super/dashboard';
  if (role === 'BusinessAdmin') return '/business/dashboard';
  if (role === 'Customer') return '/customer/dashboard';
  return '/login';
}
