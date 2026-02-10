import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
import { Area } from "../../models/Area";
import { Cancelacion } from "../../models/Cancelacion";
import useConsumoApi from "../useConsumoApi";

interface Props {
  sucursal: number;
}
export const useCancelaciones = ({ sucursal }: Props) => {
 const { consumoApi } = useConsumoApi();
  const [dataCancelaciones, setCancelaciones] = useState<Cancelacion[]>([]);

  // const fetchCancelaciones = async () => {
  //   try {
  //     const response: AxiosResponse<Cancelacion[]> = await consumoApi.get(`/VentasDia?suc=${sucursal}`);
  //     setCancelaciones(response.data);
  //     console.log({ dataCancelaciones });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const fetchCancelaciones = async () => {
    try {
      const response: AxiosResponse<Cancelacion[]> = await consumoApi.get(
        `/api/Ventas/VentasDia?suc=${sucursal}`
      );
      setCancelaciones(response.data);
      console.log("Cancelaciones:", response.data);
    } catch (error) {
      console.error("Error al obtener cancelaciones:", error);
    }
  };


  useEffect(() => {
    if(!sucursal) return;
    fetchCancelaciones();
  }, [sucursal]);

  return { dataCancelaciones, fetchCancelaciones };
};
