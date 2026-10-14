import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, handleRedirectResult, syncUserProfileToFirestore } from '../lib/firebase';
import { UserProfile } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEYS = {
  USER_PROFILE: 'unlupa_user_profile_v2'
};

const defaultProfile: UserProfile = {
  id: 'guest',
  email: 'guest@unlupa.id',
  fullName: 'Tamu',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
  quranSpaceCode: 'unlupa_guest_space',
  role: 'user',
  plan: 'free',
};

export const useFirebaseAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('Error reading profile', e);
    }
    return defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    handleRedirectResult().then(user => {
      if (user) {
        setCurrentUser(user);
        syncUserProfileToFirestore(user);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfileToFirestore(user);
        setUserProfile(prev => ({
          ...prev,
          id: user.uid,
          email: user.email || prev.email,
          fullName: user.displayName || prev.fullName || 'Penghafal Qur\'an',
          avatarUrl: user.photoURL || prev.avatarUrl
        }));
      } else {
        setUserProfile(defaultProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  return { currentUser, userProfile, setUserProfile };
};
