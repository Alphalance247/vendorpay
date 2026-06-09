import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './services/authService';
import apiClient from './apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedRole = localStorage.getItem('user_role');
    if (token && storedRole) {
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    try {
      const profileRes = await apiClient.get('/vendors/profile');
      const profile = profileRes.data;
      const userRole = profile.is_admin ? 'admin' : 'vendor';
      localStorage.setItem('user_role', userRole);
      setUser(profile);
      setRole(userRole);
      return userRole;
    } catch {
      const userRole = 'vendor';
      localStorage.setItem('user_role', userRole);
      setRole(userRole);
      return userRole;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);