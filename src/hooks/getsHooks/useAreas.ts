import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
// import { jezaApi } from "../../api/jezaApi";
import { Area } from "../../models/Area";
import useConsumoApi from "../useConsumoApi";
import { CatAreasApis } from "../../pages/CatAreas/apis/CatAreasApis";

export const useAreas = () => {
  const { consumoApi } = useConsumoApi();
  const [dataAreas, setAreas] = useState<Area[]>([]);

  const fetchAreas = async () => {
    try {
      const response: AxiosResponse<Area[]> = await consumoApi.get(CatAreasApis.get);
      setAreas(response.data);
      console.log({ dataAreas });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  return { dataAreas, fetchAreas };
};
