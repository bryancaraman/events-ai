'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: userData.displayName || firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: userData.createdAt?.toDate() || new Date(),
          });
        } else {
          // Create user document if it doesn't exist
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: new Date(),
          });
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: new Date(),
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 