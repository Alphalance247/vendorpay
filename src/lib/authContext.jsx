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
  const [companySlug, setCompanySlug] = useState(null);
  const [loading, setLoading] = useState(true);

  // For flows that already have tokens from somewhere other than the login
  // endpoint (e.g. completing company sign-up, or picking up tokens bootstrapped
  // across a subdomain redirect below) — same bookkeeping as login(), minus the
  // API call. Declared before the mount effect below since it's used there.
  const loginWithTokens = (accessToken, refreshToken, slug) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    const payload = parseJwt(accessToken);
    const userRole = payload?.role ?? 'admin';

    localStorage.setItem('user_role', userRole);
    setRole(userRole);
    setIsOnboarded(true);
    localStorage.setItem('is_onboarded', 'true');

    if (slug) {
      localStorage.setItem('company_slug', slug);
      setCompanySlug(slug);
    }

    return userRole;
  };

  useEffect(() => {
    // Landed here via a cross-subdomain redirect (e.g. after logging in on
    // the root domain and being sent to the company's own subdomain) —
    // localStorage doesn't carry across origins, so the tokens travel in
    // the URL instead. Pick them up, then scrub them from the address bar.
    const params = new URLSearchParams(window.location.search);
    const bootstrapAccessToken = params.get('access_token');
    const bootstrapRefreshToken = params.get('refresh_token');

    if (bootstrapAccessToken && bootstrapRefreshToken) {
      loginWithTokens(
        bootstrapAccessToken,
        bootstrapRefreshToken,
        params.get('company_slug'),
      );

      params.delete('access_token');
      params.delete('refresh_token');
      params.delete('company_slug');
      const query = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (query ? `?${query}` : '') + window.location.hash,
      );

      setLoading(false);
      return;
    }

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
      setCompanySlug(localStorage.getItem('company_slug'));
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

    if (data.company_slug) {
      localStorage.setItem('company_slug', data.company_slug);
      setCompanySlug(data.company_slug);
    }

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

    return {
      role: userRole,
      companySlug: data.company_slug ?? null,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
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
    setCompanySlug(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isOnboarded, companySlug, loading, login, loginWithTokens, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);