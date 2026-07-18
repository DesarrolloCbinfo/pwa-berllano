import { useEffect, useState } from "react";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { ITipoFacturacion } from "../interfaces/IFactura";

export const useTipoFacturacion = () => {
  const { consumoApi } = useConsumoApi();
  const [dataTipoFacturacion, setDataTipoFacturacion] = useState<ITipoFacturacion[]>([]);

  const fetchTipoFacturacion = async () => {
    try {
      const response = await consumoApi.get<ITipoFacturacion[]>(
        "/api/CatClientes/cat_tipo_facturacion_sel?id=0"
      );
      setDataTipoFacturacion(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTipoFacturacion();
  }, []);

  return { dataTipoFacturacion, fetchTipoFacturacion };
};
