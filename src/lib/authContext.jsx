import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './services/authService';
import apiClient from './apiClient';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = parseJwt(token);
      const storedRole = payload?.role ?? localStorage.getItem('user_role');
      if (storedRole) {
        setRole(storedRole);
        if (storedRole === 'vendor') {
          const stored = localStorage.getItem('is_onboarded');
          setIsOnboarded(stored === 'true');
        } else {
          setIsOnboarded(true);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    function handlePageShow(event) {
      // Back/forward navigation can restore the page from bfcache with
      // stale in-memory auth state (e.g. right after sign-out). Force a
      // fresh reload so the app re-checks localStorage from scratch.
      if (event.persisted) {
        window.location.reload();
      }
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    const payload = parseJwt(data.access_token);
    const userRole = payload?.role ?? 'vendor';

    localStorage.setItem('user_role', userRole);
    setRole(userRole);

    if (userRole === 'vendor') {
      try {
        const profileRes = await apiClient.get('/vendors/profile');
        const onboarded = profileRes.data.is_onboarded ?? false;
        setIsOnboarded(onboarded);
        localStorage.setItem('is_onboarded', String(onboarded));
      } catch {
        setIsOnboarded(false);
        localStorage.setItem('is_onboarded', 'false');
      }
    } else {
      setIsOnboarded(true);
      localStorage.setItem('is_onboarded', 'true');
    }

    return userRole;
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem('is_onboarded', 'true');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setRole(null);
    setIsOnboarded(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isOnboarded, loading, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);