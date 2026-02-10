import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { CompraProveedor } from "../../models/CompraProveedor";
import { CompraSeleccion } from "../../models/CompraSeleccion";
import useConsumoApi from "../../hooks/useConsumoApi";
interface Props {
  fecha1: string;
  fecha2: string;
  sucursal: number;
  cia: number;
}
export const useComprasSeleccion = ({ fecha1, fecha2, sucursal, cia }: Props) => {
  const { consumoApi } = useConsumoApi();
  const [dataComprasSeleccion, setDataComprasSeleccion] = useState<CompraSeleccion[]>([]);
  
  const fetchComprasSeleccion = async () => {
    try {
      const response: AxiosResponse<any[]> = await consumoApi.get(
        `/api/Compras/CompraListaSel`,
        {
          params: {
            cia: cia,
            sucursal: sucursal,
            f1: fecha1 ? fecha1 : "2023-01-01",
            f2: fecha2 ? fecha2 : "2070-12-12",
          },
        }
      );
      setDataComprasSeleccion(response.data);
    } catch (error) {
      console.error("Error al obtener las compras:", error);
    }
  };

  useEffect(() => {
    if(!sucursal) return;
    fetchComprasSeleccion();
  }, [fecha1, fecha2, sucursal]);

  return { dataComprasSeleccion, fetchComprasSeleccion };
};
