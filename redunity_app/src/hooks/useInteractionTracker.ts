import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from './useFirebase';

type InteractionMethod = 
  | 'whatsapp_click' 
  | 'call_click' 
  | 'blood_donation' 
  | 'blood_request_created' 
  | 'society_registered' 
  | 'society_donor_added' 
  | 'society_status_updated' 
  | 'availability_updated' 
  | 'account_registered' 
  | 'general';

interface InteractionData {
  method: InteractionMethod;
  toUser?: {
    id?: string;
    name: string;
  };
  additionalData?: any;
}

export const useInteractionTracker = () => {
  const { user, userProfile } = useAuth();

  const trackInteraction = async (data: InteractionData) => {
    try {
      await addDoc(collection(db, 'interactions'), {
        method: data.method,
        fromUser: userProfile ? {
          id: userProfile.uid || user?.uid || 'anonymous',
          name: userProfile.name || 'Anonymous User',
          role: userProfile.role || 'guest'
        } : {
          id: 'anonymous',
          name: 'Guest',
          role: 'guest'
        },
        toUser: data.toUser,
        additionalData: data.additionalData || null,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  return { trackInteraction };
};
