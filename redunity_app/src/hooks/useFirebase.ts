import { useFirebase as useFirebaseContext } from '../contexts/FirebaseContext';
import { useUser } from '../contexts/UserContext';

// Re-export the Firebase context hook for convenience
export const useFirebase = useFirebaseContext;

// Custom hook for authentication operations
export const useAuth = () => {
  const { user, loading: authLoading, signOut } = useFirebase();
  const { userProfile, loading: profileLoading, refreshProfile } = useUser();

  return {
    user,
    userProfile,
    loading: authLoading || profileLoading,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin',
    isDonor: userProfile?.role === 'donor',
    isRequestor: userProfile?.role === 'requestor',
    isSocietyAdmin: userProfile?.role === 'society_admin' || Boolean(userProfile?.societyId),
    signOut,
    refreshProfile
  };
};

// Custom hook for blood donation operations
export const useBloodDonation = () => {
  const { user } = useFirebase();
  const { userProfile } = useUser();

  const canDonate = () => {
    if (!user || !userProfile) return false;
    return userProfile.role === 'donor' && userProfile.status === 'active';
  };

  const canRequest = () => {
    if (!user || !userProfile) return false;
    return userProfile.role === 'requestor' && userProfile.status === 'active';
  };

  return {
    canDonate,
    canRequest,
    userBloodGroup: userProfile?.bloodGroup,
    userCity: userProfile?.city
  };
};