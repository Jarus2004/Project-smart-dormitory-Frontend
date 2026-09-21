import { createContext } from 'react';

export interface User {
  id: number;
  email: string;
  role: string;
  username?: string;
  lastLogin?: string;
  isOnline?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
