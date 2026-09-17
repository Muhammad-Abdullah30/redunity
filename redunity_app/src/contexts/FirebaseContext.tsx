import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase-config';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  requestRecovery: (name: string, phone: string) => Promise<void>;
  recoverAccount: (redunityId: string, phone: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  bloodGroup: string;
  city: string;
  country?: string;
  redunityId: string;
  societyId?: string;
}


const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('FirebaseContext - Setting up auth state listener');
    
    if (!auth) {
      console.error('Firebase Auth is not available');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized');

      let email = identifier.trim();
      if (!email.includes('@')) {
        const cleanDigits = identifier.replace(/\D/g, '');
        if (cleanDigits.length >= 10) {
          email = `${cleanDigits}@redunity.org`;
        } else {
          email = `${identifier.trim().toLowerCase()}@redunity.org`;
        }
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        throw new Error('Invalid phone/email/ID or password.');
      }
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const cleanDigits = userData.phone.replace(/\D/g, '');
      const email = `${cleanDigits}@redunity.org`;

      // Check if phone number is already registered in firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', userData.phone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('An account with this phone number already exists.');
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      const uid = userCredential.user.uid;

      const userProfile = {
        name: userData.name.trim(),
        phone: userData.phone,
        bloodGroup: userData.bloodGroup,
        city: userData.city,
        country: userData.country || 'Pakistan',
        redunityId: userData.redunityId,
        uid: uid,
        willingToDonate: true,
        role: 'donor',
        status: 'active',
        societyId: userData.societyId || null,
        createdAt: serverTimestamp()
      };


      // Store ONE document keyed by the Firebase Auth UID.
      // redunityId is saved as a field inside the document for lookups/recovery.
      await setDoc(doc(db, 'users', uid), userProfile);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('An account with this phone number already exists.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const requestRecovery = async (name: string, phone: string) => {
    try {
      // Log recovery request to interactions collection
      await addDoc(collection(db, 'interactions'), {
        fromUser: {
          uid: 'guest',
          name,
          phone,
          role: 'guest'
        },
        toUser: {
          id: 'admin',
          name: 'RedUnity Support Team',
          bloodGroup: 'All',
          type: 'recovery'
        },
        method: 'id_recovery_request',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Recovery request error:', error);
      throw error;
    }
  };

  const recoverAccount = async (redunityId: string, phone: string) => {
    try {
      // Query for the user by their redunityId field (not as a document key)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('redunityId', '==', redunityId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userData = querySnapshot.docs[0].data();
      
      // Check if phone matches (handle multiple formats)
      const phoneVariants = [
        phone,
        phone.replace(/\D/g, ''),
        phone.startsWith('0') ? phone.substring(1) : phone,
        phone.startsWith('92') ? phone.substring(2) : phone,
        `+92${phone.replace(/\D/g, '')}`,
        `0${phone.replace(/\D/g, '')}`
      ];

      const phoneMatch = phoneVariants.some(variant => 
        userData.phone === variant || userData.phone?.includes(variant)
      );

      if (!phoneMatch) {
        throw new Error('Phone number does not match our records');
      }

      // Log successful recovery
      await addDoc(collection(db, 'interactions'), {
        fromUser: {
          uid: 'guest',
          name: userData.name,
          phone,
          redunityId,
          role: 'guest'
        },
        toUser: {
          id: 'admin',
          name: 'RedUnity Support Team',
          bloodGroup: 'All',
          type: 'recovery'
        },
        method: 'account_recovery_success',
        timestamp: serverTimestamp()
      });

      return userData;
    } catch (error) {
      console.error('Account recovery error:', error);
      throw error;
    }
  };

  const value: FirebaseContextType = {
    user,
    loading,
    login,
    register,
    signOut,
    requestRecovery,
    recoverAccount
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};