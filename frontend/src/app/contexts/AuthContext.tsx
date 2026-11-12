import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  can_manage_users?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  completeGoogleLogin: (code: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });
  const [loading, setLoading] = useState(true);

  const setUserAndPersist = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("auth_user");
    }
  };

  useEffect(() => {
    // Verify token on mount
    if (token) {
      authApi
        .getUser()
        .then((res) => {
          setUserAndPersist(res.data);
        })
        .catch(() => {
          setToken(null);
          setUserAndPersist(null);
          localStorage.removeItem("auth_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    const { user: userData, token: authToken } = res.data;
    setUserAndPersist(userData);
    setToken(authToken);
    localStorage.setItem("auth_token", authToken);
    return userData;
  };

  const completeGoogleLogin = async (code: string): Promise<User> => {
    const res = await authApi.exchangeGoogleCode(code);
    const { user: userData, token: authToken } = res.data;
    setUserAndPersist(userData);
    setToken(authToken);
    localStorage.setItem("auth_token", authToken);
    return userData;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const res = await authApi.register(data);
    const { user: userData, token: authToken } = res.data;
    setUserAndPersist(userData);
    setToken(authToken);
    localStorage.setItem("auth_token", authToken);
    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors
    }
    setUserAndPersist(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        completeGoogleLogin,
        register,
        logout,
        loading,
        setUser: setUserAndPersist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
