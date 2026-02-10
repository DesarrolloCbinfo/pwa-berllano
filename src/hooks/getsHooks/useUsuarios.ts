import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
import { Usuario } from "../../models/Usuario";
import useConsumoApi from "../useConsumoApi";

export const useUsuarios = () => {
  const { consumoApi } = useConsumoApi();
  const [dataUsuarios, setDataUsuarios] = useState<Usuario[]>([]);

  const fetchUsuarios = async () => {
    try {
      const response: AxiosResponse<Usuario[]> = await consumoApi.get("/Usuario?id=0");
      setDataUsuarios(response.data);
      console.log({ dataUsuarios });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return { dataUsuarios, fetchUsuarios };
};
