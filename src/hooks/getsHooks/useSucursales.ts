import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
//import { Marca } from "../../models/Marca";
import { Sucursal } from "../../models/Sucursal";
import useConsumoApi from "../useConsumoApi";
import { CatSucursalApis } from "../../pages/CatSucursal/apis/CatSucursalApis";

export const useSucursales = () => {
  const [dataSucursales, setDataSucursales] = useState<Sucursal[]>([]);
  const { consumoApi } = useConsumoApi();

  const fetchSucursales = async () => {
    try {
      const response: AxiosResponse<Sucursal[]> = await consumoApi.get(CatSucursalApis.get);
      setDataSucursales(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  return { dataSucursales, fetchSucursales };
};
