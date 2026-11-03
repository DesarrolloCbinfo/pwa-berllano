export interface PedidosARecepcionarFiltros {
  proveedor?: string;
  cveSucursal: number;
  folio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  pageNumber: number;
  pageSize: number;
}

export const RecepcionMercanciaApis = {
  pedidosARecepcionar: (filtros: PedidosARecepcionarFiltros) => {
    const pagina = Math.max(1, Math.trunc(filtros.pageNumber) || 1);
    const tamanoPagina = Math.min(
      100,
      Math.max(1, Math.trunc(filtros.pageSize) || 10)
    );
    const sucursal = Math.trunc(filtros.cveSucursal);
    if (!Number.isFinite(sucursal) || sucursal <= 0) {
      throw new Error("La sucursal de la sesión no es válida.");
    }

    const params = new URLSearchParams({
      proveedor: filtros.proveedor?.trim() || "%",
      cve_sucursal: String(sucursal),
      pageNumber: String(pagina),
      pageSize: String(tamanoPagina),
    });

    if (filtros.folio != null && filtros.folio > 0) {
      params.set("folio", String(Math.trunc(filtros.folio)));
    }
    if (filtros.fechaInicio?.trim()) {
      params.set("fechaInicio", filtros.fechaInicio.trim());
    }
    if (filtros.fechaFin?.trim()) {
      params.set("fechaFin", filtros.fechaFin.trim());
    }

    return `/api/RecepcionMercancia/pedidos-a-recepcionar?${params.toString()}`;
  },
  pedidoDetalle: (folio: number, cveSucursal: number) => {
    const sucursal = Math.trunc(cveSucursal);
    if (!Number.isFinite(sucursal) || sucursal <= 0) {
      throw new Error("La sucursal de la sesión no es válida.");
    }
    return `/api/RecepcionMercancia/pedido/${folio}?cve_sucursal=${sucursal}`;
  },
  validarClave: (clave: string) =>
    `/api/RecepcionMercancia/validar-clave?clave=${encodeURIComponent(
      clave.trim()
    )}`,
  intermediaBase: "/api/RecepcionMercancia/intermedia",
  intermedia: (folio: number, cveSucursal: number) => {
    const sucursal = Math.trunc(cveSucursal);
    if (!Number.isFinite(sucursal) || sucursal <= 0) {
      throw new Error("La sucursal de la sesión no es válida.");
    }
    return `/api/RecepcionMercancia/intermedia/${folio}?cve_sucursal=${sucursal}`;
  },
  intermediaPorId: (id: number) => `/api/RecepcionMercancia/intermedia/${id}`,
  finalizar: "/api/RecepcionMercancia/finalizar",
};
