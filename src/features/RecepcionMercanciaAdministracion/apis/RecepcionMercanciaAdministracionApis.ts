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
  actualizarAdministracion: (payload: {
    id: number;
    cantidad_administracion: number;
    cantidad_bonificacion_admin: number;
    cantidad_bonificacion_r: number;
    costo_administracion: number;
    porcentaje_iva: number;
    nuevo_precio: number;
    actualizar_catalogo: boolean;
    observaciones: string;
  }) => {
    const num = (valor: unknown) => {
      const n = Number(valor);
      return Number.isFinite(n) ? n : 0;
    };
    const idNormalizado = Math.trunc(num(payload.id));
    if (!Number.isFinite(idNormalizado) || idNormalizado <= 0) {
      throw new Error("El id debe ser mayor a 0.");
    }

    const params = new URLSearchParams({
      id: String(idNormalizado),
      cantidad_administracion: String(num(payload.cantidad_administracion)),
      cantidad_bonificacion_admin: String(
        num(payload.cantidad_bonificacion_admin)
      ),
      cantidad_bonificacion_r: String(num(payload.cantidad_bonificacion_r)),
      costo_administracion: String(num(payload.costo_administracion)),
      porcentaje_iva: String(num(payload.porcentaje_iva)),
      nuevo_precio: String(num(payload.nuevo_precio)),
      actualizar_catalogo: payload.actualizar_catalogo ? "true" : "false",
      observaciones: payload.observaciones ?? "",
    });

    return `/api/PedidosProveedores/sp_update_recepcion_administracion?${params.toString()}`;
  },
  finalizarAdministracion: (folio: number, cveSucursal: number) => {
    const folioNormalizado = Math.trunc(folio);
    const sucursalNormalizada = Math.trunc(cveSucursal);

    if (!Number.isFinite(folioNormalizado) || folioNormalizado <= 0) {
      throw new Error("El folio debe ser mayor a 0.");
    }
    if (!Number.isFinite(sucursalNormalizada) || sucursalNormalizada <= 0) {
      throw new Error("La sucursal debe ser mayor a 0.");
    }

    return `/api/PedidosProveedores/sp_put_finalizacion_administracion?folio=${folioNormalizado}&cve_sucursal=${sucursalNormalizada}`;
  },
};
