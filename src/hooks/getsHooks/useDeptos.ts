import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
//import { Area } from "../../models/Area";
import { Departamento } from "../../models/Departamento";
import useConsumoApi from "../useConsumoApi";
import { CatDeptoApis } from "../../pages/CatDepto/apis/CatDeptoApis";

export const useDeptos = () => {
  const { consumoApi } = useConsumoApi();
  const [dataDeptos, setDeptos] = useState<Departamento[]>([]);

  const fetchAreas = async () => {
    try {
      const response: AxiosResponse<Departamento[]> = await consumoApi.get(CatDeptoApis.get(0));
      setDeptos(response.data);
      console.log({ dataDeptos });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  return { dataDeptos, fetchAreas };
};
