import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { isPlatformSuperadminEmail } from '../lib/constants';
import type { UserProfile, Role, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    // Verificar retorno de redirección OAuth si aplica
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect auth check:', err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentFbUser) => {
      setError(null);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!currentFbUser) {
        setFirebaseUser(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setFirebaseUser(currentFbUser);

      try {
        const userDocRef = doc(db, 'users', currentFbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        const isSuperadmin = isPlatformSuperadminEmail(currentFbUser.email);

        if (!userDocSnap.exists()) {
          // Provisioning del nuevo usuario en Firestore
          const initialProfile: UserProfile = {
            uid: currentFbUser.uid,
            email: currentFbUser.email || '',
            displayName: currentFbUser.displayName || null,
            avatarUrl: currentFbUser.photoURL || null,
            role: isSuperadmin ? 'superadmin' : 'user',
            companyId: null, // Usuarios recién creados inician SIN empresa asignada
          };

          await setDoc(userDocRef, {
            ...initialProfile,
            createdAt: serverTimestamp(),
          });

          setUser(initialProfile);
        } else {
          const data = userDocSnap.data();

          // Si el correo está en la lista de superadmins y no tenía el rol, elevar automáticamente
          if (isSuperadmin && data.role !== 'superadmin') {
            await updateDoc(userDocRef, {
              role: 'superadmin',
              updatedAt: serverTimestamp(),
            });
            data.role = 'superadmin';
          }

          setUser({
            uid: currentFbUser.uid,
            email: data.email || currentFbUser.email || '',
            displayName: data.displayName || currentFbUser.displayName || null,
            avatarUrl: data.avatarUrl || currentFbUser.photoURL || null,
            role: data.role as Role,
            companyId: data.companyId || null,
            createdAt: data.createdAt,
          });
        }

        // Suscripción en tiempo real al documento del usuario
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const updatedData = snap.data();
              setUser({
                uid: currentFbUser.uid,
                email: updatedData.email || currentFbUser.email || '',
                displayName: updatedData.displayName || currentFbUser.displayName || null,
                avatarUrl: updatedData.avatarUrl || currentFbUser.photoURL || null,
                role: updatedData.role as Role,
                companyId: updatedData.companyId || null,
                createdAt: updatedData.createdAt,
              });
            }
          },
          (err) => {
            console.warn('Error escuchando perfil de usuario:', err);
          }
        );
      } catch (err: any) {
        console.error('Error sincronizando perfil de usuario:', err);
        setError(err.message || 'Error al sincronizar perfil de usuario');
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setError(err.message);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const isSuperadmin = isPlatformSuperadminEmail(email);
      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(userDocRef, {
        uid: cred.user.uid,
        email,
        displayName,
        avatarUrl: null,
        role: isSuperadmin ? 'superadmin' : 'user',
        companyId: null, // Esperando asignación
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!firebaseUser) return;
    await updateProfile(firebaseUser, { displayName: name });
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { displayName: name });
    setUser((prev) => (prev ? { ...prev, displayName: name } : null));
  };

  const updateAvatarUrl = async (url: string) => {
    if (!firebaseUser) return;
    await updateProfile(firebaseUser, { photoURL: url });
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { avatarUrl: url });
    setUser((prev) => (prev ? { ...prev, avatarUrl: url } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        updateDisplayName,
        updateAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
