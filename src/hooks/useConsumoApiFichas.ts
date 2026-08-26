import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Token = {
  claveDepartamento: number;
  clavePerfiles: number;
  contra: string;
  mensaje: string;
  nombre: string;
  usuario: string;
};

const useConsumoApiFichas = () => {
  const { token } = useAuth();

  const getInitialToken = () => {
    const storedToken = localStorage.getItem("token");
    return storedToken ? JSON.parse(storedToken) : null;
  };

  const [tokenActual, setTokenActual] = useState<Token | null>(getInitialToken);
  const tokenRef = useRef(tokenActual);
  tokenRef.current = tokenActual;

  useEffect(() => {
    setTokenActual(token);
  }, [token]);

  const consumoApi = useMemo(() => {
    const api = axios.create({
      baseURL: "https://api.cbinformatica.net:8079/",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    api.interceptors.request.use(
      (config) => {
        if (tokenRef.current) {
          config.headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        config.headers["Cache-Control"] = "no-cache";
        return config;
      },
      (error) => Promise.reject(error),
    );

    return api;
  }, []);

  return { consumoApi };
};

export default useConsumoApiFichas;
