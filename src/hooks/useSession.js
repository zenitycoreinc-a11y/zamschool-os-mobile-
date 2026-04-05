import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession, onAuthStateChange } from '../services/authService.js';
import { getMyProfile } from '../services/profileService.js';

function shouldTreatAsMissingProfile(error) {
  const message = String(error || '').trim().toLowerCase();
  return message.includes('missing a shared profile') || message.includes('no profile row was found');
}

export function getSessionViewState({ session, profile, loading, profileResolved, error }) {
  if (loading || (session && profileResolved !== true)) {
    return 'loading';
  }

  if (!session) {
    return 'signed-out';
  }

  if (!profile) {
    if (error && !shouldTreatAsMissingProfile(error)) {
      return 'profile-error';
    }

    return 'missing-profile';
  }

  return 'ready';
}

export function useSession() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const profileRequestIdRef = useRef(0);
  const sessionRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const resolveProfile = useCallback(async (nextSession, reason, { blockApp = false, keepPreviousProfile = false } = {}) => {
    profileRequestIdRef.current += 1;
    const requestId = profileRequestIdRef.current;

    if (!nextSession) {
      if (!mountedRef.current || requestId !== profileRequestIdRef.current) {
        return null;
      }

      setProfile(null);
      setProfileResolved(true);
      setError('');
      return null;
    }

    if (blockApp) {
      setLoading(true);
    } else {
      setRefreshingProfile(true);
    }

    setProfileResolved(false);
    setError('');

    try {
      const nextProfile = await getMyProfile();

      if (!mountedRef.current || requestId !== profileRequestIdRef.current) {
        console.info('[useSession.resolveProfile()] Ignored stale profile result', { reason, requestId });
        return null;
      }

      setProfile(nextProfile);
      setProfileResolved(true);
      return nextProfile;
    } catch (e) {
      const nextError = e?.message || 'Failed to load profile.';

      if (!mountedRef.current || requestId !== profileRequestIdRef.current) {
        console.warn('[useSession.resolveProfile()] Ignored stale profile error', {
          reason,
          requestId,
          message: nextError,
        });
        return null;
      }

      console.warn('[useSession.resolveProfile()] Profile load failed', {
        reason,
        message: nextError,
      });
      setError(nextError);
      setProfileResolved(true);
      if (!keepPreviousProfile || !profileRef.current) {
        setProfile(null);
      }
      throw e;
    } finally {
      if (!mountedRef.current || requestId !== profileRequestIdRef.current) {
        return;
      }

      if (blockApp) {
        setLoading(false);
      } else {
        setRefreshingProfile(false);
      }
    }
  }, []);

  useEffect(() => {
    let subscription;
    async function bootstrap() {
      try {
        setLoading(true);
        setProfileResolved(false);
        setError('');
        const current = await getSession();
        if (!mountedRef.current) return;
        setSession(current);

        await resolveProfile(current, 'bootstrap', { blockApp: true });
      } catch (e) {
        if (mountedRef.current) {
          console.warn('[useSession.bootstrap()] Session bootstrap failed', {
            message: e?.message || 'Failed to initialize session.',
          });
          setError(e.message || 'Failed to initialize session.');
          setProfile(null);
          setProfileResolved(true);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    mountedRef.current = true;
    bootstrap();

    onAuthStateChange(async (nextSession) => {
      if (!mountedRef.current) return;
      setSession(nextSession);

      try {
        await resolveProfile(nextSession, 'auth-state-change', {
          blockApp: true,
          keepPreviousProfile: false,
        });
      } catch (e) {
        if (mountedRef.current) {
          setError(e.message || 'Failed to load profile.');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })
      .then((sub) => {
        subscription = sub;
      })
      .catch((e) => {
        if (mountedRef.current) {
          console.warn('[useSession.onAuthStateChange()] Subscription setup failed', {
            message: e?.message || 'Auth subscription failed.',
          });
          setError(e.message || 'Auth subscription failed.');
        }
      });

    return () => {
      mountedRef.current = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [resolveProfile]);

  return {
    session,
    profile,
    loading,
    refreshingProfile,
    profileResolved,
    error,
    setError,
    refreshProfile: async () => {
      return resolveProfile(sessionRef.current, 'manual-refresh', {
        blockApp: false,
        keepPreviousProfile: true,
      });
    },
  };
}
