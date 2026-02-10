import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import useConsumoApi from "../hooks/useConsumoApi";
import { CorteActual } from "../models/Corte"; // Asegúrate de que tenga corte y corteParcial como propiedades

export const useCorteActual = (suc: number, caja: number) => {
  const { consumoApi } = useConsumoApi();
  const [dataCorteActual, setDataCorteActual] = useState<CorteActual | null>(null);

  const fetchCorteActual = async () => {
    try {
      const response: AxiosResponse<CorteActual> = await consumoApi.get(
        `/api/DetalleCorte/sp_corteActual?suc=${suc}&caja=${caja}`
      );
      setDataCorteActual(response.data);
      console.log("Corte actual:", response.data);
    } catch (error) {
      console.error("Error al obtener corte actual:", error);
    }
  };

  useEffect(() => {
    if (!suc || !caja) return;
    fetchCorteActual();
  }, [suc, caja]);

  return { dataCorteActual, fetchCorteActual };
};
