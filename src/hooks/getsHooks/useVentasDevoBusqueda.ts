import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { MovimientoBusqueda } from "../../models/MovimientoDiversoModel";
import useConsumoApi from "../../hooks/useConsumoApi";

interface Props {
  f1: string;
  f2: string;
  sucursal: number;
}

export const useVentasDevoBusqueda = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { consumoApi } = useConsumoApi();
  const fetchVentas = async ({
    sucursal,
    f1,
    f2,
    cliente,
    folioVta,
  }: {
    sucursal: number;
    f1: string;
    f2: string;
    cliente: number;
    folioVta: number;
  }) => {
    setLoading(true);
    try {
      const response =  await consumoApi.get(
        `/api/catReportes/sp_ventaBusquedaDevo`,
        {
          params: {
            suc: sucursal,
            f1,
            f2,
            cliente,
            folioVta,
          },
        }
      );
      setVentas(response.data);
    } catch (error) {
      console.error("❌ Error al buscar ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ventas, fetchVentas, loading };
};
