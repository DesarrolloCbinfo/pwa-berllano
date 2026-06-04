import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type token = {
  claveDepartamento: number;
  clavePerfiles: number;
  contra: string;
  mensaje: string;
  nombre: string;
  usuario: string;
};

const useConsumoApiCartelera = () => {
  const { token } = useAuth();

  const getInitialTokenTemp = () => {
    const storedToken = localStorage.getItem("token");
    const item = storedToken ? JSON.parse(storedToken) : null;
    return item ? item : null;
  };

  const [tokenTemp, setTokenTemp] = useState<token | null>(getInitialTokenTemp);

  useEffect(() => {
    setTokenTemp(token);
  }, [token]);

  // Store tokenTemp in a ref so the interceptor always reads the latest token
  const tokenRef = useRef(tokenTemp);
  tokenRef.current = tokenTemp;

  const consumoApi = useMemo(() => {
    const api = axios.create({
      baseURL: "https://api.cbinformatica.net:9080",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    api.interceptors.request.use(
      (config) => {
        const authToken = tokenRef.current;
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        config.headers["Cache-Control"] = "no-cache";
        return config;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          console.error("Error de CORS:", error.message);
        }
        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  return { consumoApi };
};

export default useConsumoApiCartelera;
