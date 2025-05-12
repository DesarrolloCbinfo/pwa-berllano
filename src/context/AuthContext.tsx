import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextProps {
  token: string | null;
  setAuthToken: (newToken: string | null) => void;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  logout: () => void; // Agregamos la función logout al contexto
  isAuthenticated: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);

  const setAuthToken = (newToken: string | null) => {
    setToken(newToken);
  };

  const logout = () => {
    // Lógica para cerrar la sesión
    // Por ejemplo, limpiar el token en localStorage
    localStorage.removeItem("token");
    setToken(null);
    // O realizar otras acciones necesarias para cerrar la sesión
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const contextValue: AuthContextProps = {
    token,
    setAuthToken,
    setToken,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
};

export { AuthContext, AuthProvider, useAuth };
