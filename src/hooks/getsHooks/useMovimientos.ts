import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";

import useConsumoApi from "../../hooks/useConsumoApi";
export const useMovimientos = () => {
  const { consumoApi } = useConsumoApi();
  const [dataMovimientos, setDataMovimientos] = useState<any[]>([]);

  const fetchMovimientos = async () => {
    try {
      const response: AxiosResponse<any[]> = await consumoApi.get("/api/TipoMovto?id=0");
      setDataMovimientos(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  return { dataMovimientos, fetchMovimientos };
};
