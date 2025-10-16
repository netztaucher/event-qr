import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('scanner_token');
    if (token) {
      // Verify token with backend
      apiService.verifyToken()
        .then(response => {
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.user);
          } else {
            localStorage.removeItem('scanner_token');
          }
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('scanner_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        localStorage.setItem('scanner_token', response.token);
        setIsAuthenticated(true);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Anmeldung fehlgeschlagen' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Anmeldung fehlgeschlagen' };
    }
  };

  const logout = () => {
    localStorage.removeItem('scanner_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};