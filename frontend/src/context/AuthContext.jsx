import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with /auth/me in background
        client.get('/auth/me')
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('erp_user', JSON.stringify(res.data));
          })
          .catch(() => {
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    const { access_token, ...userData } = res.data;
    localStorage.setItem('erp_token', access_token);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
