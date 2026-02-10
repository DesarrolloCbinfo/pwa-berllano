import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { CompraProveedor } from "../../models/CompraProveedor";
import useConsumoApi from "../../hooks/useConsumoApi";

export const useComprasV3 = (proveedor: number, id_compra: any, sucursal: number, cia: number) => {
  const { consumoApi } = useConsumoApi();
  const [dataComprasGeneral, setDataComprasGeneral] = useState<CompraProveedor[]>([]);

  const fetchCompras = async () => {
    try {
      const response: AxiosResponse<any[]> = await consumoApi.get(
        `/api/Compras/Compra?cia=${cia}&sucursal=${sucursal}&id=%&proveedor=${proveedor}&idCompra=${id_compra}`
      );
      console.log("📦 Data recibida:", response.data);
      setDataComprasGeneral(response.data);
      console.log({ dataComprasGeneral });
    } catch (error) {
      console.log({ error });
    }
  };

  useEffect(() => {
    if(!sucursal) return;
    fetchCompras();
  }, [proveedor, id_compra, sucursal]);

  return { dataComprasGeneral, fetchCompras, setDataComprasGeneral };
};
