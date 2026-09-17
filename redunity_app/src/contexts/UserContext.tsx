import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useFirebase } from './FirebaseContext';

interface UserProfile {
  redunityId: string;
  name: string;
  phone: string;
  bloodGroup: string;
  city: string;
  role: 'donor' | 'recipient' | 'requestor' | 'admin' | 'society_admin';
  status: 'active' | 'inactive';
  willingToDonate?: boolean;
  photoURL?: string;
  uid?: string;
  societyId?: string;
  createdAt?: any;
}

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    setLoading(true);
    try {
      // 1. Try to fetch directly by user UID document
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        setUserProfile(userData);
        setLoading(false);
        return;
      }

      // 2. Query by uid field inside document
      const usersRef = collection(db, 'users');
      const uidQuery = query(usersRef, where('uid', '==', user.uid));
      const uidSnapshot = await getDocs(uidQuery);
      if (!uidSnapshot.empty) {
        const userData = uidSnapshot.docs[0].data() as UserProfile;
        setUserProfile(userData);
        setLoading(false);
        return;
      }

      // 3. Fallback: derive phone number from email (digits before @redunity.org)
      let phoneFromEmail = '';
      if (user.email && user.email.includes('@redunity.org')) {
        phoneFromEmail = user.email.split('@')[0];
      }

      const searchPhone = user.phoneNumber || phoneFromEmail;
      if (searchPhone) {
        const phoneQuery = query(usersRef, where('phone', '==', searchPhone));
        const phoneSnapshot = await getDocs(phoneQuery);
        
        if (!phoneSnapshot.empty) {
          const userData = phoneSnapshot.docs[0].data() as UserProfile;
          setUserProfile(userData);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    refreshProfile();

    // Attach real-time snapshot listener so admin approvals/role changes update instantly
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    }, (err) => {
      console.warn('User profile real-time snapshot listener error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  const value: UserContextType = {
    userProfile,
    loading,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};