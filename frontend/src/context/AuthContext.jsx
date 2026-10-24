import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { syncWithSupabase } from '../api/client';
import { supabase, isSupabaseConfigured, signOut } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage session
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }

    // 2. If Supabase configured, subscribe to auth state changes and sync database
    if (isSupabaseConfigured) {
      syncWithSupabase().catch(console.warn);
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const role = session.user.user_metadata?.role || 'student';
          const uData = {
            id: session.user.id,
            email: session.user.email,
            role,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            access_token: session.access_token,
          };
          setUser(uData);
          localStorage.setItem('erp_token', session.access_token);
          localStorage.setItem('erp_user', JSON.stringify(uData));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_user');
        }
      });

      setLoading(false);
      return () => {
        authListener?.subscription?.unsubscribe();
      };
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

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {}
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
