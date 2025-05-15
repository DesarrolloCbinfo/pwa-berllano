import React, { createContext, useContext, useState, ReactNode } from "react";

type token = {
  claveDepartamento: number;
  clavePerfiles: number;
  contra: string;
  mensaje: string;
  nombre: string;
  usuario: string;
};

interface AuthContextProps {
  token: token | null;
  setAuthToken: (newToken: token | null) => void;
  setToken: React.Dispatch<React.SetStateAction<token | null>>;
  logout: () => void; // Agregamos la función logout al contexto
  isAuthenticated: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<token | null>(() => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return null;

      const parsedToken = JSON.parse(storedToken);
      // Validate that the parsed token has the expected structure
      if (typeof parsedToken === "object" && parsedToken !== null) {
        return parsedToken;
      }
      return null;
    } catch (error) {
      // If there's an error parsing the token, remove the invalid token
      console.error("Error parsing stored token:", error);
      localStorage.removeItem("token");
      return null;
    }
  });

  const setAuthToken = (newToken: token | null) => {
    if (newToken) {
      localStorage.setItem("token", JSON.stringify(newToken));
    } else {
      localStorage.removeItem("token");
    }
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
