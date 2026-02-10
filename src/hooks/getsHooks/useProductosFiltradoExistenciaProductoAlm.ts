import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { ProductoExistencia } from "../../models/Producto";
// import { jezaApi } from "../../api/jezaApi";
import { useAlmacen } from "../getsHooks/useAlmacen";
import useConsumoApi from "../../hooks/useConsumoApi";
interface Props {
  descripcion: string;
  inventariable: number;
  servicio: number;
  insumo: number;
  obsoleto: number;
  sucursal: number;
  cia: number;
  almacen: number;
  idCliente: number;
}
export const useProductosFiltradoExistenciaProductoAlm = ({
  descripcion,
  insumo,
  inventariable,
  obsoleto,
  servicio,
  sucursal,
  almacen,
  cia,
  idCliente,
}: Props) => {
  const { consumoApi } = useConsumoApi();
  const { dataAlmacenes } = useAlmacen();
  const [dataProductos4, setDataProductos4] = useState<ProductoExistencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProduct4 = async () => {
    if (sucursal > 0) {
      setIsLoading(true);

      const objetoEncontrado = dataAlmacenes.find(
        (item) => item.sucursal === sucursal && item.almacen === almacen
      );

      const idAlmacen = almacen <= 2 ? objetoEncontrado?.id : almacen;

      if (idAlmacen) {
        try {
          const response: AxiosResponse<ProductoExistencia[]> = await consumoApi.get(
              `/api/Ventas/sp_cPSEAC5optimizado?id=0&descripcion=${ descripcion ? descripcion : "%25"}&verInventariable=${inventariable}&esServicio=${servicio}&esInsumo=${insumo}&obsoleto=${obsoleto}&marca=%25&cia=${cia}&sucursal=${sucursal}&almacen=${idAlmacen}&idCliente=${idCliente || 40824}&es_kit=0`
            // `/api/Ventas/cPSEAC?id=0&descripcion=${ descripcion ? descripcion : "%25"}&verInventariable=${inventariable}&esServicio=${servicio}&esInsumo=${insumo}&obsoleto=${obsoleto}&marca=%25&cia=${cia}&sucursal=${sucursal}&almacen=${idAlmacen}&idCliente=${idCliente || 40824}&es_kit=0`
          );

          setDataProductos4(response.data);
        } catch (error) {
          console.error("Error al obtener productos:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("No se encontró el ID del almacén.");
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProduct4();
  }, [dataAlmacenes]);

  useEffect(() => {
    if(!sucursal) return;
    fetchProduct4();
  }, [descripcion, inventariable, insumo, obsoleto, servicio, almacen, sucursal]);

  return { dataProductos4, fetchProduct4, setDataProductos4, isLoading };
};

// export const useProductosFiltradoExistenciaProductoAlm = ({
//   descripcion,
//   insumo,
//   inventariable,
//   obsoleto,
//   servicio,
//   sucursal,
//   almacen,
//   cia,
//   idCliente,
// }: Props) => {
//   const { consumoApi } = useConsumoApi();
//   const { dataAlmacenes } = useAlmacen();
//   const [dataProductos4, setDataProductos4] = useState<ProductoExistencia[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const fetchProduct4 = async () => {
//     if (sucursal > 0) {
//       setIsLoading(true);

//       const objetoEncontrado = dataAlmacenes.find((item) => item.sucursal === sucursal && item.almacen === almacen);

//       // if ((objetoEncontrado && objetoEncontrado.id) || almacen > 2) {
//       //   try {
//       //     const response: AxiosResponse<ProductoExistencia[]> = await consumoApi.get(
//       //       `/sp_cPSEAC?id=0&descripcion=${
//       //         descripcion ? descripcion : "%"
//       //       }&verinventariable=${inventariable}&esServicio=${servicio}&esInsumo=${insumo}&obsoleto=${obsoleto}&marca=%&cia=${cia}&sucursal=${sucursal}&almacen=${
//       //         almacen <= 2 ? objetoEncontrado?.id : almacen
//       //       }&idCliente=${idCliente ? idCliente : 40826}`
//       //     );

//       if ((objetoEncontrado && objetoEncontrado.id) || almacen > 2) {
//         try {
//           const response: AxiosResponse<ProductoExistencia[]> = await consumoApi.get(
//             `/api/Ventas/cPSEAC?id=0&descripcion=${
//               descripcion ? encodeURIComponent(descripcion) : "%25"
//             }&verInventariable=${inventariable}&esServicio=${servicio}&esInsumo=${insumo}&obsoleto=${obsoleto}&marca=%25&cia=${cia}&sucursal=${sucursal}&almacen=${
//               almacen <= 2 ? objetoEncontrado?.id : almacen
//             }&idCliente=${idCliente ? idCliente : 40824}&es_kit=0`
//           );
          
//           setDataProductos4(response.data);
//           console.log({ dataProductos4 });
//           setIsLoading(false);
//         } catch (error) {
//           console.log(error);
//         }
//       } else {
//         console.log("No se encontró un objeto que cumpla los criterios de búsqueda.");
//       }
//     } else {
//       return;
//     }
//   };

//   useEffect(() => {
//     fetchProduct4();
//   }, [dataAlmacenes]);
//   useEffect(() => {
//     fetchProduct4();
//   }, [descripcion, inventariable, descripcion]);

//   return { dataProductos4, fetchProduct4, setDataProductos4, isLoading };
// };
