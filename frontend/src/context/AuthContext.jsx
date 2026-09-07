import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState(null); // Store backend auth errors

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
  });

  // Add token to all requests
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Fetch user info from Django backend
  const fetchUserInfo = async (token) => {
    try {
      const response = await api.get('/auth/me/');
      const { email, is_admin } = response.data;
      setUser({ email, is_admin });
      setIsAdmin(is_admin);
      setAuthError(null); // Clear any previous errors
      return true;
    } catch (err) {
      // Extract meaningful error message from backend
      let errorMsg = 'Authentication failed. Please contact support.';
      if (err.response && err.response.status === 403) {
        // The backend returns a detail in the response data
        errorMsg = err.response.data?.detail || err.response.data?.error || errorMsg;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      // Sign out from Supabase and clean up
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      setAuthToken(null);
      setUser(null);
      setIsAdmin(false);
      return false;
    }
  };

  const signIn = async (email, password) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.session) {
        const token = data.session.access_token;
        localStorage.setItem('supabase.auth.token', token);
        setAuthToken(token);
        
        // Validate with backend
        const success = await fetchUserInfo(token);
        if (!success) {
          // fetchUserInfo already signed out and set error, but we need to throw
          throw new Error(authError || 'Account validation failed.');
        }
        return data;
      }
      throw new Error('No session returned.');
    } catch (err) {
      // If error already set, rethrow; else set from error
      if (!authError) {
        setAuthError(err.message || 'Login failed. Please try again.');
      }
      throw err;
    }
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAuthToken(null);
    setAuthError(null);
    localStorage.removeItem('supabase.auth.token');
  };

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        localStorage.setItem('supabase.auth.token', token);
        setAuthToken(token);
        
        // Validate with backend
        const success = await fetchUserInfo(token);
        if (!success) {
          // fetchUserInfo already signed out and set error; we'll keep the error.
          // No need to redirect here; the login page will show authError.
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const token = session.access_token;
        localStorage.setItem('supabase.auth.token', token);
        setAuthToken(token);
        await fetchUserInfo(token);
      } else {
        localStorage.removeItem('supabase.auth.token');
        setUser(null);
        setIsAdmin(false);
        setAuthToken(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};