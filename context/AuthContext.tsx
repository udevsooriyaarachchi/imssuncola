import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, UserPermissions } from '../types';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (u: string, p: string) => boolean;
  logout: () => void;
  register: (u: string, p: string, role: UserRole, permissions?: UserPermissions) => void;
  toggleUserStatus: (id: string) => void;
  updateUserPermissions: (id: string, permissions: UserPermissions) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FULL_PERMISSIONS: UserPermissions = {
  inventory: true,
  invoices: true,
  orders: true,
  reports: true,
  team: true
};

const DEFAULT_MEMBER_PERMISSIONS: UserPermissions = {
  inventory: true,
  invoices: true,
  orders: false,
  reports: false,
  team: false
};

const SEED_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    password: 'password', 
    role: UserRole.SUPERADMIN, 
    isActive: true,
    permissions: FULL_PERMISSIONS
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('invoice_users');
      let users = saved ? JSON.parse(saved) : SEED_USERS;
      
      if (!Array.isArray(users)) return SEED_USERS;

      // Migration: Ensure all users have complete permissions object
      users = users.map((u: any) => {
        const isSuperOrAdmin = u.role === UserRole.SUPERADMIN || u.role === UserRole.ADMIN;
        
        // If permissions missing or incomplete, fill defaults based on role
        const existingPerms = u.permissions || {};
        
        return {
          ...u,
          permissions: {
            inventory: existingPerms.inventory ?? true,
            invoices: existingPerms.invoices ?? true,
            // New fields default to true for existing admins, false for members
            orders: existingPerms.orders ?? isSuperOrAdmin,
            reports: existingPerms.reports ?? isSuperOrAdmin,
            team: existingPerms.team ?? isSuperOrAdmin
          }
        };
      });
      
      return users;
    } catch (e) {
      console.error("Failed to load users from storage, resetting.", e);
      return SEED_USERS;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('invoice_current_user');
      if (!saved) return null;
      
      const u = JSON.parse(saved);
      // Migration for current user session
      const isSuperOrAdmin = u.role === UserRole.SUPERADMIN || u.role === UserRole.ADMIN;
      const existingPerms = u.permissions || {};
      
      return { 
        ...u, 
        permissions: {
            inventory: existingPerms.inventory ?? true,
            invoices: existingPerms.invoices ?? true,
            orders: existingPerms.orders ?? isSuperOrAdmin,
            reports: existingPerms.reports ?? isSuperOrAdmin,
            team: existingPerms.team ?? isSuperOrAdmin
        }
      };
    } catch (e) {
      console.error("Failed to load session from storage.", e);
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('invoice_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (user) {
        // Sync current user with allUsers to catch permission updates
        const updated = allUsers.find(u => u.id === user.id);
        if (updated) {
           // If important fields changed, update local session state
           if (updated.isActive !== user.isActive || 
               JSON.stringify(updated.permissions) !== JSON.stringify(user.permissions) ||
               updated.role !== user.role) {
                setUser(updated);
                localStorage.setItem('invoice_current_user', JSON.stringify(updated));
           } else {
             localStorage.setItem('invoice_current_user', JSON.stringify(user));
           }
        }
    } else {
      localStorage.removeItem('invoice_current_user');
    }
  }, [user, allUsers]);

  const login = (username: string, password: string): boolean => {
    const found = allUsers.find(u => u.username === username && u.password === password);
    if (found) {
      if (!found.isActive) return false;
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const register = (username: string, password: string, role: UserRole, permissions?: UserPermissions) => {
    // Check if exists
    if (allUsers.find(u => u.username === username)) return;

    let defaultPerms = DEFAULT_MEMBER_PERMISSIONS;
    if (role === UserRole.SUPERADMIN || role === UserRole.ADMIN) {
        defaultPerms = FULL_PERMISSIONS;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      password,
      role,
      isActive: true,
      permissions: permissions || defaultPerms
    };
    setAllUsers(prev => [...prev, newUser]);
  };

  const toggleUserStatus = (id: string) => {
    setAllUsers(prev => prev.map(u => 
      u.id === id ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const updateUserPermissions = (id: string, permissions: UserPermissions) => {
    setAllUsers(prev => prev.map(u => 
      u.id === id ? { ...u, permissions } : u
    ));
  };

  const deleteUser = (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
    if (user?.id === id) logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      allUsers, 
      login, 
      logout, 
      register, 
      toggleUserStatus, 
      updateUserPermissions,
      deleteUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};