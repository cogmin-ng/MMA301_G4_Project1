import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Khởi động ứng dụng bình thường: Yêu cầu đăng nhập
    setIsLoading(false);
  }, []);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login(identifier, password);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      await authService.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role) => {
    setIsLoading(true);
    try {
      const u = await authService.switchAccountByRole(role);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;
  const isAdmin = role === 'ADMIN';
  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isAdmin,
        isDoctor,
        isPatient,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
