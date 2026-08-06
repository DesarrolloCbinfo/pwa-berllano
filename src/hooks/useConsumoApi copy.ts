import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const useConsumoApi = () => {
  const { token } = useAuth();

  // Separate initialization code for tokenTemp
  const getInitialTokenTemp = () => {
    const item = localStorage.getItem("token");
    return item ? JSON.parse(item) : null;
  };

  const [tokenTemp, setTokenTemp] = useState<string | null>(getInitialTokenTemp);

  useEffect(() => {
    setTokenTemp(token);
  }, [token]);

  useEffect(() => {
    setrTempToken(tokenTemp);
  }, [tokenTemp]);

  const setrTempToken = (newToken: string | null) => {
    // Perform actions with the new token here
//    console.log("New token:", newToken);
  };

  const consumoApi = axios.create({
    baseURL: "https://217.216.95.62:5001/:9004/api/TREBOL",
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

export default useConsumoApi;