import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { MovimientoDevoBusqueda} from "../../models/DevolucionProvModel";
import useConsumoApi from "../../hooks/useConsumoApi";

interface Props {
  f1: string;
  f2: string;
  sucursal: number;
}
export const useDevoProveedoresBusqueda= () => {
  const [dataDevoProveedoresBusqueda, setDevoProveedoresBusqueda] = useState<MovimientoDevoBusqueda[]>([]);
  const { consumoApi } = useConsumoApi();

  const fetchDevoProveedoresBusquedas = async (f1: string, f2: string, sucursal: number) => {
    try {
      const response: AxiosResponse<MovimientoDevoBusqueda[]> = await consumoApi.get(
        `/api/DevolucionProveedor/sp_detalleDevolucionProveedosBusqueda?f1=${f1}&f2=${f2}&suc=${sucursal}`
      );
      setDevoProveedoresBusqueda(response.data);
      console.log("✅ Ajustes recibidos:", response.data);
    } catch (error) {
      console.error("❌ Error al obtener ajustes:", error);
    }
  };

  return { dataDevoProveedoresBusqueda, fetchDevoProveedoresBusquedas };
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
