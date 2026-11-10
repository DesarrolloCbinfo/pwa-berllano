export const RecepcionMercanciaAdministracionApis = {
  administracion: (sucursal: number, folio: number) => {
    const sucursalNormalizada = Math.trunc(sucursal);
    const folioNormalizado = Math.trunc(folio);

    if (!Number.isFinite(sucursalNormalizada) || sucursalNormalizada <= 0) {
      throw new Error("La sucursal debe ser mayor a 0.");
    }
    if (!Number.isFinite(folioNormalizado) || folioNormalizado <= 0) {
      throw new Error("El folio debe ser mayor a 0.");
    }

    const params = new URLSearchParams({
      sucursal: String(sucursalNormalizada),
      folio: String(folioNormalizado),
    });

    return `/api/PedidosProveedores/sp_get_recepcion_administracion?${params.toString()}`;
  },
};
