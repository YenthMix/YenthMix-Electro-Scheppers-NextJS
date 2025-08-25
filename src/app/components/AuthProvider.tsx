'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const USERS = [
  {
    username: process.env.NEXT_PUBLIC_USERNAME,
    password: process.env.NEXT_PUBLIC_PASSWORD,
    email: process.env.NEXT_PUBLIC_EMAIL,
    role: 'admin' as const
  },
  {
    username: process.env.NEXT_PUBLIC_USERNAME2,
    password: process.env.NEXT_PUBLIC_PASSWORD2,
    email: process.env.NEXT_PUBLIC_EMAIL2,
    role: 'user' as const
  }
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Restore user session from localStorage on page load
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verify the user still exists in our database
        const foundUser = USERS.find(
          u => u.username === parsedUser.username && u.email === parsedUser.email && u.role === parsedUser.role
        );
        if (foundUser) {
          setUser(parsedUser);
        } else {
          // User no longer exists, clear localStorage
          localStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (usernameOrEmail: string, password: string): boolean => {
    const foundUser = USERS.find(
      u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
    );
    
    if (foundUser && foundUser.username && foundUser.email && foundUser.password) {
      const userWithoutPassword = {
        username: foundUser.username,
        password: foundUser.password,
        email: foundUser.email,
        role: foundUser.role
      };
      setUser(userWithoutPassword);
      
      // Save to localStorage (without password for security)
      const userToSave = {
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role
      };
      localStorage.setItem('auth_user', JSON.stringify(userToSave));
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  // Don't render children until we've checked localStorage
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}