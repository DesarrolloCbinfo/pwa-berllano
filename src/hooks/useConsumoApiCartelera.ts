import { useEffect, useState } from "react";
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

  useEffect(() => {
    setrTempToken(tokenTemp);
  }, [tokenTemp]);

  const setrTempToken = (newToken: token | null) => {
    return newToken;
  };

  const consumoApi = axios.create({
    baseURL: "https://localhost:7047",
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  consumoApi.interceptors.request.use(
    (config) => {
      const authToken = tokenTemp;
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

  return { consumoApi };
};

export default useConsumoApiCartelera;
