import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { FormaPago } from "../../models/FormaPago";
//import useSeguridad from "./useSeguridad";
import { Usuario } from "../../models/Usuario";
import useConsumoApi from "../useConsumoApi";

export const useFormasPagos = () => {
  const { consumoApi } = useConsumoApi();
  const [dataFormasPagos, setFormasPagos] = useState<FormaPago[]>([]);
  // const { filtroSeguridad, session } = useSeguridad();
  useEffect(() => {
    const item = localStorage.getItem("userLoggedv2");
    if (item !== null) {
      try {
        const parsedItem = JSON.parse(item);
        setSession(parsedItem); // Aquí estableces el valor de session con parsedItem
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
      }
    }
  }, []);
  const [session, setSession] = useState<Usuario[]>([]);

  const fetchFormasPagos = async () => {
    // const permiso = await filtroSeguridad("VTA_FPA_GET");
    consumoApi.get(`/Permiso?usuario=${session[0]?.id}&modulo=VTA_FPA_GET`).then(async (response) => {
      console.log(response.data[0].permiso);
      if (response.data[0].permiso === false) {
        try {
          const response: AxiosResponse<FormaPago[]> = await consumoApi.get("/FormaPago?id=%");
          setFormasPagos(response.data);
          console.log({ dataFormasPagos });
        } catch (error) {
          console.log(error);
        }
      } else {
        try {
          const response: AxiosResponse<FormaPago[]> = await consumoApi.get("/FormaPagoPrepagos?id=%");
          setFormasPagos(response.data);
          console.log({ dataFormasPagos });
        } catch (error) {
          console.log(error);
        }
      }
    });
    return;
  };

  useEffect(() => {
    if(!session) return;
    fetchFormasPagos();
  }, [session]);

  return { dataFormasPagos, fetchFormasPagos };
};
