export const RecepcionMercanciaApis = {
  pedidosARecepcionar: (
    proveedor: string | undefined,
    cveSucursal: number,
    pageNumber: number,
    pageSize: number
  ) => {
    const pagina = Math.max(1, Math.trunc(pageNumber) || 1);
    const tamanoPagina = Math.min(100, Math.max(1, Math.trunc(pageSize) || 10));
    const sucursal = Math.max(1, Math.trunc(cveSucursal) || 1);
    const params = new URLSearchParams({
      proveedor: proveedor?.trim() ?? "",
      cve_sucursal: String(sucursal),
      pageNumber: String(pagina),
      pageSize: String(tamanoPagina),
    });
    return `/api/RecepcionMercancia/pedidos-a-recepcionar?${params.toString()}`;
  },
  pedidoDetalle: (folio: number, cveSucursal: number) => {
    const sucursal = Math.max(1, Math.trunc(cveSucursal) || 1);
    return `/api/RecepcionMercancia/pedido/${folio}?cve_sucursal=${sucursal}`;
  },
  intermediaBase: "/api/RecepcionMercancia/intermedia",
  intermedia: (folio: number, cveSucursal: number) => {
    const sucursal = Math.max(1, Math.trunc(cveSucursal) || 1);
    return `/api/RecepcionMercancia/intermedia/${folio}?cve_sucursal=${sucursal}`;
  },
  intermediaPorId: (id: number) => `/api/RecepcionMercancia/intermedia/${id}`,
  finalizar: "/api/RecepcionMercancia/finalizar",
};
