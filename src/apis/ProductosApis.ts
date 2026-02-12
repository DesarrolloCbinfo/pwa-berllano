export const ProductosApis = {
  getCantidades: (clave_prod: string) => `/api/PuntoDeVenta/sp_fw_pos_cat_productos_cantidades_sel?clave_prod=${clave_prod}`
};
