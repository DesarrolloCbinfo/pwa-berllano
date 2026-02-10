import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { MovimientoBusqueda } from "../../models/MovimientoDiversoModel";
import useConsumoApi from "../../hooks/useConsumoApi";

interface Props {
  f1: string;
  f2: string;
  sucursal: number;
}
export const useAjusteBusqueda = () => {
  const [dataAjustesBusquedas, setAjustesBusquedas] = useState<MovimientoBusqueda[]>([]);
  const { consumoApi } = useConsumoApi();

  const fetchAjustesBusquedas = async (f1: string, f2: string, sucursal: number) => {
    try {
      const response: AxiosResponse<MovimientoBusqueda[]> = await consumoApi.get(
        `/api/DetalleAjustes/AjusteDialogo?f1=${f1}&f2=${f2}&suc=${sucursal}`
      );
      setAjustesBusquedas(response.data);
      console.log("✅ Ajustes recibidos:", response.data);
    } catch (error) {
      console.error("❌ Error al obtener ajustes:", error);
    }
  };

  return { dataAjustesBusquedas, fetchAjustesBusquedas };
};


// export const useAjusteBusqueda = ({ f1, f2, sucursal }: Props) => {
//   const [dataAjustesBusquedas, setAjustesBusquedas] = useState<MovimientoBusqueda[]>([]);
//   const { consumoApi } = useConsumoApi();

//   const fetchAjustesBusquedas = async () => {
//     try {
//       const response: AxiosResponse<MovimientoBusqueda[]> = await consumoApi.get(
//         `/api/DetalleAjustes/AjusteDialogo?f1=${f1 ? f1.replaceAll("-", "") : "20230101"}&f2=${f2 ? f2.replaceAll("-", "") : "20301212"}&suc=${sucursal}`
//       );
//       setAjustesBusquedas(response.data);
//       console.log("Ajustes recibidos:", response.data);
//     } catch (error) {
//       console.error("Error al obtener ajustes:", error);
//     }
//   };

//  useEffect(() => {
//   if (!sucursal || !f1 || !f2) return;
//   fetchAjustesBusquedas();
// }, [f1, f2, sucursal]);

//   return { dataAjustesBusquedas, fetchAjustesBusquedas };
// };
