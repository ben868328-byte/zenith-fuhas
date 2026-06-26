import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

import { ADMIN_EMAIL, UserProfile } from '../constants';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      const email = auth.currentUser?.email || '';
      const isLoggedAsAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        // Ensure role is up to date if email matches admin
        if (isLoggedAsAdmin && existingData.role !== 'admin') {
          try {
            await setDoc(docRef, { role: 'admin' }, { merge: true });
            setProfile({ ...existingData, role: 'admin' } as UserProfile);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, path);
          }
        } else {
          setProfile(existingData as UserProfile);
        }
      } else {
        // Create initial profile
        const initialProfile: UserProfile = {
          uid,
          email,
          displayName: auth.currentUser?.displayName || 'Student',
          isPremium: false,
          role: isLoggedAsAdmin ? 'admin' : 'student',
          enrolledCourses: []
        };
        try {
          await setDoc(docRef, {
            ...initialProfile,
            createdAt: serverTimestamp()
          });
          setProfile(initialProfile);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, path);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // First fetch/ensure profile exists
        await fetchProfile(user.uid);
        
        // Then listen for changes
        const docRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));
      } else {
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }
      setLoading(false);
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
