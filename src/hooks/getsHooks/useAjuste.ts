import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { MovimientoResponse } from "../../models/MovimientoDiversoModel";
import useConsumoApi from "../../hooks/useConsumoApi";

interface Props {
  folio: string | number;
  sucursal: number;
}

export const useAjuste = ({ folio = "0", sucursal }: Props) => {
  const { consumoApi } = useConsumoApi();
  const [dataAjustes, setAjustes] = useState<MovimientoResponse[]>([]);

  const fetchAjustes = async () => {
    try {
      const response: AxiosResponse<MovimientoResponse[]> = await consumoApi.get(
        `/api/DetalleAjustes/Ajuste?id=%25&suc=${sucursal}&folio=${folio}`
      );
      setAjustes(response.data);
    } catch (error) {
      console.error("Error en fetchAjustes:", error);
    }
  };

  useEffect(() => {
    if (!sucursal) return;
    fetchAjustes();
  }, [folio, sucursal]);

  return { dataAjustes, fetchAjustes, setAjustes };
};
