import { useEffect, useState } from "react";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { IFormaPagoFactura } from "../interfaces/IFactura";

export const useTiposFormasPagosFactura = () => {
  const { consumoApi } = useConsumoApi();
  const [dataTiposFormasPagos, setTiposFormasPagos] = useState<IFormaPagoFactura[]>([]);

  const fetchTiposFormasPagos = async () => {
    try {
      const response = await consumoApi.get<IFormaPagoFactura[]>(
        "/api/DetalleServicios/cat_tipos_formas_pagos_factura?id=0"
      );
      setTiposFormasPagos(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTiposFormasPagos();
  }, []);

  return { dataTiposFormasPagos, fetchTiposFormasPagos };
};
