import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
import { Cliente } from "../../models/Cliente";
import useConsumoApi from "../useConsumoApi";
import { CatClientesApis } from "../../pages/CatClientes/apis/CatClientesApis";

export const useClientes = () => {
  const { consumoApi } = useConsumoApi();
  const [dataClientes, setDataClientes] = useState<Cliente[]>([]);

  const fetchClientes = async () => {
    try {
      const response: AxiosResponse<Cliente[]> = await consumoApi.get(CatClientesApis.get);
      setDataClientes(response.data);
      // console.log({ dataClientes });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return { dataClientes, fetchClientes, setDataClientes };
};
