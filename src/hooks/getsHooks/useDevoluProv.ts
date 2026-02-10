import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import {MovimientoDevoResponse } from "../../models/DevolucionProvModel";
import useConsumoApi from "../../hooks/useConsumoApi";

interface Props {
  folio: string | number;
  sucursal: number;
}

export const useDevoluProv = ({ folio = "0", sucursal }: Props) => {
  const { consumoApi } = useConsumoApi();
  const [dataDevoluProv, setDevoluProv] = useState<MovimientoDevoResponse[]>([]);

  const fetchDevoluProv = async () => {
    try {
      const response: AxiosResponse<MovimientoDevoResponse[]> = await consumoApi.get(
        `/api/DevolucionProveedor/sp_detalle_devolucionProveedorSel?id=%25&suc=${sucursal}&folio=${folio}`
      );
      setDevoluProv(response.data);

    } catch (error) {
      console.error("Error en fetchDevoluProv:", error);
    }
  };

  useEffect(() => {
    if (!sucursal) return;
    fetchDevoluProv();
  }, [folio, sucursal]);

  return { dataDevoluProv, fetchDevoluProv, setDevoluProv };
};
