import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
import { Marca } from "../../models/Marca";
import { Cia } from "../../models/Cia";
import useConsumoApi from "../useConsumoApi";
import { CatCiasApis } from "../../pages/CatCias/apis/CatCiasApis";

export const useCias = () => {
  const { consumoApi } = useConsumoApi();
  const [dataCias, setCias] = useState<Cia[]>([]);

  const fetchCias = async () => {
    try {
      const response: AxiosResponse<Cia[]> = await consumoApi.get(CatCiasApis.get);
      setCias(response.data);
      console.log({ dataCias });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCias();
  }, []);

  return { dataCias, fetchCias };
};
