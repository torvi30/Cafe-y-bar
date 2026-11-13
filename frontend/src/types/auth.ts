import type { Timestamp } from 'firebase/firestore';

export type Role = 'superadmin' | 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
  companyId: string | null; // null for superadmins or unassigned tenant users awaiting company binding
  createdAt?: Timestamp | string | null;
}

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: import('firebase/auth').User | null;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateAvatarUrl: (url: string) => Promise<void>;
}

